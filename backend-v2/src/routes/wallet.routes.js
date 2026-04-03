import express from 'express';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware.js';
import { walletController } from '../controllers/wallet.controller.js';
import { havaleTalep, taleplerim, adminTalepler, adminOnayla, adminReddet } from '../controllers/havale.controller.js';

const router = express.Router();

router.get('/', authMiddleware, walletController.getWalletBalance);
router.post('/topup', authMiddleware, walletController.topup);
router.post('/topup/init', authMiddleware, walletController.topupInit);
router.get('/topup/callback', walletController.topupCallback);
router.post('/topup/callback', walletController.topupCallback);
router.post('/topup/3ds', authMiddleware, walletController.topup3DSInit);
router.get('/topup/3ds/callback', walletController.topup3DSCallback);
router.post('/topup/3ds/callback', walletController.topup3DSCallback);
router.post('/topup/shopier/init', authMiddleware, walletController.shopierInit);
router.post('/topup/shopier/webhook', walletController.shopierWebhook);
router.get('/transactions', authMiddleware, walletController.getTransactions);
router.get('/admin/transactions', authMiddleware, adminMiddleware, walletController.getAllTransactions);
router.get('/admin/withdrawals', authMiddleware, adminMiddleware, walletController.getAllWithdrawals);
router.post('/withdraw', authMiddleware, walletController.createWithdrawal);
router.post('/coupon', authMiddleware, walletController.redeemCoupon);
router.patch('/withdraw/:id/approve', authMiddleware, adminMiddleware, walletController.approveWithdrawal);
router.patch('/withdraw/:id/reject', authMiddleware, adminMiddleware, walletController.rejectWithdrawal);

// Havale/EFT
router.post('/havale/talep', authMiddleware, havaleTalep);
router.get('/havale/taleplerim', authMiddleware, taleplerim);
router.get('/havale/admin/talepler', authMiddleware, adminMiddleware, adminTalepler);
router.patch('/havale/admin/:id/onayla', authMiddleware, adminMiddleware, adminOnayla);
router.patch('/havale/admin/:id/reddet', authMiddleware, adminMiddleware, adminReddet);

export default router;
