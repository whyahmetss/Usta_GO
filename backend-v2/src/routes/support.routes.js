import { Router } from 'express'
import * as adminController from '../controllers/admin.controller.js'
import * as sessionCtrl from '../controllers/supportSession.controller.js'
import { authMiddleware, supportMiddleware } from '../middlewares/auth.middleware.js'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// Public: list available support agents (authed users only)
router.get('/agents', authMiddleware, async (req, res) => {
  try {
    const agents = await prisma.user.findMany({
      where: { role: 'SUPPORT', isActive: true },
      select: { id: true, name: true, profileImage: true, status: true },
    })
    res.json({ success: true, data: agents })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

// Session endpoints (any authenticated user)
router.post('/sessions/open', authMiddleware, sessionCtrl.openSession)
router.post('/sessions/close', authMiddleware, sessionCtrl.closeSession)
router.post('/sessions/rate', authMiddleware, sessionCtrl.rateSession)
router.get('/sessions/mine', authMiddleware, sessionCtrl.getMySession)

// All routes below require SUPPORT or ADMIN role
router.use(authMiddleware, supportMiddleware)

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
