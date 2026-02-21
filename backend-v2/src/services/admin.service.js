import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

  return { users, total };
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
