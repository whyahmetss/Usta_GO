import * as adminService from "../services/admin.service.js";
import * as configController from "./config.controller.js";
import { successResponse, paginatedResponse } from "../utils/response.js";
import prisma from "../utils/prisma.js";

export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { users, total } = await adminService.getAllUsers(skip, limit);
    paginatedResponse(res, users, page, limit, total);
  } catch (error) {
    next(error);
  }
};

export const banUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await adminService.banUser(userId);
    successResponse(res, user, "User banned successfully");
  } catch (error) {
    next(error);
  }
};

export const unbanUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await adminService.unbanUser(userId);
    successResponse(res, user, "User unbanned successfully");
  } catch (error) {
    next(error);
  }
};

export const getPendingUstas = async (req, res, next) => {
  try {
    const users = await adminService.getPendingUstas();
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const approveUsta = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await adminService.approveUsta(userId);
    successResponse(res, user, "Usta onaylandı");
  } catch (error) {
    next(error);
  }
};

export const rejectUsta = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await adminService.rejectUsta(userId, req.body?.reason);
    successResponse(res, user, "Usta reddedildi");
  } catch (error) {
    next(error);
  }
};

export const getPendingCustomers = async (req, res, next) => {
  try {
    const customers = await adminService.getPendingCustomers();
    successResponse(res, customers, "Pending customers fetched");
  } catch (error) { next(error); }
};

export const approveCustomer = async (req, res, next) => {
  try {
    const user = await adminService.approveCustomer(req.params.userId);
    successResponse(res, user, "Müşteri onaylandı");
  } catch (error) { next(error); }
};

export const rejectCustomer = async (req, res, next) => {
  try {
    const user = await adminService.rejectCustomer(req.params.userId);
    successResponse(res, user, "Müşteri reddedildi");
  } catch (error) { next(error); }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await adminService.deleteUser(userId);
    successResponse(res, result, "User deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const result = await adminService.deleteJob(jobId);
    successResponse(res, result, "Job deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteOffer = async (req, res, next) => {
  try {
    const { offerId } = req.params;
    const result = await adminService.deleteOffer(offerId);
    successResponse(res, result, "Offer deleted successfully");
  } catch (error) {
    next(error);
  }
};

export const getStatistics = async (req, res, next) => {
  try {
    const stats = await adminService.getStatistics();
    successResponse(res, stats, "Statistics fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const getSystemHealth = async (req, res, next) => {
  try {
    const health = await adminService.getSystemHealth();
    successResponse(res, health, "System health check completed");
  } catch (error) {
    next(error);
  }
};

export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      include: { _count: { select: { usages: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: coupons });
  } catch (error) { next(error); }
};

export const createCoupon = async (req, res, next) => {
  try {
    const { code, amount, description, maxUses, expiresAt } = req.body;
    if (!code?.trim() || !amount) return res.status(400).json({ success: false, error: 'Kod ve tutar zorunlu' });
    const existing = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (existing) return res.status(409).json({ success: false, error: 'Bu kupon kodu zaten mevcut' });
    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        amount: Number(amount),
        description: description || null,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    res.status(201).json({ success: true, data: coupon });
  } catch (error) { next(error); }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.couponId } });
    res.json({ success: true, message: 'Kupon silindi' });
  } catch (error) { next(error); }
};

