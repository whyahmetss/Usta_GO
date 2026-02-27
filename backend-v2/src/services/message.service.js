import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
      sender: { select: { id: true, name: true, profileImage: true } },
      receiver: { select: { id: true, name: true, profileImage: true } },
    },
  });

  return message;
};

export const getMessages = async (userId, otherUserId, skip = 0, take = 50) => {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });

  return messages.reverse(); // Show oldest first
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
