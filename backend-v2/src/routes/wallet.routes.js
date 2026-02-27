import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { walletController } from '../controllers/wallet.controller.js';

const router = express.Router();

router.get('/', authMiddleware, walletController.getWalletBalance);
router.get('/transactions', authMiddleware, walletController.getTransactions);
router.post('/withdraw', authMiddleware, walletController.createWithdrawal);
router.patch('/withdraw/:id/approve', authMiddleware, walletController.approveWithdrawal);
router.patch('/withdraw/:id/reject', authMiddleware, walletController.rejectWithdrawal);

export default router;
