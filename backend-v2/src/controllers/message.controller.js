import * as messageService from "../services/message.service.js";
import { successResponse } from "../utils/response.js";
import { io } from "../index.js";
import { analyzeMessage } from "../utils/messageFilter.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;

    // Güvenlik kontrolü
    const check = analyzeMessage(content);
    if (check.blocked) {
      return res.status(400).json({ success: false, error: check.reason });
    }

    const message = await messageService.sendMessage(req.user.id, receiverId, content);
    // Notify recipient in real-time
    io.to(`user_${receiverId}`).emit("receive_message", message);
    // Notify support_room so all agents/admins see incoming messages in real-time
    io.to("support_room").emit("support_new_message", message);
    successResponse(res, message, "Message sent successfully", 201);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const role = (req.user.role || "").toUpperCase();
    const since = req.query.since || null;

    // SUPPORT and ADMIN: show ALL messages between any support team member and the customer
    if (role === "SUPPORT" || role === "ADMIN") {
      const supportUsers = await prisma.user.findMany({
        where: { role: { in: ["SUPPORT", "ADMIN"] } },
        select: { id: true },
      });
      const agentIds = supportUsers.map(u => u.id);
      if (!agentIds.includes(req.user.id)) agentIds.push(req.user.id);

      const messages = await messageService.getMessagesMultiSender(
        agentIds, userId, skip, limit, since
      );
      return successResponse(res, messages, "Messages fetched successfully");
    }

    const messages = await messageService.getMessages(req.user.id, userId, skip, limit, since);
    successResponse(res, messages, "Messages fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const message = await messageService.markMessageAsRead(messageId, req.user.id);
    // Notify sender so they can show "seen"
    if (message?.senderId) {
      io.to(`user_${message.senderId}`).emit("message_read", {
        messageId: message.id,
        readerId: req.user.id,
        readAt: message.readAt,
      });
    }
    successResponse(res, message, "Message marked as read");
  } catch (error) {
    next(error);
  }
};

export const getUnreadMessages = async (req, res, next) => {
  try {
    const messages = await messageService.getUnreadMessages(req.user.id);
    successResponse(res, messages, "Unread messages fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const conversations = await messageService.getConversations(req.user.id);
    successResponse(res, conversations, "Conversations fetched successfully");
  } catch (error) {
    next(error);
  }
};
