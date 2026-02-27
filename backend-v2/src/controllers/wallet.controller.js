import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const walletController = {
  // GET /wallet - bakiye (işlerden hesaplıyor)
  getWalletBalance: async (req, res) => {
    try {
      const jobs = await prisma.job.findMany({
        where: {
          ustaId: req.user.id,
          status: { in: ['COMPLETED', 'RATED'] }
        }
      });

      const totalBalance = jobs.reduce((sum, j) => sum + (Number(j.budget) || 0), 0);

      const pendingWithdrawals = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          userId: req.user.id,
          type: 'WITHDRAWAL',
          status: 'PENDING'
        }
      });
      const pendingAmount = pendingWithdrawals._sum.amount || 0;

      res.json({
        success: true,
        data: {
          balance: totalBalance,
          pendingWithdrawal: pendingAmount
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /wallet/transactions - işlem geçmişi
  getTransactions: async (req, res) => {
    try {
      const transactions = await prisma.transaction.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: transactions });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // POST /wallet/withdraw - para çekme talebi
  createWithdrawal: async (req, res) => {
    try {
      const { amount, bankName, iban, accountHolder } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Geçerli bir tutar giriniz' });
      }
      if (!bankName || !iban || !accountHolder) {
        return res.status(400).json({ success: false, error: 'Banka bilgileri eksik' });
      }

      const transaction = await prisma.transaction.create({
        data: {
          userId: req.user.id,
          amount: Number(amount),
          type: 'WITHDRAWAL',
          status: 'PENDING',
          description: JSON.stringify({ bankName, iban, accountHolder })
        }
      });

      res.json({ success: true, data: transaction });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // PATCH /wallet/withdraw/:id/approve - talebi onayla (admin)
  approveWithdrawal: async (req, res) => {
    try {
      const { id } = req.params;
      const transaction = await prisma.transaction.update({
        where: { id },
        data: { status: 'COMPLETED' }
      });
      res.json({ success: true, data: transaction });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // PATCH /wallet/withdraw/:id/reject - talebi reddet (admin)
  rejectWithdrawal: async (req, res) => {
    try {
      const { id } = req.params;
      const transaction = await prisma.transaction.update({
        where: { id },
        data: { status: 'FAILED' }
      });
      res.json({ success: true, data: transaction });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};
