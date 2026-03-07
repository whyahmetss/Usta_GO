import { PrismaClient } from '@prisma/client';
import * as iyzicoService from '../services/iyzico.service.js';

const prisma = new PrismaClient();

const getCallbackBaseUrl = () => process.env.IYZIPAY_CALLBACK_BASE || process.env.API_BASE_URL || 'https://usta-go-1.onrender.com';
const getFrontendUrl = () => process.env.FRONTEND_URL || 'https://usta-go-app.onrender.com';

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

      // USTA: use user's balance (already net of commission) as earnings base
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { balance: true },
      });
      const totalEarnings = Number(user?.balance) || 0;

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

  // POST /wallet/topup - Bakiye yükle (simülasyon - iyzico yoksa direkt yükler)
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

  // POST /wallet/topup/init - iyzico Checkout Form başlat, ödeme sayfası URL döner
  topupInit: async (req, res) => {
    try {
      if (!process.env.IYZIPAY_API_KEY || !process.env.IYZIPAY_SECRET_KEY) {
        return res.status(503).json({ success: false, error: 'iyzico entegrasyonu yapılandırılmamış. Lütfen IYZIPAY_API_KEY ve IYZIPAY_SECRET_KEY ekleyin.' });
      }
      const { amount } = req.body;
      if (!amount || amount < 10) return res.status(400).json({ success: false, error: 'Minimum 10 TL yükleyebilirsiniz' });
      const amt = Number(amount);
      if (isNaN(amt)) return res.status(400).json({ success: false, error: 'Geçersiz tutar' });

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, name: true, email: true, phone: true },
      });
      if (!user) return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });

      const baseUrl = getCallbackBaseUrl().replace(/\/$/, '');
      const callbackUrl = `${baseUrl}/api/wallet/topup/callback`;

      const result = await iyzicoService.initializeCheckoutForm(
        { userId: req.user.id, amount: amt, user: { name: user.name, email: user.email, phone: user.phone } },
        callbackUrl
      );

      res.json({
        success: true,
        data: {
          paymentPageUrl: result.paymentPageUrl,
          token: result.token,
        },
      });
    } catch (error) {
      console.error('topupInit error:', error);
      const msg = (error.message || '').toLowerCase();
      // iyzico'dan gelen API anahtar hatası → kullanıcıya net mesaj
      if (msg.includes('api') && (msg.includes('bilgileri') || msg.includes('bulunamadı') || msg.includes('key') || msg.includes('geçersiz'))) {
        return res.status(503).json({
          success: false,
          error: 'iyzico API anahtarları eksik veya hatalı. Lütfen IYZIPAY_API_KEY ve IYZIPAY_SECRET_KEY değerlerini kontrol edin (sandbox için iyzico panelinden sandbox anahtarlarını kullanın).'
        });
      }
      res.status(500).json({ success: false, error: error.message || 'Ödeme başlatılamadı' });
    }
  },

  // GET/POST /wallet/topup/callback - iyzico ödeme sonrası HTML sayfa döner (SPA/redirect bağımsız)
  topupCallback: async (req, res) => {
    const walletUrl = getFrontendUrl().replace(/\/$/, '') + '/wallet';
    const odemeUrl = getFrontendUrl().replace(/\/$/, '') + '/odeme';
    const sendHtml = (success, amount, errorMsg) => {
      res.set('Cache-Control', 'no-store');
      res.type('html');
      const title = success ? 'Ödeme Başarılı' : 'Ödeme Başarısız';
      const msg = success
        ? `${Number(amount).toLocaleString('tr-TR')} TL hesabınıza yüklendi.`
        : (errorMsg || 'Ödeme işlemi tamamlanamadı.');
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="3;url=${walletUrl}"><title>${title}</title></head><body style="font-family:system-ui,sans-serif;max-width:400px;margin:60px auto;padding:24px;text-align:center"><h2>${title}</h2><p>${msg}</p><p><a href="${walletUrl}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold">Cüzdana Dön</a></p>${!success ? `<p><a href="${odemeUrl}">Tekrar Dene</a></p>` : ''}</body></html>`;
      return res.send(html);
    };
    try {
      const token = req.query.token || req.body?.token;
      if (!token) return sendHtml(false, 0, 'Token bulunamadı.');

      const result = await iyzicoService.retrieveCheckoutForm(token);
      if (!result || result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
        return sendHtml(false, 0, result?.errorMessage || 'Ödeme başarısız.');
      }

      const conversationId = result.conversationId || '';
      const match = conversationId.match(/^topup-(.+?)-(\d+)$/);
      const userId = match ? match[1] : null;
      const paidPrice = parseFloat(result.paidPrice || result.price || 0);

      if (!userId || paidPrice <= 0) return sendHtml(false, 0, 'Geçersiz işlem sonucu.');

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { balance: { increment: paidPrice } },
        }),
        prisma.transaction.create({
          data: {
            userId,
            amount: paidPrice,
            type: 'TOPUP',
            status: 'COMPLETED',
            description: `Bakiye yükleme (iyzico): ${paidPrice} TL`,
          },
        }),
      ]);

      return sendHtml(true, paidPrice);
    } catch (error) {
      console.error('topupCallback error:', error);
      return sendHtml(false, 0, error.message || 'Beklenmeyen hata.');
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
