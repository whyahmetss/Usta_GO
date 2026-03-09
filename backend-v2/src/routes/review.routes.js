import { Router } from "express";
import * as reviewController from "../controllers/review.controller.js";
import { authMiddleware, roleMiddleware, supportMiddleware } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import { createReviewSchema } from "../validators/review.validator.js";

const router = Router();

/**
 * @route POST /api/reviews
 * @desc Create a review (CUSTOMER only, for completed jobs)
 * @body {jobId, ustaId, rating, comment?}
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("CUSTOMER", "ADMIN"),
  validateBody(createReviewSchema),
  reviewController.createReview
);

/**
 * @route GET /api/reviews/usta/:ustaId
 * @desc Get all reviews for a specific USTA
 * @query {page?, limit?}
 */
router.get("/usta/:ustaId", reviewController.getReviewsByUsta);

/**
 * @route GET /api/reviews/job/:jobId
 * @desc Get all reviews for a specific job
 */
router.get("/job/:jobId", reviewController.getReviewsByJob);

// Admin + Support: all reviews & delete
router.get("/admin/all", authMiddleware, supportMiddleware, reviewController.getAllReviews);
router.delete("/admin/:id", authMiddleware, supportMiddleware, reviewController.deleteReview);

export default router;
