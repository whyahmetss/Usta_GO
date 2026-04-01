import { PrismaClient } from "@prisma/client";
import { sendPushNotification } from "../utils/firebase.js";

const prisma = new PrismaClient();

const pushTo = async (userId, title, body, data = {}) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { fcmToken: true } });
    if (user?.fcmToken) await sendPushNotification(user.fcmToken, title, body, data);
  } catch {}
};

export const getAllUsers = async (skip = 0, take = 10) => {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        ratings: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count(),
  ]);

  return {
    users: users.map(u => ({ ...u, rating: u.ratings ?? 0 })),
    total,
  };
};

export const banUser = async (userId) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "BANNED" },
  });

  return user;
};

export const unbanUser = async (userId) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" },
  });

  return user;
};

export const getPendingUstas = async () => {
  const users = await prisma.user.findMany({
    where: { role: "USTA", status: "PENDING_APPROVAL" },
    include: {
      certificates: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return users;
};

export const approveUsta = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "USTA") {
    const err = new Error("User not found or not USTA");
    err.status = 404;
    throw err;
  }
  const updated = await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
  pushTo(userId, "🎉 Hesabınız Onaylandı!", "Usta Go'da artık iş alabilirsiniz. Hemen aktif olun!", { type: "approval", status: "approved" });
  return updated;
};

export const rejectUsta = async (userId, reason) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "USTA") {
    const err = new Error("User not found or not USTA");
    err.status = 404;
    throw err;
  }
  const updated = await prisma.user.update({ where: { id: userId }, data: { status: "BANNED" } });
  pushTo(userId, "❌ Başvurunuz Reddedildi", reason ? `Sebep: ${reason}` : "Belgeleriniz incelendi, başvurunuz kabul edilmedi.", { type: "approval", status: "rejected" });
  return updated;
};

export const getPendingCustomers = async () => {
  return prisma.user.findMany({
    where: { role: "CUSTOMER", status: "PENDING_APPROVAL" },
    include: { certificates: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
};

export const approveCustomer = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "CUSTOMER") {
    const err = new Error("User not found or not CUSTOMER");
    err.status = 404;
    throw err;
  }
  const updated = await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
  pushTo(userId, "✅ Hesabınız Onaylandı!", "Usta Go'da iş talepleri oluşturabilirsiniz.", { type: "approval", status: "approved" });
  return updated;
};

export const rejectCustomer = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "CUSTOMER") {
    const err = new Error("User not found or not CUSTOMER");
    err.status = 404;
    throw err;
  }
  const updated = await prisma.user.update({ where: { id: userId }, data: { status: "BANNED" } });
  pushTo(userId, "❌ Başvurunuz Reddedildi", "Belgeleriniz incelendi, başvurunuz kabul edilmedi.", { type: "approval", status: "rejected" });
  return updated;
};

export const deleteUser = async (userId) => {
  // Cascade delete via Prisma schema
  await prisma.user.delete({
    where: { id: userId },
  });

  return { message: "User deleted successfully" };
};

export const deleteJob = async (jobId) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job) {
    const error = new Error("Job not found");
    error.status = 404;
    throw error;
  }

  await prisma.job.delete({ where: { id: jobId } });

  return { message: "Job deleted successfully" };
};

export const deleteOffer = async (offerId) => {
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });

  if (!offer) {
    const error = new Error("Offer not found");
    error.status = 404;
    throw error;
  }

  await prisma.offer.delete({ where: { id: offerId } });

  return { message: "Offer deleted successfully" };
};

export const getStatistics = async () => {
  const [totalUsers, totalJobs, totalOffers, usersByRole] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.offer.count(),
    prisma.user.groupBy({
      by: ["role"],
      _count: true,
    }),
  ]);

  return {
    totalUsers,
    totalJobs,
    totalOffers,
    usersByRole,
  };
};

export const getSystemHealth = async () => {
  const dbConnection = await prisma.$queryRaw`SELECT 1`;

  return {
    database: dbConnection ? "OK" : "ERROR",
    timestamp: new Date(),
  };
};
