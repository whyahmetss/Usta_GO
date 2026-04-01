import prisma from '../utils/prisma.js';

// Sonraki yenileme tarihi: 30 gün sonrası
const nextRenewalDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
};

export const packageController = {
  // GET /packages/my  — Müşterinin aktif paketini getir
  getMyPackage: async (req, res) => {
    const pkg = await prisma.userPackage.findFirst({
      where: { userId: req.user.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: pkg || null });
  },

  // POST /packages/buy  — Paket satın al (bakiyeden düş)
  buyPackage: async (req, res) => {
    const { packageId } = req.body;
    if (!packageId) {
      return res.status(400).json({ success: false, message: 'Paket ID gerekli.' });
    }

    const config = await prisma.packageConfig.findUnique({ where: { packageId } });
    if (!config || !config.isActive) {
      return res.status(404).json({ success: false, message: 'Paket bulunamadı.' });
    }
    const price = config.price;
    const packageName = config.name;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
    if (user.balance < price) {
      return res.status(400).json({ success: false, message: 'Yetersiz bakiye. Lütfen bakiye yükleyin.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Eski aktif paketi iptal et
      await tx.userPackage.updateMany({
        where: { userId: req.user.id, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });

      // Bakiyeden düş
      await tx.user.update({
        where: { id: req.user.id },
        data: { balance: { decrement: price } },
      });

      // İşlem kaydı
      await tx.transaction.create({
        data: {
          userId: req.user.id,
          amount: -price,
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
          description: `${packageName} Bakım Paketi satın alındı`,
        },
      });

      // Yeni paket oluştur
      const newPkg = await tx.userPackage.create({
        data: {
          userId: req.user.id,
          packageId,
          packageName,
          price,
          status: 'ACTIVE',
          nextRenewal: nextRenewalDate(),
        },
      });

      return newPkg;
    });

    return res.json({ success: true, data: result });
  },

  // GET /packages/list  — Müşteri için paket listesi (admin fiyatlarından)
  getListPackages: async (req, res) => {
    const configs = await prisma.packageConfig.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
    const list = configs.map((c) => ({
      id: c.packageId,
      packageId: c.packageId,
      name: c.name,
      price: c.price,
      badge: c.badge || '📦',
      features: JSON.parse(c.features || '[]'),
      tag: c.packageId === 'pro' ? 'Popüler' : c.packageId === 'plus' ? 'En İyi Değer' : 'Başlangıç',
    }));
    return res.json({ success: true, data: list });
  },

  // PATCH /packages/auto-renew  — Otomatik yenileme aç/kapat
  toggleAutoRenew: async (req, res) => {
    const { autoRenew } = req.body;
    const pkg = await prisma.userPackage.findFirst({
      where: { userId: req.user.id, status: 'ACTIVE' },
    });
    if (!pkg) return res.status(404).json({ success: false, message: 'Aktif paket bulunamadı.' });

    const updated = await prisma.userPackage.update({
      where: { id: pkg.id },
      data: { autoRenew: Boolean(autoRenew) },
    });

    return res.json({ success: true, data: updated });
  },

  // ── ADMIN ──────────────────────────────────────────────────────────────

  // GET /packages/admin  — Tüm paket konfigürasyonları + abone istatistikleri
  getAdminPackages: async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Yetkisiz.' });

    // Varsayılan paket konfigürasyonlarını yoksa oluştur
    const DEFAULTS = [
      {
        packageId: 'klasik', name: 'Klasik', price: 499, badge: '🏠',
        features: JSON.stringify(['Elektrik kontrol (2 ayda 1)', 'Su tesisat kontrolü (3 ayda 1)', 'Sigorta panosu kontrolü (yılda 1)', 'Standart usta atama']),
      },
      {
        packageId: 'pro', name: 'Pro', price: 999, badge: '⚡',
        features: JSON.stringify(['Elektrik + sigorta panosu (aylık)', 'Su tesisat basınç kontrolü (2 ayda 1)', 'Kaçak akım testi (3 ayda 1)', 'Öncelikli usta atama']),
      },
      {
        packageId: 'plus', name: 'Plus', price: 1999, badge: '👑',
        features: JSON.stringify(['Tüm Pro hizmetleri dahil', 'Kombi / klima bakımı (6 ayda 1)', 'Kaçak akım testi (aylık)', 'VIP öncelikli usta atama', '7/24 acil yardım hattı']),
      },
    ];

    for (const d of DEFAULTS) {
      await prisma.packageConfig.upsert({
        where: { packageId: d.packageId },
        update: {},
        create: d,
      });
    }

    const configs = await prisma.packageConfig.findMany({ orderBy: { price: 'asc' } });

    // Her paket için abone sayısı ve aylık gelir hesapla
    const result = await Promise.all(configs.map(async (cfg) => {
      const activeCount = await prisma.userPackage.count({
        where: { packageId: cfg.packageId, status: 'ACTIVE' },
      });
      const cancelledCount = await prisma.userPackage.count({
        where: { packageId: cfg.packageId, status: 'CANCELLED' },
      });
      // Bu ayki yeni aboneler
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
      const newThisMonth = await prisma.userPackage.count({
        where: { packageId: cfg.packageId, createdAt: { gte: startOfMonth } },
      });
      return {
        ...cfg,
        features: JSON.parse(cfg.features || '[]'),
        activeSubscribers: activeCount,
        cancelledCount,
        newThisMonth,
        monthlyRevenue: activeCount * cfg.price,
      };
    }));

    return res.json({ success: true, data: result });
  },

  // PATCH /packages/admin/:packageId  — Paket fiyatını/özelliklerini güncelle
  updateAdminPackage: async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Yetkisiz.' });
    const { packageId } = req.params;
    const { price, features, isActive } = req.body;

    const data = {};
    if (price !== undefined) {
      const p = Number(price);
      if (isNaN(p) || p <= 0) return res.status(400).json({ success: false, message: 'Geçersiz fiyat.' });
      data.price = p;
    }
    if (features !== undefined) {
      let parsed = features;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          // allow a plain string -> treat as single feature
          parsed = [parsed];
        }
      }
      if (!Array.isArray(parsed)) {
        return res.status(400).json({ success: false, message: 'Geçersiz özellik listesi.' });
      }
      data.features = JSON.stringify(parsed.filter(Boolean).map(String));
    }
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.packageConfig.update({
      where: { packageId },
      data,
    });

    return res.json({ success: true, data: { ...updated, features: JSON.parse(updated.features || '[]') } });
  },
};
