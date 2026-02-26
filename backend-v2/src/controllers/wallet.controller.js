import { jobService } from '../services/job.service.js';

export const walletController = {
  getWalletBalance: async (req, res) => {
    try {
      // Ustanın tüm işlerini çek
      const jobs = await jobService.getJobsByUstaId(req.user.id);
      
      // Tamamlananları filtrele (Büyük harf uyumuna dikkat!)
      const completedJobs = jobs.filter(j => 
        ['COMPLETED', 'RATED'].includes(j.status?.toUpperCase())
      );

      // Toplam Kazanç (1.038 TL'yi burası oluşturacak)
      const totalEarnings = completedJobs.reduce((sum, job) => sum + (Number(job.budget) || 0), 0);

      // Şimdilik çekilebilir bakiye ile toplam kazancı aynı gönderiyoruz
      // İleride komisyon keseceksen balance kısmını ona göre güncellersin
      res.json({
        success: true,
        balance: totalEarnings, // Cüzdandaki "Çekilebilir Bakiye" kısmı
        thisMonthEarnings: totalEarnings, // Cüzdandaki "Bu Ay Kazanç" kısmı
        totalEarnings: totalEarnings,
        completedCount: completedJobs.length
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};import { jobService } from '../services/job.service.js';

export const walletController = {
  getWalletBalance: async (req, res) => {
    try {
      // Ustanın tüm işlerini çek
      const jobs = await jobService.getJobsByUstaId(req.user.id);
      
      // Tamamlananları filtrele (Büyük harf uyumuna dikkat!)
      const completedJobs = jobs.filter(j => 
        ['COMPLETED', 'RATED'].includes(j.status?.toUpperCase())
      );

      // Toplam Kazanç (1.038 TL'yi burası oluşturacak)
      const totalEarnings = completedJobs.reduce((sum, job) => sum + (Number(job.budget) || 0), 0);

      // Şimdilik çekilebilir bakiye ile toplam kazancı aynı gönderiyoruz
      // İleride komisyon keseceksen balance kısmını ona göre güncellersin
      res.json({
        success: true,
        balance: totalEarnings, // Cüzdandaki "Çekilebilir Bakiye" kısmı
        thisMonthEarnings: totalEarnings, // Cüzdandaki "Bu Ay Kazanç" kısmı
        totalEarnings: totalEarnings,
        completedCount: completedJobs.length
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};import { jobService } from '../services/job.service.js';

export const walletController = {
  getWalletBalance: async (req, res) => {
    try {
      // Ustanın tüm işlerini çek
      const jobs = await jobService.getJobsByUstaId(req.user.id);
      
      // Tamamlananları filtrele (Büyük harf uyumuna dikkat!)
      const completedJobs = jobs.filter(j => 
        ['COMPLETED', 'RATED'].includes(j.status?.toUpperCase())
      );

      // Toplam Kazanç (1.038 TL'yi burası oluşturacak)
      const totalEarnings = completedJobs.reduce((sum, job) => sum + (Number(job.budget) || 0), 0);

      // Şimdilik çekilebilir bakiye ile toplam kazancı aynı gönderiyoruz
      // İleride komisyon keseceksen balance kısmını ona göre güncellersin
      res.json({
        success: true,
        balance: totalEarnings, // Cüzdandaki "Çekilebilir Bakiye" kısmı
        thisMonthEarnings: totalEarnings, // Cüzdandaki "Bu Ay Kazanç" kısmı
        totalEarnings: totalEarnings,
        completedCount: completedJobs.length
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};import { jobService } from '../services/job.service.js';

export const walletController = {
  getWalletBalance: async (req, res) => {
    try {
      // Ustanın tüm işlerini çek
      const jobs = await jobService.getJobsByUstaId(req.user.id);
      
      // Tamamlananları filtrele (Büyük harf uyumuna dikkat!)
      const completedJobs = jobs.filter(j => 
        ['COMPLETED', 'RATED'].includes(j.status?.toUpperCase())
      );

      // Toplam Kazanç (1.038 TL'yi burası oluşturacak)
      const totalEarnings = completedJobs.reduce((sum, job) => sum + (Number(job.budget) || 0), 0);

      // Şimdilik çekilebilir bakiye ile toplam kazancı aynı gönderiyoruz
      // İleride komisyon keseceksen balance kısmını ona göre güncellersin
      res.json({
        success: true,
        balance: totalEarnings, // Cüzdandaki "Çekilebilir Bakiye" kısmı
        thisMonthEarnings: totalEarnings, // Cüzdandaki "Bu Ay Kazanç" kısmı
        totalEarnings: totalEarnings,
        completedCount: completedJobs.length
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};import { jobService } from '../services/job.service.js';

export const walletController = {
  getWalletBalance: async (req, res) => {
    try {
      // Ustanın tüm işlerini çek
      const jobs = await jobService.getJobsByUstaId(req.user.id);
      
      // Tamamlananları filtrele (Büyük harf uyumuna dikkat!)
      const completedJobs = jobs.filter(j => 
        ['COMPLETED', 'RATED'].includes(j.status?.toUpperCase())
      );

      // Toplam Kazanç (1.038 TL'yi burası oluşturacak)
      const totalEarnings = completedJobs.reduce((sum, job) => sum + (Number(job.budget) || 0), 0);

      // Şimdilik çekilebilir bakiye ile toplam kazancı aynı gönderiyoruz
      // İleride komisyon keseceksen balance kısmını ona göre güncellersin
      res.json({
        success: true,
        balance: totalEarnings, // Cüzdandaki "Çekilebilir Bakiye" kısmı
        thisMonthEarnings: totalEarnings, // Cüzdandaki "Bu Ay Kazanç" kısmı
        totalEarnings: totalEarnings,
        completedCount: completedJobs.length
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};import { jobService } from '../services/job.service.js';

export const walletController = {
  getWalletBalance: async (req, res) => {
    try {
      // Ustanın tüm işlerini çek
      const jobs = await jobService.getJobsByUstaId(req.user.id);
      
      // Tamamlananları filtrele (Büyük harf uyumuna dikkat!)
      const completedJobs = jobs.filter(j => 
        ['COMPLETED', 'RATED'].includes(j.status?.toUpperCase())
      );

      // Toplam Kazanç (1.038 TL'yi burası oluşturacak)
      const totalEarnings = completedJobs.reduce((sum, job) => sum + (Number(job.budget) || 0), 0);

      // Şimdilik çekilebilir bakiye ile toplam kazancı aynı gönderiyoruz
      // İleride komisyon keseceksen balance kısmını ona göre güncellersin
      res.json({
        success: true,
        balance: totalEarnings, // Cüzdandaki "Çekilebilir Bakiye" kısmı
        thisMonthEarnings: totalEarnings, // Cüzdandaki "Bu Ay Kazanç" kısmı
        totalEarnings: totalEarnings,
        completedCount: completedJobs.length
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};import { jobService } from '../services/job.service.js';

export const walletController = {
  getWalletBalance: async (req, res) => {
    try {
      // Ustanın tüm işlerini çek
      const jobs = await jobService.getJobsByUstaId(req.user.id);
      
      // Tamamlananları filtrele (Büyük harf uyumuna dikkat!)
      const completedJobs = jobs.filter(j => 
        ['COMPLETED', 'RATED'].includes(j.status?.toUpperCase())
      );

      // Toplam Kazanç (1.038 TL'yi burası oluşturacak)
      const totalEarnings = completedJobs.reduce((sum, job) => sum + (Number(job.budget) || 0), 0);

      // Şimdilik çekilebilir bakiye ile toplam kazancı aynı gönderiyoruz
      // İleride komisyon keseceksen balance kısmını ona göre güncellersin
      res.json({
        success: true,
        balance: totalEarnings, // Cüzdandaki "Çekilebilir Bakiye" kısmı
        thisMonthEarnings: totalEarnings, // Cüzdandaki "Bu Ay Kazanç" kısmı
        totalEarnings: totalEarnings,
        completedCount: completedJobs.length
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};import { jobService } from '../services/job.service.js';

export const walletController = {
  getWalletBalance: async (req, res) => {
    try {
      // Ustanın tüm işlerini çek
      const jobs = await jobService.getJobsByUstaId(req.user.id);
      
      // Tamamlananları filtrele (Büyük harf uyumuna dikkat!)
      const completedJobs = jobs.filter(j => 
        ['COMPLETED', 'RATED'].includes(j.status?.toUpperCase())
      );

      // Toplam Kazanç (1.038 TL'yi burası oluşturacak)
      const totalEarnings = completedJobs.reduce((sum, job) => sum + (Number(job.budget) || 0), 0);

      // Şimdilik çekilebilir bakiye ile toplam kazancı aynı gönderiyoruz
      // İleride komisyon keseceksen balance kısmını ona göre güncellersin
      res.json({
        success: true,
        balance: totalEarnings, // Cüzdandaki "Çekilebilir Bakiye" kısmı
        thisMonthEarnings: totalEarnings, // Cüzdandaki "Bu Ay Kazanç" kısmı
        totalEarnings: totalEarnings,
        completedCount: completedJobs.length
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};import { jobService } from '../services/job.service.js';

export const walletController = {
  getWalletBalance: async (req, res) => {
    try {
      // Ustanın tüm işlerini çek
      const jobs = await jobService.getJobsByUstaId(req.user.id);
      
      // Tamamlananları filtrele (Büyük harf uyumuna dikkat!)
      const completedJobs = jobs.filter(j => 
        ['COMPLETED', 'RATED'].includes(j.status?.toUpperCase())
      );

      // Toplam Kazanç (1.038 TL'yi burası oluşturacak)
      const totalEarnings = completedJobs.reduce((sum, job) => sum + (Number(job.budget) || 0), 0);

      // Şimdilik çekilebilir bakiye ile toplam kazancı aynı gönderiyoruz
      // İleride komisyon keseceksen balance kısmını ona göre güncellersin
      res.json({
        success: true,
        balance: totalEarnings, // Cüzdandaki "Çekilebilir Bakiye" kısmı
        thisMonthEarnings: totalEarnings, // Cüzdandaki "Bu Ay Kazanç" kısmı
        totalEarnings: totalEarnings,
        completedCount: completedJobs.length
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};
