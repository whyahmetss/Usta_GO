import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createReview = async (customerId, data) => {
  const { jobId, ustaId, rating, comment } = data;

  // Check if job exists and is completed
  const job = await prisma.job.findUnique({
    where: { id: jobId },
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

  if (job.status !== "COMPLETED") {
    const error = new Error("Can only review completed jobs");
    error.status = 400;
    throw error;
  }

  // Check if review already exists
  const existingReview = await prisma.review.findUnique({
    where: { jobId },
  });

  if (existingReview) {
    const error = new Error("Review already exists for this job");
    error.status = 409;
    throw error;
  }

  // Create review and update user rating
  const result = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        jobId,
        customerId,
        ustaId,
        rating,
        comment,
      },
    });

    // Update user ratings (calculate average)
    const allReviews = await tx.review.findMany({
      where: { ustaId },
    });

    const averageRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await tx.user.update({
      where: { id: ustaId },
      data: { ratings: averageRating },
    });

    return review;
  });

  return result;
};

export const getReviewsByUsta = async (ustaId, skip = 0, take = 10) => {
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { ustaId },
      skip,
      take,
      include: {
        customer: { select: { id: true, name: true, profileImage: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.count({ where: { ustaId } }),
  ]);

  return { reviews, total };
};

export const getReviewsByJob = async (jobId) => {
  const reviews = await prisma.review.findMany({
    where: { jobId },
    include: {
      customer: { select: { id: true, name: true } },
    },
  });

  return reviews;
};
