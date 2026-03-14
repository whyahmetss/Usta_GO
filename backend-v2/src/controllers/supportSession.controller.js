import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Open a new session (or return existing OPEN one)
export const openSession = async (req, res) => {
  try {
    const userId = req.user.id
    const { agentId } = req.body
    if (!agentId) return res.status(400).json({ success: false, error: 'agentId gerekli' })

    // Reuse existing open session between same user+agent
    let session = await prisma.supportSession.findFirst({
      where: { userId, agentId, status: 'OPEN' },
    })
    
    const isNewSession = !session
    
    if (!session) {
      session = await prisma.supportSession.create({
        data: { userId, agentId },
      })
      
      // Socket.IO: Notify agent about new session
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, role: true } })
      const io = req.app.get('io')
      if (io && agentId !== 'offline-support') {
        const sessionPayload = {
          sessionId: session.id,
          userId,
          userName: user?.name || 'Kullanıcı',
          userRole: user?.role || 'CUSTOMER',
          openedAt: session.openedAt,
        }
        io.to(`user_${agentId}`).emit('new_support_session', sessionPayload)
        io.to('support_room').emit('new_support_session', sessionPayload)
      }
    }
    
    res.json({ success: true, data: session, isNew: isNewSession })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
}

// Close session + save rating
export const closeSession = async (req, res) => {
  try {
    const userId = req.user.id
    const { sessionId, rating, ratingNote } = req.body

    const session = await prisma.supportSession.findUnique({ where: { id: sessionId } })
    if (!session) return res.status(404).json({ success: false, error: 'Oturum bulunamadı' })
    if (session.userId !== userId && session.agentId !== userId) {
      return res.status(403).json({ success: false, error: 'Yetkisiz' })
    }

    const updated = await prisma.supportSession.update({
      where: { id: sessionId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        ...(rating != null && { rating: Math.min(5, Math.max(1, Number(rating))) }),
        ...(ratingNote && { ratingNote }),
      },
    })
    res.json({ success: true, data: updated })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
}

// Rate session (user rates agent after close)
export const rateSession = async (req, res) => {
  try {
    const userId = req.user.id
    const { sessionId, rating, ratingNote } = req.body
    const session = await prisma.supportSession.findUnique({ where: { id: sessionId } })
    if (!session || session.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Yetkisiz' })
    }
    const updated = await prisma.supportSession.update({
      where: { id: sessionId },
      data: { rating: Math.min(5, Math.max(1, Number(rating))), ratingNote: ratingNote || null },
    })
    res.json({ success: true, data: updated })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
}

// Admin/Support: get all sessions with stats
export const getAllSessions = async (req, res) => {
  try {
    const { status, agentId } = req.query
    const where = {}
    if (status) where.status = status
    if (agentId) where.agentId = agentId

    const sessions = await prisma.supportSession.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        agent: { select: { id: true, name: true, email: true } },
      },
      orderBy: { openedAt: 'desc' },
    })

    // Aggregate stats per agent
    const agentStats = {}
    for (const s of sessions) {
      const aid = s.agentId
      if (!agentStats[aid]) {
        agentStats[aid] = { agent: s.agent, total: 0, open: 0, closed: 0, ratings: [], avgRating: null }
      }
      agentStats[aid].total++
      if (s.status === 'OPEN') agentStats[aid].open++
      else agentStats[aid].closed++
      if (s.rating != null) agentStats[aid].ratings.push(s.rating)
    }
    for (const aid of Object.keys(agentStats)) {
      const r = agentStats[aid].ratings
      agentStats[aid].avgRating = r.length > 0 ? (r.reduce((a, b) => a + b, 0) / r.length).toFixed(1) : null
    }

    res.json({ success: true, data: { sessions, agentStats: Object.values(agentStats) } })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
}

// Get active session for current user (to resume)
export const getMySession = async (req, res) => {
  try {
    const userId = req.user.id
    const session = await prisma.supportSession.findFirst({
      where: { userId, status: 'OPEN' },
      include: { agent: { select: { id: true, name: true, profileImage: true } } },
      orderBy: { openedAt: 'desc' },
    })
    res.json({ success: true, data: session || null })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
}
