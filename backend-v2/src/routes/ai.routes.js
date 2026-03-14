import { Router } from 'express'
import { analyzeJob, supportChatAI } from '../controllers/ai.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'

const router = Router()

/**
 * POST /api/ai/analyze
 * Body: { description: string, address?: string }
 * Müşteri açıklamasını DeepSeek ile sınıflandırır,
 * DB fiyatlarıyla tahmini ücret üretir.
 */
router.post('/analyze', authMiddleware, analyzeJob)

/**
 * POST /api/ai/support-chat
 * Body: { message: string, conversationHistory?: Array }
 * Canlı destek için AI yanıtı üretir (destek offline olduğunda)
 */
router.post('/support-chat', authMiddleware, supportChatAI)

export default router
