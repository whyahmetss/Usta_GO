import prisma from "../utils/prisma.js";
import { sendPushNotification } from "../utils/firebase.js";

export const sendMessage = async (senderId, receiverId, content) => {
  if (senderId === receiverId) {
    const error = new Error("Cannot send message to yourself");
    error.status = 400;
    throw error;
  }

  const message = await prisma.message.create({
    data: {
      content,
      senderId,
      receiverId,
    },
    include: {
      sender: { select: { id: true, name: true, profileImage: true, role: true } },
      receiver: { select: { id: true, name: true, profileImage: true, role: true, fcmToken: true } },
    },
  });

  // Push notification gönder (arka planda, hata olsa bile mesajı engelleme)
  if (message.receiver?.fcmToken) {
    const senderName = message.sender?.name || "Birisi";
    const senderRole = (message.sender?.role || "").toUpperCase();
    const isAdmin = senderRole === "ADMIN" || senderRole === "SUPPORT";
    const title = isAdmin ? "Usta Go — Destek" : `${senderName} — Mesaj`;
    const body = (content || "").substring(0, 120) || "Yeni bir mesaj aldınız";

    sendPushNotification(message.receiver.fcmToken, title, body, {
      type: "message",
      senderId,
      messageId: message.id,
    }).catch(() => {}); // sessizce devam et
  }

  // fcmToken'ı response'dan çıkar
  if (message.receiver) {
    delete message.receiver.fcmToken;
  }

  return message;
};

const MSG_USER_SELECT = { id: true, name: true, profileImage: true, role: true };

export const getMessagesMultiSender = async (senderIds, otherUserId, skip = 0, take = 50, since = null) => {
  const orConditions = [];
  for (const sid of senderIds) {
    orConditions.push({ senderId: sid, receiverId: otherUserId });
    orConditions.push({ senderId: otherUserId, receiverId: sid });
  }
  const where = { OR: orConditions };
  if (since) where.createdAt = { gte: new Date(since) };

  const messages = await prisma.message.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: "desc" },
    include: { sender: { select: MSG_USER_SELECT }, receiver: { select: MSG_USER_SELECT } },
  });
  return messages.reverse();
};

export const getMessages = async (userId, otherUserId, skip = 0, take = 50, since = null) => {
  const where = {
    OR: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
  };
  if (since) where.createdAt = { gte: new Date(since) };

  const messages = await prisma.message.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: "desc" },
    include: { sender: { select: MSG_USER_SELECT }, receiver: { select: MSG_USER_SELECT } },
  });
  return messages.reverse();
};

export const markMessageAsRead = async (messageId, userId) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    const error = new Error("Message not found");
    error.status = 404;
    throw error;
  }

  if (message.receiverId !== userId) {
    const error = new Error("Unauthorized");
    error.status = 403;
    throw error;
  }

  const updatedMessage = await prisma.message.update({
    where: { id: messageId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
    select: {
      id: true,
      senderId: true,
      receiverId: true,
      isRead: true,
      readAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedMessage;
};

export const getUnreadMessages = async (userId) => {
  const messages = await prisma.message.findMany({
    where: {
      receiverId: userId,
      isRead: false,
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true } },
    },
  });
  return messages;
};

export const getConversations = async (userId) => {
  const conversations = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    distinct: ["senderId", "receiverId"],
    orderBy: { createdAt: "desc" },
  });

  return conversations;
};
