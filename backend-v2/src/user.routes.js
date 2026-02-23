import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();
// Frontend'in aradığı adres: /api/upload/photo
router.post("/upload/photo", authMiddleware, userController.uploadPhoto);

export default router;
