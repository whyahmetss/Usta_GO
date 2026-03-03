import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    const { packageId, packageName, price } = req.body;
    if (!packageId || !packageName || !price) {
      return res.status(400).json({ success: false, message: 'Eksik parametre.' });
    }

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
};
