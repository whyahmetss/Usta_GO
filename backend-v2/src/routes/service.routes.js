import { Router } from 'express'
import * as serviceController from '../controllers/service.controller.js'
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware.js'

const router = Router()

// Genel: herkese açık (müşteri analiz sonucunda fiyat görebilsin)
router.get('/', serviceController.getServices)

// Admin CRUD
router.post('/',    authMiddleware, adminMiddleware, serviceController.createService)
router.patch('/:id', authMiddleware, adminMiddleware, serviceController.updateService)
router.delete('/:id', authMiddleware, adminMiddleware, serviceController.deleteService)

export default router
