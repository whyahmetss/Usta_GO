import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Test amaçlı bakiye döndüren geçici route
router.get('/', authMiddleware, (req, res) => {
  res.json({ 
    success: true, 
    balance: 0,
    message: "Cüzdan bağlantısı kuruldu!" 
  });
});

export default router;
