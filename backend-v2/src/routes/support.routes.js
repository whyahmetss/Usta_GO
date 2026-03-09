import { Router } from 'express'
import * as adminController from '../controllers/admin.controller.js'
import * as messageService from '../services/message.service.js'
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

// All routes below require SUPPORT or ADMIN role
router.use(authMiddleware, supportMiddleware)

router.get('/pending-ustas', adminController.getPendingUstas)
router.patch('/users/:userId/approve-usta', adminController.approveUsta)
router.patch('/users/:userId/reject-usta', adminController.rejectUsta)

// Support conversations: list all unique users who messaged this support agent
router.get('/conversations', async (req, res) => {
  try {
    const agentId = req.user.id

    // Get all messages involving this support agent
    const msgs = await prisma.message.findMany({
      where: {
        OR: [{ senderId: agentId }, { receiverId: agentId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, profileImage: true, role: true } },
        receiver: { select: { id: true, name: true, profileImage: true, role: true } },
      },
    })

    // Build unique conversations keyed by the OTHER user's id
    const convMap = new Map()
    for (const msg of msgs) {
      const otherUser = msg.senderId === agentId ? msg.receiver : msg.sender
      if (!otherUser || otherUser.id === agentId) continue
      if (!convMap.has(otherUser.id)) {
        convMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unread: 0,
        })
      }
      // Count unread from this user
      if (msg.senderId === otherUser.id && !msg.isRead) {
        convMap.get(otherUser.id).unread += 1
      }
    }

    res.json({ success: true, data: Array.from(convMap.values()) })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

export default router
