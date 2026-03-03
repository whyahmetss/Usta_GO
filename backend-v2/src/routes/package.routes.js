import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { packageController } from '../controllers/package.controller.js';

const router = express.Router();

// Müşteri
router.get('/my', authMiddleware, packageController.getMyPackage);
router.post('/buy', authMiddleware, packageController.buyPackage);
router.patch('/auto-renew', authMiddleware, packageController.toggleAutoRenew);

// Admin
router.get('/admin', authMiddleware, packageController.getAdminPackages);
router.patch('/admin/:packageId', authMiddleware, packageController.updateAdminPackage);

export default router;
