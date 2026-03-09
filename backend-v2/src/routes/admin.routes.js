import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// İptal oranları — herkes okuyabilir (usta iptal cezası görmek için)
router.get("/config/cancellation", adminController.getCancellationRates);
router.patch("/config/cancellation", authMiddleware, adminMiddleware, adminController.setCancellationRates);

// Davet bonusu
router.get("/config/referral", adminController.getReferralBonus);
router.patch("/config/referral", authMiddleware, adminMiddleware, adminController.setReferralBonus);

// All other routes require ADMIN role
router.use(authMiddleware, adminMiddleware);

/**
 * @route GET /api/admin/users
 * @desc Get all users
 * @query {page?, limit?}
 */
router.get("/users", adminController.getAllUsers);

/**
 * @route PATCH /api/admin/users/:userId/ban
 * @desc Ban a user
 */
router.patch("/users/:userId/ban", adminController.banUser);

/**
 * @route PATCH /api/admin/users/:userId/unban
 * @desc Unban a user
 */
router.patch("/users/:userId/unban", adminController.unbanUser);

router.get("/pending-ustas", adminController.getPendingUstas);
router.patch("/users/:userId/approve-usta", adminController.approveUsta);
router.patch("/users/:userId/reject-usta", adminController.rejectUsta);

/**
 * @route DELETE /api/admin/users/:userId
 * @desc Delete a user
 */
router.delete("/users/:userId", adminController.deleteUser);

/**
 * @route DELETE /api/admin/jobs/:jobId
 * @desc Delete a job
 */
router.delete("/jobs/:jobId", adminController.deleteJob);

/**
 * @route DELETE /api/admin/offers/:offerId
 * @desc Delete an offer
 */
router.delete("/offers/:offerId", adminController.deleteOffer);

/**
 * @route GET /api/admin/statistics
 * @desc Get system statistics
 */
router.get("/statistics", adminController.getStatistics);

/**
 * @route GET /api/admin/health
 * @desc Get system health status
 */
router.get("/health", adminController.getSystemHealth);

// Coupon management
router.get("/coupons", adminController.getCoupons);
router.post("/coupons", adminController.createCoupon);
router.delete("/coupons/:couponId", adminController.deleteCoupon);
router.patch("/coupons/:couponId/toggle", adminController.toggleCoupon);

// Finans
router.get("/finance", adminController.getFinanceReport);


// Kampanya
router.get("/campaigns/active", adminController.getActiveCampaign);
router.post("/campaigns", adminController.setCampaign);
router.delete("/campaigns", adminController.deleteCampaign);

export default router;
