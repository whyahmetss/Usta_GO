import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require ADMIN role
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

export default router;
