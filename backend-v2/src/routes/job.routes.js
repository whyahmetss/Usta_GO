import { Router } from "express";
import * as jobController from "../controllers/job.controller.js";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import { createJobSchema, updateJobSchema, jobStatusUpdateSchema } from "../validators/job.validator.js";

const router = Router();

/**
 * @route POST /api/jobs
 * @desc Create a new job (CUSTOMER only)
 * @body {title, description, category, location, budget}
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("CUSTOMER", "ADMIN"),
  validateBody(createJobSchema),
  jobController.createJob
);

/**
 * @route GET /api/jobs
 * @desc Get all jobs with filters
 * @query {page?, limit?, category?, location?, status?}
 */
router.get("/", jobController.getJobs);

/**
 * @route GET /api/jobs/my-jobs
 * @desc Get current user's jobs
 * @query {page?, limit?}
 */
router.get("/my-jobs", authMiddleware, jobController.getMyJobs);

/**
 * @route GET /api/jobs/:id
 * @desc Get job by ID
 */
router.get("/:id", jobController.getJobById);

/**
 * @route PUT /api/jobs/:id
 * @desc Update job (only by creator)
 * @body {title?, description?, category?, location?, budget?, status?}
 */
router.put(
  "/:id",
  authMiddleware,
  validateBody(updateJobSchema),
  jobController.updateJob
);

/**
 * @route DELETE /api/jobs/:id
 * @desc Delete job (only by creator)
 */
router.delete("/:id", authMiddleware, jobController.deleteJob);

/**
 * @route PATCH /api/jobs/:id/status
 * @desc Update job status
 * @body {status: PENDING|IN_PROGRESS|COMPLETED|CANCELLED}
 */
router.patch(
  "/:id/status",
  authMiddleware,
  validateBody(jobStatusUpdateSchema),
  jobController.updateJobStatus
);

export default router;
