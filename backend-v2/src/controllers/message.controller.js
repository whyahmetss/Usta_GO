import * as messageService from "../services/message.service.js";
import { successResponse } from "../utils/response.js";
import { io } from "../index.js";

export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;
    const message = await messageService.sendMessage(req.user.id, receiverId, content);
    // Notify recipient in real-time
    io.to(`user_${receiverId}`).emit("receive_message", message);
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

    const messages = await messageService.getMessages(req.user.id, userId, skip, limit);
    successResponse(res, messages, "Messages fetched successfully");
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const message = await messageService.markMessageAsRead(messageId, req.user.id);
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
