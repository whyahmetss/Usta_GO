import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createJob = async (customerId, data) => {
  const job = await prisma.job.create({
    data: {
      ...data,
      customerId,
    },
    include: {
      customer: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return job;
};

export const getJobs = async (filters = {}, skip = 0, take = 10) => {
  const where = {};

  if (filters.category) where.category = filters.category;
  if (filters.location) where.location = { contains: filters.location, mode: "insensitive" };
  if (filters.status) where.status = filters.status;

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take,
      include: {
        customer: { select: { id: true, name: true } },
        offers: { select: { id: true, ustaId: true, price: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.job.count({ where }),
  ]);

  return { jobs, total };
};

export const getJobById = async (jobId) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      offers: {
        include: {
          usta: { select: { id: true, name: true, profileImage: true, ratings: true } },
        },
      },
      reviews: true,
    },
  });

  if (!job) {
    const error = new Error("Job not found");
    error.status = 404;
    throw error;
  }

  return job;
};

export const updateJob = async (jobId, customerId, data) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job) {
    const error = new Error("Job not found");
    error.status = 404;
    throw error;
  }

  if (job.customerId !== customerId) {
    const error = new Error("Unauthorized");
    error.status = 403;
    throw error;
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data,
    include: { customer: { select: { id: true, name: true } } },
  });

  return updatedJob;
};

export const deleteJob = async (jobId, customerId) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job) {
    const error = new Error("Job not found");
    error.status = 404;
    throw error;
  }

  if (job.customerId !== customerId) {
    const error = new Error("Unauthorized");
    error.status = 403;
    throw error;
  }

  await prisma.job.delete({ where: { id: jobId } });

  return { message: "Job deleted successfully" };
};

export const getCustomerJobs = async (customerId, skip = 0, take = 10) => {
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where: { customerId },
      skip,
      take,
      include: { offers: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.job.count({ where: { customerId } }),
  ]);

  return { jobs, total };
};

export const updateJobStatus = async (jobId, customerId, status) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job) {
    const error = new Error("Job not found");
    error.status = 404;
    throw error;
  }

  if (job.customerId !== customerId) {
    const error = new Error("Unauthorized");
    error.status = 403;
    throw error;
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: { status },
  });

  return updatedJob;
};

export const acceptJob = async (jobId, ustaId) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { usta: true },
  });

  if (!job) {
    const error = new Error("Job not found");
    error.status = 404;
    throw error;
  }

  if (job.status !== "PENDING") {
    const error = new Error("Job is not available for acceptance");
    error.status = 400;
    throw error;
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: "ACCEPTED",
      ustaId,
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      usta: { select: { id: true, name: true, email: true } },
    },
  });

  return updatedJob;
};

export const startJob = async (jobId, ustaId, beforePhotos = []) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job) {
    const error = new Error("Job not found");
    error.status = 404;
    throw error;
  }

  if (job.ustaId !== ustaId) {
    const error = new Error("Unauthorized");
    error.status = 403;
    throw error;
  }

  if (job.status !== "ACCEPTED") {
    const error = new Error("Job must be accepted before starting");
    error.status = 400;
    throw error;
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: "IN_PROGRESS",
      beforePhotos,
      startedAt: new Date(),
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      usta: { select: { id: true, name: true, email: true } },
    },
  });

  return updatedJob;
};

export const completeJob = async (jobId, ustaId, afterPhotos = []) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job) {
    const error = new Error("Job not found");
    error.status = 404;
    throw error;
  }

  if (job.ustaId !== ustaId) {
    const error = new Error("Unauthorized");
    error.status = 403;
    throw error;
  }

  if (job.status !== "IN_PROGRESS") {
    const error = new Error("Job must be in progress to complete");
    error.status = 400;
    throw error;
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: "COMPLETED",
      afterPhotos,
      completedAt: new Date(),
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      usta: { select: { id: true, name: true, email: true } },
    },
  });

  return updatedJob;
};

export const cancelJob = async (jobId, userId, reason = "", penalty = 0) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job) {
    const error = new Error("Job not found");
    error.status = 404;
    throw error;
  }

  // Either customer or usta can cancel
  const isCustomer = job.customerId === userId;
  const isUsta = job.ustaId === userId;

  if (!isCustomer && !isUsta) {
    const error = new Error("Unauthorized");
    error.status = 403;
    throw error;
  }

  if (job.status === "COMPLETED" || job.status === "CANCELLED") {
    const error = new Error("Cannot cancel job in this status");
    error.status = 400;
    throw error;
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: "CANCELLED",
      cancelReason: reason,
      cancelPenalty: penalty,
      cancelledAt: new Date(),
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      usta: { select: { id: true, name: true, email: true } },
    },
  });

  return updatedJob;
};

export const rateJob = async (jobId, customerId, ratingData, review = "") => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job) {
    const error = new Error("Job not found");
    error.status = 404;
    throw error;
  }

  if (job.customerId !== customerId) {
    const error = new Error("Unauthorized");
    error.status = 403;
    throw error;
  }

  if (job.status !== "COMPLETED") {
    const error = new Error("Job must be completed before rating");
    error.status = 400;
    throw error;
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: "RATED",
      rating: ratingData.rating,
      ratingReview: review,
      ratedAt: new Date(),
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      usta: { select: { id: true, name: true, email: true } },
    },
  });

  return updatedJob;
};
