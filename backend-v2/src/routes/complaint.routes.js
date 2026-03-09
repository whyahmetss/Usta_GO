import { Router } from "express";
import * as complaintController from "../controllers/complaint.controller.js";
import { authMiddleware, roleMiddleware, supportMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, complaintController.createComplaint);

// Admin OR Support can read/manage complaints
router.get("/", authMiddleware, supportMiddleware, complaintController.getAllComplaints);
router.put("/:id/resolve", authMiddleware, supportMiddleware, complaintController.resolveComplaint);
router.put("/:id/reject", authMiddleware, supportMiddleware, complaintController.rejectComplaint);

export default router;
