import { Router } from "express";
import * as offerController from "../controllers/offer.controller.js";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import { createOfferSchema } from "../validators/offer.validator.js";

const router = Router();

/**
 * @route POST /api/offers
 * @desc Create an offer on a job (USTA only)
 * @body {jobId, price, message?}
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("USTA", "ADMIN"),
  validateBody(createOfferSchema),
  offerController.createOffer
);

/**
 * @route GET /api/offers/job/:jobId
 * @desc Get all offers for a specific job
 */
router.get("/job/:jobId", offerController.getOffers);

/**
 * @route GET /api/offers/my-offers
 * @desc Get current user's offers (USTA)
 * @query {page?, limit?}
 */
router.get("/my-offers", authMiddleware, offerController.getMyOffers);

/**
 * @route PATCH /api/offers/:offerId/accept
 * @desc Accept an offer (CUSTOMER only)
 */
router.patch(
  "/:offerId/accept",
  authMiddleware,
  roleMiddleware("CUSTOMER", "ADMIN"),
  offerController.acceptOffer
);

/**
 * @route PATCH /api/offers/:offerId/reject
 * @desc Reject an offer (CUSTOMER only)
 */
router.patch(
  "/:offerId/reject",
  authMiddleware,
  roleMiddleware("CUSTOMER", "ADMIN"),
  offerController.rejectOffer
);

/**
 * @route PATCH /api/offers/:offerId/withdraw
 * @desc Withdraw an offer (USTA only)
 */
router.patch(
  "/:offerId/withdraw",
  authMiddleware,
  roleMiddleware("USTA", "ADMIN"),
  offerController.withdrawOffer
);

export default router;
