import { Router } from 'express'
import * as adminController from '../controllers/admin.controller.js'
import { authMiddleware, supportMiddleware } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(authMiddleware, supportMiddleware)

router.get('/pending-ustas', adminController.getPendingUstas)
router.patch('/users/:userId/approve-usta', adminController.approveUsta)
router.patch('/users/:userId/reject-usta', adminController.rejectUsta)

export default router
