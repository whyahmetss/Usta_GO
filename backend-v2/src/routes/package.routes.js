import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { packageController } from '../controllers/package.controller.js';

const router = express.Router();

router.get('/my', authMiddleware, packageController.getMyPackage);
router.post('/buy', authMiddleware, packageController.buyPackage);
router.patch('/auto-renew', authMiddleware, packageController.toggleAutoRenew);

export default router;
