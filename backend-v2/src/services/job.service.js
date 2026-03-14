import { PrismaClient } from "@prisma/client";
import { getCancellationRates } from "./config.service.js";

const prisma = new PrismaClient();

export const createJob = async (customerId, data) => {
  // Only extract fields that exist in the Prisma schema
  const { title, description, category, location, budget, status, photos, price } = data;

  const amount = price || budget || 0

  // Bakiye kontrolü
  if (amount > 0) {
    const customer = await prisma.user.findUnique({ where: { id: customerId }, select: { balance: true } })
    if (!customer || customer.balance < amount) {
      const err = new Error(`Yetersiz bakiye. Gereken: ${amount} TL, Mevcut: ${customer?.balance ?? 0} TL`)
      err.statusCode = 402
      throw err
    }
  }

  // İş oluştur + bakiye düş (atomik)
  const [job] = await prisma.$transaction([
    prisma.job.create({
      data: {
        title,
        description,
        category,
        location,
        budget: amount,
        status,
        photos: photos || [],
        customerId,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
      },
    }),
    ...(amount > 0 ? [
      prisma.user.update({
        where: { id: customerId },
        data: { balance: { decrement: amount } },
      }),
    ] : []),
  ]);

  // Transaction kaydı
  if (amount > 0) {
    await prisma.transaction.create({
      data: {
        amount: -amount,
        type: 'WITHDRAWAL',
        description: `İş ödemesi: ${title}`,
        userId: customerId,
        jobId: job.id,
      },
    })
  }

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
        customer: { select: { id: true, name: true, email: true, profileImage: true } },
        usta: { select: { id: true, name: true, email: true, profileImage: true } },
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
      customer: { select: { id: true, name: true, email: true, profileImage: true } },
      usta: { select: { id: true, name: true, email: true, profileImage: true } },
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
      include: {
        customer: { select: { id: true, name: true, email: true, profileImage: true } },
        usta: { select: { id: true, name: true, email: true, profileImage: true } },
        offers: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.job.count({ where: { customerId } }),
  ]);

  return { jobs, total };
};

