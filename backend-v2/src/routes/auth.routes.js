import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateBody } from "../middlewares/validation.middleware.js";
import { registerSchema, loginSchema, updateProfileSchema } from "../validators/auth.validator.js";

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @body {name, email, password, role?, phone?}
 */
router.post("/register", validateBody(registerSchema), authController.register);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @body {email, password}
 */
router.post("/login", validateBody(loginSchema), authController.login);

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 */
router.get("/profile", authMiddleware, authController.getProfile);
/**
 * @route GET /api/auth/me
 * @desc Get current user (Frontend specifically asks for this)
 */
router.get("/me", authMiddleware, authController.getProfile);
/**
 * @route PUT /api/auth/profile
 * @desc Update current user profile
 * @body {name?, bio?, phone?, profileImage?}
 */
router.put("/profile", authMiddleware, validateBody(updateProfileSchema), authController.updateProfile);

/**
 * @route POST /api/auth/fcm-token
 * @desc Save FCM push notification token for the authenticated user
 * @body {fcmToken}
 */
router.post("/fcm-token", authMiddleware, authController.saveFcmToken);

/**
 * @route POST /api/auth/social-login
 * @desc Social login (Apple / Google) — token doğrulama + kullanıcı oluştur/bul
 * @body {provider, idToken, name?, email?}
 */
router.post("/social-login", authController.socialLogin);

/**
 * @route DELETE /api/auth/account
 * @desc Hesap silme (soft delete) — KVKK uyumlu
 */
router.delete("/account", authMiddleware, authController.deleteAccount);

export default router;
