import express from 'express';
import {
  getWallet,
  getTransactions,
  topupWallet,
  withdrawWallet,
  addCoupon,
  releaseEscrow,
  getEarnings,
} from '../controllers/walletController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateTransaction } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Wallet routes
router.get('/', getWallet);
router.get('/transactions', getTransactions);
router.get('/earnings', getEarnings);
router.post('/topup', validateTransaction, topupWallet);
router.post('/withdraw', validateTransaction, withdrawWallet);
router.post('/coupon', addCoupon);
router.post('/escrow-release/:jobId', releaseEscrow);

export default router;