export const getMyJobs = async (userId, role, skip = 0, take = 50) => {
  const where =
    role === "USTA"
      ? { ustaId: userId }
      : { customerId: userId };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take,
      include: {
        customer: { select: { id: true, name: true, email: true, profileImage: true } },
        usta: { select: { id: true, name: true, email: true, profileImage: true } },
        offers: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.job.count({ where }),
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
  const usta = await prisma.user.findUnique({ where: { id: ustaId }, select: { status: true, isActive: true } });
  if (!usta) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
  if (usta.status === "PENDING_APPROVAL") {
    const error = new Error("Hesabınız henüz admin tarafından onaylanmadı. İş kabul edemezsiniz.");
    error.status = 403;
    throw error;
  }
  if (!usta.isActive) {
    const error = new Error("İş alma durumunuz pasif. Yeni iş kabul edebilmek için Ayarlar > İş Alma Durumu'nu açın.");
    error.status = 403;
    throw error;
  }

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

  if (!afterPhotos || afterPhotos.length === 0) {
    const error = new Error("İş bitim fotoğrafı zorunludur");
    error.status = 400;
    throw error;
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: "PENDING_APPROVAL",
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

export const approveJob = async (jobId, customerId) => {
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

  if (job.status !== "PENDING_APPROVAL") {
    const error = new Error("İş onay bekliyor durumunda değil");
    error.status = 400;
    throw error;
  }

  const COMMISSION_RATE = 0.12
  const commission = Math.round(job.budget * COMMISSION_RATE)
  const ustaEarning = job.budget - commission

  const updatedJob = await prisma.$transaction(async (tx) => {
    const jobData = await tx.job.update({
      where: { id: jobId },
      data: { status: "COMPLETED" },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        usta: { select: { id: true, name: true, email: true } },
      },
    });

    await tx.user.update({
      where: { id: job.ustaId },
      data: { balance: { increment: ustaEarning } },
    });

    await tx.transaction.create({
      data: {
        userId: job.ustaId,
        jobId: jobId,
        amount: ustaEarning,
        type: "EARNING",
        status: "COMPLETED",
        description: `${job.title} işi onaylandı`,
      },
    });

    return jobData;
  });

  return updatedJob;
};

export const rejectJob = async (jobId, customerId, reason = "") => {
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

  if (job.status !== "PENDING_APPROVAL") {
    const error = new Error("İş onay bekliyor durumunda değil");
    error.status = 400;
    throw error;
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: "IN_PROGRESS",
      afterPhotos: [],
      completedAt: null,
      cancelReason: reason ? `Red sebebi: ${reason}` : null,
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

  // PENDING job: usta may have an offer but not be assigned - allow "reject" by withdrawing offer
  if (!isCustomer && !isUsta && job.status === "PENDING") {
    const offer = await prisma.offer.findFirst({
      where: { jobId, ustaId: userId, status: "PENDING" },
    });
    if (offer) {
      await prisma.offer.update({
        where: { id: offer.id },
        data: { status: "WITHDRAWN" },
      });
      const updatedJob = await prisma.job.findUnique({
        where: { id: jobId },
        include: { customer: true, usta: true },
      });
      return { ...updatedJob, withdrawnOffer: true };
    }
    const err = new Error("Bu işe teklif vermediniz veya teklifiniz zaten geri alındı. İptal edilecek bir bağlantınız yok.");
    err.status = 403;
    throw err;
  }

  if (!isCustomer && !isUsta) {
    const error = new Error("Bu işi iptal etme yetkiniz yok.");
    error.status = 403;
    throw error;
  }

  if (job.status === "COMPLETED" || job.status === "CANCELLED" || job.status === "RATED") {
    const error = new Error("Cannot cancel job in this status");
    error.status = 400;
    throw error;
  }

  // Ceza: Müşteri iptal ederse 0, Usta iptal ederse config oranlarından
  let finalPenalty = penalty
  if (isCustomer) {
    finalPenalty = 0
  } else if (finalPenalty === 0 && job.budget > 0) {
    const rates = await getCancellationRates()
    const pct = job.status === "IN_PROGRESS" ? (rates.inProgress || 50) / 100
      : job.status === "ACCEPTED" ? (rates.accepted || 25) / 100
      : (rates.pending || 5) / 100
    finalPenalty = Math.round(job.budget * pct)
  }

  const refundAmount = Math.max(0, (job.budget || 0) - finalPenalty)

  // İptal + bakiye iade (atomik)
  const [updatedJob] = await prisma.$transaction([
    prisma.job.update({
      where: { id: jobId },
      data: {
        status: "CANCELLED",
        cancelReason: reason,
        cancelPenalty: finalPenalty,
        cancelledAt: new Date(),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        usta: { select: { id: true, name: true, email: true } },
      },
    }),
    ...(refundAmount > 0 ? [
      prisma.user.update({
        where: { id: job.customerId },
        data: { balance: { increment: refundAmount } },
      }),
    ] : []),
  ]);

  // Transaction kayıtları
  const txRecords = []
  if (refundAmount > 0) {
    txRecords.push(
      prisma.transaction.create({
        data: {
          amount: refundAmount,
          type: 'REFUND',
          description: `İptal iadesi: ${job.title}${finalPenalty > 0 ? ` (${finalPenalty} TL ceza kesildi)` : ''}`,
          userId: job.customerId,
          jobId,
        },
      })
    )
  }
  if (finalPenalty > 0) {
    txRecords.push(
      prisma.transaction.create({
        data: {
          amount: -finalPenalty,
          type: 'WITHDRAWAL',
          description: `İptal cezası: ${job.title}`,
          userId: job.customerId,
          jobId,
        },
      })
    )
  }
  if (txRecords.length > 0) await Promise.all(txRecords)

  return { ...updatedJob, refundAmount, penaltyApplied: finalPenalty };
};

export const rateJob = async (jobId, customerId, rating, review = "") => {
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

  const updatedJob = await prisma.$transaction(async (tx) => {
    const rated = await tx.job.update({
      where: { id: jobId },
      data: {
        status: "RATED",
        rating: rating,
        ratingReview: review,
        ratedAt: new Date(),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        usta: { select: { id: true, name: true, email: true } },
      },
    });

    // Usta'nın ortalama puanını güncelle
    if (rated.ustaId) {
      const ratedJobs = await tx.job.findMany({
        where: { ustaId: rated.ustaId, rating: { not: null } },
        select: { rating: true },
      });
      const avgRating =
        ratedJobs.reduce((sum, j) => sum + j.rating, 0) / ratedJobs.length;
      await tx.user.update({
        where: { id: rated.ustaId },
        data: { ratings: avgRating },
      });
    }

    return rated;
  });

  return updatedJob;
};
