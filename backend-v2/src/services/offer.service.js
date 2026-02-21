import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createOffer = async (jobId, ustaId, data) => {
  // Check if job exists
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    const error = new Error("Job not found");
    error.status = 404;
    throw error;
  }

  // Check if offer already exists
  const existingOffer = await prisma.offer.findUnique({
    where: { jobId_ustaId: { jobId, ustaId } },
  });

  if (existingOffer) {
    const error = new Error("Offer already exists for this job");
    error.status = 409;
    throw error;
  }

  const offer = await prisma.offer.create({
    data: {
      jobId,
      ustaId,
      ...data,
    },
    include: {
      job: { select: { id: true, title: true } },
      usta: { select: { id: true, name: true } },
    },
  });

  return offer;
};

export const getOffers = async (jobId) => {
  const offers = await prisma.offer.findMany({
    where: { jobId },
    include: {
      usta: { select: { id: true, name: true, profileImage: true, ratings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return offers;
};

export const getUstaOffers = async (ustaId, skip = 0, take = 10) => {
  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where: { ustaId },
      skip,
      take,
      include: {
        job: { select: { id: true, title: true, customerId: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.offer.count({ where: { ustaId } }),
  ]);

  return { offers, total };
};

export const acceptOffer = async (offerId, customerId) => {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { job: true },
  });

  if (!offer) {
    const error = new Error("Offer not found");
    error.status = 404;
    throw error;
  }

  if (offer.job.customerId !== customerId) {
    const error = new Error("Unauthorized");
    error.status = 403;
    throw error;
  }

  // Use transaction: accept offer and update job status
  const result = await prisma.$transaction(async (tx) => {
    // Update offer status
    const updatedOffer = await tx.offer.update({
      where: { id: offerId },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
      include: { job: true, usta: true },
    });

    // Update job status
    await tx.job.update({
      where: { id: offer.jobId },
      data: { status: "IN_PROGRESS" },
    });

    // Reject other offers for this job
    await tx.offer.updateMany({
      where: {
        jobId: offer.jobId,
        id: { not: offerId },
        status: "PENDING",
      },
      data: { status: "REJECTED", rejectedAt: new Date() },
    });

    return updatedOffer;
  });

  return result;
};

export const rejectOffer = async (offerId, customerId) => {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { job: true },
  });

  if (!offer) {
    const error = new Error("Offer not found");
    error.status = 404;
    throw error;
  }

  if (offer.job.customerId !== customerId) {
    const error = new Error("Unauthorized");
    error.status = 403;
    throw error;
  }

  const updatedOffer = await prisma.offer.update({
    where: { id: offerId },
    data: {
      status: "REJECTED",
      rejectedAt: new Date(),
    },
  });

  return updatedOffer;
};

export const withdrawOffer = async (offerId, ustaId) => {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
  });

  if (!offer) {
    const error = new Error("Offer not found");
    error.status = 404;
    throw error;
  }

  if (offer.ustaId !== ustaId) {
    const error = new Error("Unauthorized");
    error.status = 403;
    throw error;
  }

  const updatedOffer = await prisma.offer.update({
    where: { id: offerId },
    data: { status: "WITHDRAWN" },
  });

  return updatedOffer;
};
