// src/routes/wallet.routes.js
import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Ana bakiye rotası
router.get('/', authMiddleware, (req, res) => {
  res.json({ success: true, balance: 173 }); // Şimdilik elle yazdık
});

// EKSİK OLAN KISIM BURASIYDI:
router.get('/transactions', authMiddleware, (req, res) => {
  // Burası frontend'deki "İşlem Geçmişi" kısmını dolduracak
  res.json({ 
    success: true, 
    data: [
      { id: 1, title: 'Genel Elektrik', amount: 173, type: 'EARNING', date: new Date() }
    ] 
  });
});

export default router;
