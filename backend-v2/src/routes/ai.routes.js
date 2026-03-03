import { Router } from 'express'
import { analyzeJob } from '../controllers/ai.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'

const router = Router()

/**
 * POST /api/ai/analyze
 * Body: { description: string, address?: string }
 * Müşteri açıklamasını Gemini ile sınıflandırır,
 * DB fiyatlarıyla tahmini ücret üretir.
 */
router.post('/analyze', authMiddleware, analyzeJob)

export default router
