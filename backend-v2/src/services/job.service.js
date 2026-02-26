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
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      offers: {
        where: { status: "ACCEPTED" },
      },
    },
  });

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

  // When job is completed, transfer money to USTA
  if (status === "COMPLETED" && job.offers.length > 0) {
    const acceptedOffer = job.offers[0];

    // Update USTA's balance
    await prisma.user.update({
      where: { id: acceptedOffer.ustaId },
      data: {
        balance: {
          increment: job.budget,
        },
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: acceptedOffer.ustaId,
        jobId,
        amount: job.budget,
        type: "EARNING",
        status: "COMPLETED",
        description: `İşi tamamlandı: ${job.title}`,
      },
    });
  }

  return updatedJob;
};
