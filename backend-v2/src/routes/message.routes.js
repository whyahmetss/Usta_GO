import { Router } from "express";
import * as messageController from "../controllers/message.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route POST /api/messages
 * @desc Send a message to another user
 * @body {receiverId, content}
 */
router.post("/", authMiddleware, messageController.sendMessage);

/**
 * @route GET /api/messages
 * @desc Get all conversations
 */
router.get("/", authMiddleware, messageController.getConversations);

/**
 * @route GET /api/messages/unread
 * @desc Get all unread messages for current user
 */
router.get("/unread", authMiddleware, messageController.getUnreadMessages);

/**
 * @route GET /api/messages/:userId
 * @desc Get messages with a specific user
 * @query {page?, limit?}
 */
router.get("/:userId", authMiddleware, messageController.getMessages);

/**
 * @route PATCH /api/messages/:messageId/read
 * @desc Mark message as read
 */
router.patch("/:messageId/read", authMiddleware, messageController.markAsRead);

export default router;
