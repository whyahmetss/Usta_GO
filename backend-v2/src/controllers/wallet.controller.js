import prisma from '../utils/prisma.js';
import * as iyzicoService from '../services/iyzico.service.js';
import * as shopierService from '../services/shopier.service.js';
import { Buffer } from 'buffer';

const getCallbackBaseUrl = () => process.env.IYZIPAY_CALLBACK_BASE || process.env.API_BASE_URL || '';
const getFrontendUrl = () => process.env.FRONTEND_URL || '';

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
        select: { balance: true, hasVergiLevhasi: true },
      });
      const totalEarnings = Number(user?.balance) || 0;
      const hasVergiLevhasi = !!user?.hasVergiLevhasi;

      const pendingAgg = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { userId: req.user.id, type: 'WITHDRAWAL', status: 'PENDING' }
      });
      const approvedAgg = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { userId: req.user.id, type: 'WITHDRAWAL', status: 'COMPLETED' }
      });

      const balance = totalEarnings - (pendingAgg._sum.amount || 0) - (approvedAgg._sum.amount || 0);
      res.json({ success: true, data: { balance, pendingWithdrawal: pendingAgg._sum.amount || 0, totalEarnings, commissionRate: 0.12, taxRate: hasVergiLevhasi ? 0 : 0.20, hasVergiLevhasi } });
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
            description: `Hizmet kredisi yükleme: ${amt} TL`,
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
      const callbackUrl = `${baseUrl}/api/wallet/topup/callback?uid=${req.user.id}&amt=${amt}`;

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
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="font-family:system-ui,sans-serif;max-width:400px;margin:60px auto;padding:24px;text-align:center"><h2>${title}</h2><p>${msg}</p><p><a href="${walletUrl}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold">Hizmet Hesabıma Dön</a></p>${!success ? `<p><a href="${odemeUrl}">Tekrar Dene</a></p>` : ''}</body></html>`;
      return res.send(html);
    };
    try {
      const token = req.query.token || req.body?.token;
      if (!token) return sendHtml(false, 0, 'Token bulunamadı.');

      // uid ve amt query param'dan al (fallback olarak conversationId parse da dene)
      const uidFromQuery = req.query.uid || req.body?.uid;
      const amtFromQuery = parseFloat(req.query.amt || req.body?.amt || 0);

      const result = await iyzicoService.retrieveCheckoutForm(token);

      const payOk = result?.status === 'success' && (
        result.paymentStatus === 'SUCCESS' ||
        result.paymentStatus === '1' ||
        result.fraudStatus === 1 ||
        result.fraudStatus === '1'
      );
      if (!result || !payOk) {
        return sendHtml(false, 0, result?.errorMessage || 'Ödeme başarısız.');
      }

      // userId: önce query param, yoksa conversationId'den parse et
      const conversationId = result.conversationId || '';
      const match = conversationId.match(/^topup-(.+?)-(\d+)$/);
      const userId = uidFromQuery || (match ? match[1] : null);

      // paidPrice: iyzico result'tan al, yoksa query'den al
      const paidPrice = parseFloat(result.paidPrice || result.price || 0) || amtFromQuery;

      if (!userId || paidPrice <= 0) {
        console.error('topupCallback: userId veya paidPrice eksik', { userId, paidPrice, conversationId, uidFromQuery, amtFromQuery });
        return sendHtml(false, 0, 'Geçersiz işlem sonucu.');
      }

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
            description: `Hizmet kredisi yükleme (iyzico): ${paidPrice} TL`,
          },
        }),
      ]);

      return sendHtml(true, paidPrice);
    } catch (error) {
      console.error('topupCallback error:', error);
      return sendHtml(false, 0, error.message || 'Beklenmeyen hata.');
    }
  },

  // POST /wallet/topup/3ds - 3D Secure ile ödeme başlat (kart bilgileriyle)
  topup3DSInit: async (req, res) => {
    try {
      if (!process.env.IYZIPAY_API_KEY || !process.env.IYZIPAY_SECRET_KEY) {
        return res.status(503).json({ success: false, error: 'iyzico entegrasyonu yapılandırılmamış.' });
      }
      const { amount, cardHolderName, cardNumber, expireMonth, expireYear, cvc } = req.body;
      if (!amount || amount < 10) return res.status(400).json({ success: false, error: 'Minimum 10 TL yükleyebilirsiniz' });
      if (!cardNumber || !expireMonth || !expireYear || !cvc) {
        return res.status(400).json({ success: false, error: 'Kart bilgileri eksik' });
      }

      const amt = Number(amount);
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, name: true, email: true, phone: true },
      });
      if (!user) return res.status(404).json({ success: false, error: 'Kullanıcı bulunamadı' });

      const baseUrl = getCallbackBaseUrl().replace(/\/$/, '');
      const callbackUrl = `${baseUrl}/api/wallet/topup/3ds/callback?uid=${req.user.id}&amt=${amt}`;

      const result = await iyzicoService.initiate3DSPayment(
        {
          userId: req.user.id,
          amount: amt,
          user: { name: user.name, email: user.email, phone: user.phone },
          card: { cardHolderName: cardHolderName || user.name, cardNumber, expireMonth, expireYear, cvc },
        },
        callbackUrl
      );

      if (!result?.htmlContent) {
        return res.status(500).json({ success: false, error: '3DS HTML içeriği alınamadı. iyzico yapılandırmasını kontrol edin.' });
      }
      res.json({ success: true, data: { threeDSHtmlContent: result.htmlContent, conversationId: result.conversationId } });
    } catch (error) {
      console.error('topup3DSInit error:', error);
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('api') && (msg.includes('key') || msg.includes('geçersiz') || msg.includes('bulunamadı'))) {
        return res.status(503).json({ success: false, error: 'iyzico API anahtarları hatalı.' });
      }
      res.status(500).json({ success: false, error: error.message || '3DS başlatılamadı' });
    }
  },

  // POST /wallet/topup/3ds/callback - 3DS doğrulama sonrası iyzico çağırır
  topup3DSCallback: async (req, res) => {
    const walletUrl = getFrontendUrl().replace(/\/$/, '') + '/wallet';
    const odemeUrl = getFrontendUrl().replace(/\/$/, '') + '/odeme';
    const sendHtml = (success, amount, errorMsg) => {
      res.set('Cache-Control', 'no-store');
      res.type('html');
      const title = success ? 'Ödeme Başarılı' : 'Ödeme Başarısız';
      const msg = success
        ? `${Number(amount).toLocaleString('tr-TR')} TL hesabınıza yüklendi.`
        : (errorMsg || 'Ödeme işlemi tamamlanamadı.');
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="font-family:system-ui,sans-serif;max-width:400px;margin:60px auto;padding:24px;text-align:center"><h2>${title}</h2><p>${msg}</p><p><a href="${walletUrl}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold">Hizmet Hesabıma Dön</a></p>${!success ? `<p><a href="${odemeUrl}">Tekrar Dene</a></p>` : ''}</body></html>`;
      return res.send(html);
    };

    try {
      const paymentId = req.body?.paymentId || req.query?.paymentId;
      const conversationData = req.body?.conversationData || req.query?.conversationData;
      const conversationId = req.body?.conversationId || req.query?.conversationId;

      if (!paymentId) return sendHtml(false, 0, 'Ödeme ID bulunamadı.');

      const uidFromQuery = req.query.uid || req.body?.uid;
      const amtFromQuery = parseFloat(req.query.amt || req.body?.amt || 0);

      const result = await iyzicoService.complete3DSPayment(paymentId, conversationData, conversationId);

      const payOk = result?.status === 'success' && (
        result.paymentStatus === 'SUCCESS' ||
        result.fraudStatus === 1 ||
        result.fraudStatus === '1'
      );

      if (!payOk) return sendHtml(false, 0, result?.errorMessage || 'Ödeme başarısız.');

      const paidPrice = parseFloat(result.paidPrice || result.price || 0) || amtFromQuery;
      const userId = uidFromQuery;

      if (!userId || paidPrice <= 0) return sendHtml(false, 0, 'Geçersiz işlem sonucu.');

      await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { balance: { increment: paidPrice } } }),
        prisma.transaction.create({
          data: {
            userId,
            amount: paidPrice,
            type: 'TOPUP',
            status: 'COMPLETED',
            description: `Hizmet kredisi yükleme (3DS): ${paidPrice} TL`,
          },
        }),
      ]);

      return sendHtml(true, paidPrice);
    } catch (error) {
      console.error('topup3DSCallback error:', error);
      return sendHtml(false, 0, error.message || 'Beklenmeyen hata.');
    }
  },

  // POST /wallet/topup/shopier/init - Shopier'de ürün oluştur, ödeme URL'si dön
  shopierInit: async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount || amount < 10) return res.status(400).json({ success: false, error: 'Minimum 10 TL yükleyebilirsiniz' });
      const amt = Number(amount);
      if (isNaN(amt)) return res.status(400).json({ success: false, error: 'Geçersiz tutar' });

      const orderId = `UGO-${req.user.id.slice(-6)}-${amt}-${Date.now()}`;

      const product = await shopierService.createProduct({
        amount: amt,
        userId: req.user.id,
        orderId,
      });

      if (!product?.url) {
        return res.status(500).json({ success: false, error: 'Shopier ürün oluşturulamadı' });
      }

      // Ödeme bekleme kaydı oluştur (webhook gelince eşleştirilecek)
      await prisma.transaction.create({
        data: {
          userId: req.user.id,
          amount: amt,
          type: 'TOPUP',
          status: 'PENDING',
          description: JSON.stringify({ orderId, shopierProductId: product.id, source: 'shopier' }),
        },
      });

      res.json({ success: true, data: { paymentUrl: product.url, productId: product.id } });
    } catch (error) {
      const status = error.status || 500;
      res.status(status).json({ success: false, error: error.message || 'Shopier başlatılamadı' });
    }
  },

  // POST /wallet/topup/shopier/webhook - Shopier order.created webhook
  shopierWebhook: async (req, res) => {
    try {
      const order = req.body || {};
      const shopierOrderId = order.id;
      const paymentStatus = order.paymentStatus; // 'paid' or 'unpaid'

      if (paymentStatus !== 'paid') {
        return res.status(200).json({ ok: true, message: 'Ödenmemiş sipariş, atlandı.' });
      }

      // Sipariş tutarını al
      const grandTotal = parseFloat(order?.totals?.grandTotal || 0);
      if (grandTotal <= 0) {
        return res.status(200).json({ ok: true, message: 'Tutar geçersiz.' });
      }

      // lineItems'tan ürün başlığını ve customNote'u çıkar
      const items = order?.lineItems || [];
      let userId = null;
      let internalOrderId = null;

      for (const item of items) {
        const title = item?.title || '';
        if (title.startsWith('Bakiye Yükleme')) {
          // description'dan parse — customNote ürüne yazıldı
          // Ürün detayını çekelim
          const productId = item?.productId;
          if (productId) {
            try {
              const product = await shopierService.getOrder(shopierOrderId);
              // buyerNote kontrol
            } catch {}
          }
        }
      }

      // PENDING transaction'dan eşleştir — shopierProductId ile
      // Ürün başlığından tutarı çıkar
      const amountFromTitle = items[0]?.title?.match(/Bakiye Yükleme (\d+(?:\.\d+)?) TL/);
      const paidAmount = amountFromTitle ? parseFloat(amountFromTitle[1]) : grandTotal;

      // PENDING transaction bul — amount eşleşmesi + source: shopier
      const pendingTxns = await prisma.transaction.findMany({
        where: { type: 'TOPUP', status: 'PENDING', amount: paidAmount },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      let matchedTx = null;
      for (const tx of pendingTxns) {
        try {
          const desc = JSON.parse(tx.description);
          if (desc.source === 'shopier') {
            matchedTx = tx;
            break;
          }
        } catch {}
      }

      if (!matchedTx) {
        console.warn('Shopier webhook: eşleşen PENDING transaction bulunamadı', { shopierOrderId, paidAmount });
        return res.status(200).json({ ok: true, message: 'Eşleşen işlem bulunamadı.' });
      }

      // Duplicate kontrolü
      if (matchedTx.status === 'COMPLETED') {
        return res.status(200).json({ ok: true, message: 'Zaten işlenmiş.' });
      }

      // Bakiye yükle
      await prisma.$transaction([
        prisma.user.update({ where: { id: matchedTx.userId }, data: { balance: { increment: paidAmount } } }),
        prisma.transaction.update({
          where: { id: matchedTx.id },
          data: {
            status: 'COMPLETED',
            description: `Hizmet kredisi yükleme (Shopier): ${paidAmount} TL [shopier:${shopierOrderId}]`,
          },
        }),
      ]);

      // Ürünü temizle (opsiyonel)
      try {
        const desc = JSON.parse(matchedTx.description);
        if (desc.shopierProductId) await shopierService.deleteProduct(desc.shopierProductId);
      } catch {}

      console.log(`Shopier bakiye yüklendi: ${matchedTx.userId} → ${paidAmount} TL`);
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Shopier webhook error:', error);
      return res.status(200).json({ ok: true, message: 'İşleme hatası.' });
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

  // GET /wallet/admin/transactions - admin için tüm işlemler
  getAllTransactions: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 500;
      const type = req.query.type; // opsiyonel filtre
      const where = type ? { type } : {};
      const transactions = await prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      });
      res.json({ success: true, data: transactions });
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

      // Vergi levhası kontrolü — varsa stopaj kesilmez
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { hasVergiLevhasi: true },
      });

      const grossAmount = Number(amount);
      const TAX_RATE = user?.hasVergiLevhasi ? 0 : 0.20; // Vergi levhalı: %0, Bireysel: %20
      const taxAmount = Math.round(grossAmount * TAX_RATE);
      const netAmount = grossAmount - taxAmount;

      const transaction = await prisma.transaction.create({
        data: {
          userId: req.user.id,
          amount: grossAmount,
          type: 'WITHDRAWAL',
          status: 'PENDING',
          description: JSON.stringify({
            bankName, iban, accountHolder,
            grossAmount,
            taxRate: TAX_RATE,
            taxAmount,
            netAmount,
            hasVergiLevhasi: !!user?.hasVergiLevhasi,
          })
        }
      });
      res.json({ success: true, data: { ...transaction, grossAmount, taxRate: TAX_RATE, taxAmount, netAmount, hasVergiLevhasi: !!user?.hasVergiLevhasi } });
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
