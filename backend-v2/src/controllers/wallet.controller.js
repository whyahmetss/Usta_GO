import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const walletController = {
  // GET /wallet
  getWalletBalance: async (req, res) => {
    try {
      // CUSTOMER: balance from user.balance + coupon history
      if (req.user.role === 'CUSTOMER') {
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { balance: true },
        });
        const couponUsages = await prisma.couponUsage.findMany({
          where: { userId: req.user.id },
          include: { coupon: { select: { code: true, amount: true, description: true } } },
          orderBy: { usedAt: 'desc' },
        });
        const coupons = couponUsages.map(u => ({
          id: u.id,
          code: u.coupon.code,
          amount: u.coupon.amount,
          description: u.coupon.description,
          usedAt: u.usedAt,
          used: false, // balance already added, show as "active" gift card applied
        }));
        return res.json({ success: true, data: { balance: user?.balance ?? 0, coupons } });
      }

      // USTA: calculate from jobs
      const jobs = await prisma.job.findMany({
        where: { ustaId: req.user.id, status: { in: ['COMPLETED', 'RATED'] } }
      });
      const totalEarnings = jobs.reduce((sum, j) => sum + (Number(j.budget) || 0), 0);

      const pendingAgg = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { userId: req.user.id, type: 'WITHDRAWAL', status: 'PENDING' }
      });
      const approvedAgg = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { userId: req.user.id, type: 'WITHDRAWAL', status: 'COMPLETED' }
      });

      const balance = totalEarnings - (pendingAgg._sum.amount || 0) - (approvedAgg._sum.amount || 0);
      res.json({ success: true, data: { balance, pendingWithdrawal: pendingAgg._sum.amount || 0, totalEarnings } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // POST /wallet/topup - Bakiye yükle (ödeme simülasyonu - gerçek gateway için genişletilmeli)
  topup: async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount || amount < 10) return res.status(400).json({ success: false, error: 'Minimum 10 TL yükleyebilirsiniz' });
      const amt = Number(amount);
      if (isNaN(amt)) return res.status(400).json({ success: false, error: 'Geçersiz tutar' });

      await prisma.$transaction([
        prisma.user.update({
          where: { id: req.user.id },
          data: { balance: { increment: amt } },
        }),
        prisma.transaction.create({
          data: {
            userId: req.user.id,
            amount: amt,
            type: 'TOPUP',
            status: 'COMPLETED',
            description: `Bakiye yükleme: ${amt} TL`,
          },
        }),
      ]);
      const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { balance: true } });
      res.json({ success: true, message: `${amt} TL hesabınıza yüklendi`, data: { balance: user?.balance ?? 0 } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // POST /wallet/coupon - redeem a coupon
  redeemCoupon: async (req, res) => {
    try {
      const { code } = req.body;
      if (!code?.trim()) return res.status(400).json({ success: false, error: 'Kupon kodu gerekli' });

      const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

      if (!coupon) return res.status(404).json({ success: false, error: 'Kupon kodu bulunamadı' });
      if (!coupon.isActive) return res.status(400).json({ success: false, error: 'Bu kupon artık geçerli değil' });
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
        return res.status(400).json({ success: false, error: 'Kupon süresi dolmuş' });
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
        return res.status(400).json({ success: false, error: 'Kupon kullanım limiti dolmuş' });

      // Check if user already used this coupon
      const alreadyUsed = await prisma.couponUsage.findUnique({
        where: { couponId_userId: { couponId: coupon.id, userId: req.user.id } }
      });
      if (alreadyUsed) return res.status(400).json({ success: false, error: 'Bu kuponu daha önce kullandınız' });

      // Apply coupon in a transaction
      await prisma.$transaction([
        prisma.user.update({ where: { id: req.user.id }, data: { balance: { increment: coupon.amount } } }),
        prisma.couponUsage.create({ data: { couponId: coupon.id, userId: req.user.id } }),
        prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } }),
        prisma.transaction.create({
          data: { userId: req.user.id, amount: coupon.amount, type: 'COUPON', status: 'COMPLETED', description: `Kupon: ${coupon.code}` }
        }),
      ]);

      res.json({ success: true, message: `${coupon.amount} TL bakiyenize eklendi!`, data: { amount: coupon.amount } });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /wallet/transactions
  getTransactions: async (req, res) => {
    try {
      const transactions = await prisma.transaction.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' }
      });
      const parsed = transactions.map(t => {
        let bankInfo = {};
        try { bankInfo = t.description ? JSON.parse(t.description) : {}; } catch {}
        return { ...t, ...bankInfo };
      });
      res.json({ success: true, data: parsed });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /wallet/admin/withdrawals
  getAllWithdrawals: async (req, res) => {
    try {
      const transactions = await prisma.transaction.findMany({
        where: { type: 'WITHDRAWAL' },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } }
      });
      const parsed = transactions.map(t => {
        let bankInfo = {};
        try { bankInfo = t.description ? JSON.parse(t.description) : {}; } catch {}
        const statusMap = { PENDING: 'pending', COMPLETED: 'approved', FAILED: 'rejected' };
        return { ...t, status: statusMap[t.status] || t.status.toLowerCase(), professional: { name: t.user?.name, email: t.user?.email }, ...bankInfo };
      });
      res.json({ success: true, data: parsed });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // POST /wallet/withdraw
  createWithdrawal: async (req, res) => {
    try {
      const { amount, bankName, iban, accountHolder } = req.body;
      if (!amount || amount <= 0) return res.status(400).json({ success: false, error: 'Geçerli bir tutar giriniz' });
      if (!bankName || !iban || !accountHolder) return res.status(400).json({ success: false, error: 'Banka bilgileri eksik' });
      const transaction = await prisma.transaction.create({
        data: { userId: req.user.id, amount: Number(amount), type: 'WITHDRAWAL', status: 'PENDING', description: JSON.stringify({ bankName, iban, accountHolder }) }
      });
      res.json({ success: true, data: transaction });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  approveWithdrawal: async (req, res) => {
    try {
      const transaction = await prisma.transaction.update({ where: { id: req.params.id }, data: { status: 'COMPLETED' } });
      res.json({ success: true, data: transaction });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  rejectWithdrawal: async (req, res) => {
    try {
      const transaction = await prisma.transaction.update({ where: { id: req.params.id }, data: { status: 'FAILED' } });
      res.json({ success: true, data: transaction });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
