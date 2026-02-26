import { jobService } from '../services/job.service.js';

export const walletController = {
  getWalletBalance: async (req, res) => {
    try {
      // Sadece giriş yapan ustanın (req.user.id) bitmiş işlerini çekiyoruz
      // Veritabanındaki ustaId ve büyük harf COMPLETED/RATED durumlarına dikkat
      const jobs = await jobService.getJobsByUstaId(req.user.id);
      
      const completedJobs = jobs.filter(j => 
        ['COMPLETED', 'RATED'].includes(j.status)
      );

      const balance = completedJobs.reduce((sum, job) => sum + (job.budget || 0), 0);

      res.json({
        success: true,
        balance: balance,
        completedCount: completedJobs.length
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};
2. Adım: Route Tanımla
src/routes/ içine wallet.routes.js oluştur.

JavaScript
// src/routes/wallet.routes.js
import express from 'express';
import { walletController } from '../controllers/wallet.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Giriş yapmamış adam cüzdan göremez
router.get('/', authMiddleware, walletController.getWalletBalance);

export default router;
3. Adım: Ana Sunucuya (index.js) Bağla
src/index.js dosyasını aç ve diğer rotaların yanına bunu da ekle:

JavaScript
import walletRoutes from './routes/wallet.routes.js';

// ... diğer app.use satırlarının altına
app.use('/api/wallet', walletRoutes);
