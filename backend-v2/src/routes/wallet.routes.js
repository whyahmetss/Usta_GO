import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { walletController } from '../controllers/wallet.controller.js';

const router = express.Router();

router.get('/', authMiddleware, walletController.getWalletBalance);
router.post('/topup', authMiddleware, walletController.topup);
router.post('/topup/init', authMiddleware, walletController.topupInit);
router.get('/topup/callback', walletController.topupCallback);
router.post('/topup/callback', walletController.topupCallback);
router.get('/transactions', authMiddleware, walletController.getTransactions);
router.get('/admin/withdrawals', authMiddleware, walletController.getAllWithdrawals);
router.post('/withdraw', authMiddleware, walletController.createWithdrawal);
router.post('/coupon', authMiddleware, walletController.redeemCoupon);
router.patch('/withdraw/:id/approve', authMiddleware, walletController.approveWithdrawal);
router.patch('/withdraw/:id/reject', authMiddleware, walletController.rejectWithdrawal);

export default router;
