import { Router } from 'express'
import * as adminController from '../controllers/admin.controller.js'
import * as sessionCtrl from '../controllers/supportSession.controller.js'
import { authMiddleware, supportMiddleware } from '../middlewares/auth.middleware.js'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// Public: list ONLINE support agents (isActive=true means "online")
router.get('/agents', authMiddleware, async (req, res) => {
  try {
    const agents = await prisma.user.findMany({
      where: { role: 'SUPPORT', isActive: true, status: 'ACTIVE' },
      select: { id: true, name: true, profileImage: true, status: true, isActive: true },
    })

    let fallbackAgent = null
    if (agents.length === 0) {
      fallbackAgent = await prisma.user.findFirst({
        where: { role: { in: ['SUPPORT', 'ADMIN'] } },
        select: { id: true, name: true, profileImage: true },
        orderBy: { createdAt: 'asc' },
      })
    }

    res.json({ success: true, data: agents, fallbackAgent })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// Session endpoints (any authenticated user)
router.post('/sessions/open', authMiddleware, sessionCtrl.openSession)
router.post('/sessions/close', authMiddleware, sessionCtrl.closeSession)
router.post('/sessions/rate', authMiddleware, sessionCtrl.rateSession)
router.get('/sessions/mine', authMiddleware, sessionCtrl.getMySession)

// Save AI reply as a message from the agent (so support can see it when they come online)
router.post('/save-ai-reply', authMiddleware, async (req, res) => {
  try {
    const { userId, agentId, content, sessionId } = req.body
    if (!agentId || !content) {
      return res.status(400).json({ success: false, error: 'agentId and content required' })
    }
    const msg = await prisma.message.create({
      data: {
        senderId: agentId,
        receiverId: userId || req.user.id,
        content,
        isRead: false,
      },
    })
    res.json({ success: true, data: msg })
  } catch (e) {
    console.error('Save AI reply error:', e)
    res.status(500).json({ success: false, error: e.message })
  }
})

// All routes below require SUPPORT or ADMIN role
router.use(authMiddleware, supportMiddleware)

// Toggle online/offline status for support agent
router.patch('/toggle-status', async (req, res) => {
  try {
    const userId = req.user.id
    const current = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } })
    const newStatus = !current?.isActive
    await prisma.user.update({ where: { id: userId }, data: { isActive: newStatus } })
    res.json({ success: true, data: { isActive: newStatus } })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

router.get('/pending-ustas', adminController.getPendingUstas)
router.patch('/users/:userId/approve-usta', adminController.approveUsta)
router.patch('/users/:userId/reject-usta', adminController.rejectUsta)

router.get('/pending-customers', adminController.getPendingCustomers)
router.patch('/users/:userId/approve-customer', adminController.approveCustomer)
router.patch('/users/:userId/reject-customer', adminController.rejectCustomer)

// Support conversations: list unique users who messaged support agents
router.get('/conversations', async (req, res) => {
  try {
    const role = (req.user.role || '').toUpperCase()
    const isAdmin = role === 'ADMIN'

    let whereClause
    if (isAdmin) {
      // Admin sees ALL conversations involving any SUPPORT role user
      const supportAgents = await prisma.user.findMany({
        where: { role: 'SUPPORT' },
        select: { id: true },
      })
      const agentIds = supportAgents.map(a => a.id)
      agentIds.push(req.user.id) // include admin's own convos too
      whereClause = {
        OR: [
          { senderId: { in: agentIds } },
          { receiverId: { in: agentIds } },
        ],
      }
    } else {
      whereClause = {
        OR: [{ senderId: req.user.id }, { receiverId: req.user.id }],
      }
    }

    const msgs = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, profileImage: true, role: true } },
        receiver: { select: { id: true, name: true, profileImage: true, role: true } },
      },
    })

    // Build unique conversations keyed by the non-support user's id
    const convMap = new Map()
    for (const msg of msgs) {
      // Identify the "customer" side
      const senderRole = (msg.sender?.role || '').toUpperCase()
      const receiverRole = (msg.receiver?.role || '').toUpperCase()
      let customerUser
      if (senderRole !== 'SUPPORT' && senderRole !== 'ADMIN') {
        customerUser = msg.sender
      } else if (receiverRole !== 'SUPPORT' && receiverRole !== 'ADMIN') {
        customerUser = msg.receiver
      } else {
        continue
      }
      if (!customerUser) continue

      if (!convMap.has(customerUser.id)) {
        convMap.set(customerUser.id, {
          user: customerUser,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unread: 0,
        })
      }
      if (!msg.isRead && (msg.receiverId === req.user.id || isAdmin)) {
        convMap.get(customerUser.id).unread += 1
      }
    }

    res.json({ success: true, data: Array.from(convMap.values()) })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// Admin/Support monitoring (supportMiddleware already applied above)
router.get('/sessions', sessionCtrl.getAllSessions)

export default router
