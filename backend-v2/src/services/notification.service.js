import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createNotification = async (userId, { type, title, message, icon, jobId, targetUrl }) => {
  return prisma.notification.create({
    data: {
      userId,
      type: type || 'system',
      title,
      message,
      icon: icon || '🔔',
      jobId: jobId || null,
      targetUrl: targetUrl || null,
    },
  });
};

export const getNotifications = async (userId, { limit = 50 } = {}) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

export const getUnreadCount = async (userId) => {
  return prisma.notification.count({
    where: { userId, read: false },
  });
};

export const markAsRead = async (notificationId, userId) => {
  const n = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!n) return null;
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true, readAt: new Date() },
  });
};

export const markAllAsRead = async (userId) => {
  await prisma.notification.updateMany({
    where: { userId },
    data: { read: true, readAt: new Date() },
  });
  return { success: true };
};
