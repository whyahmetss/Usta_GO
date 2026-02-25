import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route POST /api/upload/photo
 * @desc Upload a single photo
 */
router.post("/photo", authMiddleware, userController.uploadPhoto);

/**
 * @route POST /api/upload/photos
 * @desc Upload multiple photos
 */
router.post("/photos", authMiddleware, userController.uploadPhotos);

export default router;