export const toggleCoupon = async (req, res, next) => {
  try {
    const coupon = await prisma.coupon.findUnique({ where: { id: req.params.couponId } });
    if (!coupon) return res.status(404).json({ success: false, error: 'Kupon bulunamadı' });
    const updated = await prisma.coupon.update({ where: { id: req.params.couponId }, data: { isActive: !coupon.isActive } });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
};

// Finans raporu
export const getFinanceReport = async (req, res, next) => {
  try {
    const COMMISSION_RATE = 0.12

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      allTransactions,
      completedJobs,
      pendingWithdrawals,
      totalUsers,
    ] = await Promise.all([
      prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.job.findMany({
        where: { status: { in: ['COMPLETED', 'RATED'] } },
        select: { id: true, budget: true, completedAt: true, createdAt: true },
      }),
      prisma.transaction.aggregate({
        where: { type: 'WITHDRAWAL', status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.user.count(),
    ])

    // Komisyon (tamamlanan işlerin %12'si)
    const totalCommission = completedJobs.reduce((s, j) => s + (j.budget * COMMISSION_RATE), 0)
    const monthCommission = completedJobs
      .filter(j => new Date(j.completedAt || j.createdAt) >= startOfMonth)
      .reduce((s, j) => s + (j.budget * COMMISSION_RATE), 0)
    const todayCommission = completedJobs
      .filter(j => new Date(j.completedAt || j.createdAt) >= startOfToday)
      .reduce((s, j) => s + (j.budget * COMMISSION_RATE), 0)

    // Müşteri bakiye yüklemeleri
    const topups = allTransactions.filter(t => t.type === 'TOPUP' && t.status === 'COMPLETED')
    const totalTopup = topups.reduce((s, t) => s + t.amount, 0)
    const monthTopup = topups.filter(t => new Date(t.createdAt) >= startOfMonth).reduce((s, t) => s + t.amount, 0)

    // Toplam iş hacmi (tamamlanan işlerin toplam değeri)
    const totalVolume = completedJobs.reduce((s, j) => s + j.budget, 0)
    const monthVolume = completedJobs
      .filter(j => new Date(j.completedAt || j.createdAt) >= startOfMonth)
      .reduce((s, j) => s + j.budget, 0)

    // Son 12 ay günlük / aylık kırılım
    const monthlyData = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const label = d.toLocaleString('tr-TR', { month: 'short', year: '2-digit' })
      const vol = completedJobs
        .filter(j => { const cd = new Date(j.completedAt || j.createdAt); return cd >= d && cd < end })
        .reduce((s, j) => s + j.budget, 0)
      const comm = vol * COMMISSION_RATE
      const tp = topups.filter(t => { const cd = new Date(t.createdAt); return cd >= d && cd < end }).reduce((s, t) => s + t.amount, 0)
      monthlyData.push({ label, volume: Math.round(vol), commission: Math.round(comm), topup: Math.round(tp) })
    }

    // Son 30 gün günlük kırılım
    const dailyData = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1)
      const label = `${d.getDate()}/${d.getMonth() + 1}`
      const vol = completedJobs
        .filter(j => { const cd = new Date(j.completedAt || j.createdAt); return cd >= d && cd < end })
        .reduce((s, j) => s + j.budget, 0)
      const tp = topups.filter(t => { const cd = new Date(t.createdAt); return cd >= d && cd < end }).reduce((s, t) => s + t.amount, 0)
      dailyData.push({ label, volume: Math.round(vol), topup: Math.round(tp) })
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalVolume: Math.round(totalVolume),
          monthVolume: Math.round(monthVolume),
          todayCommission: Math.round(todayCommission),
          totalCommission: Math.round(totalCommission),
          monthCommission: Math.round(monthCommission),
          totalTopup: Math.round(totalTopup),
          monthTopup: Math.round(monthTopup),
          pendingWithdrawalsAmount: Math.round(Math.abs(pendingWithdrawals._sum.amount || 0)),
          pendingWithdrawalsCount: pendingWithdrawals._count,
          totalUsers,
          completedJobsCount: completedJobs.length,
        },
        monthlyData,
        dailyData,
        recentTransactions: allTransactions.slice(0, 50).map(t => ({
          id: t.id,
          amount: t.amount,
          type: t.type,
          status: t.status,
          description: t.description,
          userName: t.user?.name,
          userRole: t.user?.role,
          createdAt: t.createdAt,
        })),
      },
    })
  } catch (error) { next(error) }
}

// Kampanya
export const getActiveCampaign = async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findFirst({ where: { active: true }, orderBy: { updatedAt: "desc" } });
    if (!campaign) return res.json({ data: null });
    res.json({
      data: {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description || "",
        badge_text: campaign.badgeText || "",
        button_text: campaign.buttonText || "",
        bg_color: campaign.bgColor,
        badge_color: campaign.badgeColor,
        text_color: campaign.textColor,
        bg_image: campaign.bgImage || null,
        icon_type: campaign.iconType || null,
        icon_image: campaign.iconImage || null,
        active: campaign.active,
        updatedAt: campaign.updatedAt,
      },
    });
  } catch (error) { next(error); }
};

export const setCampaign = async (req, res, next) => {
  try {
    const { title, description, badge_text, button_text, bg_color, badge_color, text_color, bg_image, icon_type, icon_image } = req.body;
    if (!title) return res.status(400).json({ error: "Kampanya basligi zorunludur" });
    await prisma.campaign.updateMany({ where: { active: true }, data: { active: false } });
    const campaign = await prisma.campaign.create({
      data: {
        title,
        description: description || "",
        badgeText: badge_text || "",
        buttonText: button_text || "",
        bgColor: bg_color || "#111827",
        badgeColor: badge_color || "#34d399",
        textColor: text_color || "#ffffff",
        bgImage: bg_image || null,
        iconType: icon_type || null,
        iconImage: icon_image || null,
        active: true,
      },
    });
    res.json({
      data: {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        badge_text: campaign.badgeText,
        button_text: campaign.buttonText,
        bg_color: campaign.bgColor,
        badge_color: campaign.badgeColor,
        text_color: campaign.textColor,
        bg_image: campaign.bgImage,
        icon_type: campaign.iconType,
        icon_image: campaign.iconImage,
        active: campaign.active,
        updatedAt: campaign.updatedAt,
      },
      message: "Kampanya yayinlandi",
    });
  } catch (error) { next(error); }
};

export const deleteCampaign = async (req, res, next) => {
  try {
    await prisma.campaign.updateMany({ where: { active: true }, data: { active: false } });
    res.json({ data: null, message: "Kampanya kaldirildi" });
  } catch (error) { next(error); }
};

export const getCancellationRates = configController.getCancellationRates;
export const setCancellationRates = configController.setCancellationRates;
export const getReferralBonus = configController.getReferralBonus;
export const setReferralBonus = configController.setReferralBonus;
export const getHomeServices = configController.getHomeServices;
export const setHomeServices = configController.setHomeServices;
