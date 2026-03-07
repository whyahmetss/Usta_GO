import express from 'express';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware.js';
import { packageController } from '../controllers/package.controller.js';

const router = express.Router();

// Müşteri
router.get('/my', authMiddleware, packageController.getMyPackage);
router.get('/list', authMiddleware, packageController.getListPackages);
router.post('/buy', authMiddleware, packageController.buyPackage);
router.patch('/auto-renew', authMiddleware, packageController.toggleAutoRenew);

// Admin - sadece ADMIN rolü
router.get('/admin', authMiddleware, roleMiddleware('ADMIN'), packageController.getAdminPackages);
router.patch('/admin/:packageId', authMiddleware, roleMiddleware('ADMIN'), packageController.updateAdminPackage);

export default router;
