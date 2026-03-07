import * as adminService from "../services/admin.service.js";
import { successResponse, paginatedResponse } from "../utils/response.js";

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

import { PrismaClient } from "@prisma/client";
const _prisma = new PrismaClient();

export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await _prisma.coupon.findMany({
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
    const existing = await _prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (existing) return res.status(409).json({ success: false, error: 'Bu kupon kodu zaten mevcut' });
    const coupon = await _prisma.coupon.create({
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
    await _prisma.coupon.delete({ where: { id: req.params.couponId } });
    res.json({ success: true, message: 'Kupon silindi' });
  } catch (error) { next(error); }
};

export const toggleCoupon = async (req, res, next) => {
  try {
    const coupon = await _prisma.coupon.findUnique({ where: { id: req.params.couponId } });
    if (!coupon) return res.status(404).json({ success: false, error: 'Kupon bulunamadı' });
    const updated = await _prisma.coupon.update({ where: { id: req.params.couponId }, data: { isActive: !coupon.isActive } });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
};
