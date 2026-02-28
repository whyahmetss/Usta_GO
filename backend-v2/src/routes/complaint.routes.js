import { Router } from "express";
import * as complaintController from "../controllers/complaint.controller.js";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route POST /api/complaints
 * @desc File a complaint (any authenticated user)
 * @body {jobId, reason, details?, filedBy}
 */
router.post("/", authMiddleware, complaintController.createComplaint);

/**
 * @route GET /api/complaints
 * @desc Get all complaints (ADMIN only)
 */
router.get("/", authMiddleware, roleMiddleware("ADMIN"), complaintController.getAllComplaints);

/**
 * @route PUT /api/complaints/:id/resolve
 * @desc Resolve a complaint (ADMIN only)
 */
router.put("/:id/resolve", authMiddleware, roleMiddleware("ADMIN"), complaintController.resolveComplaint);

/**
 * @route PUT /api/complaints/:id/reject
 * @desc Reject a complaint (ADMIN only)
 */
router.put("/:id/reject", authMiddleware, roleMiddleware("ADMIN"), complaintController.rejectComplaint);

export default router;
