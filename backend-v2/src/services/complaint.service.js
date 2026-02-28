import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createComplaint = async (filedById, data) => {
  const { jobId, reason, details } = data;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      customer: { select: { id: true } },
      usta: { select: { id: true } },
    },
  });

  if (!job) {
    const error = new Error("Job not found");
    error.status = 404;
    throw error;
  }

  // Only customer or usta of this job can file a complaint
  if (job.customerId !== filedById && job.ustaId !== filedById) {
    const error = new Error("You are not part of this job");
    error.status = 403;
    throw error;
  }

  const complaint = await prisma.complaint.create({
    data: {
      reason,
      details: details || null,
      jobId,
      filedById,
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          customer: { select: { id: true, name: true, email: true, phone: true } },
          usta: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      filedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return complaint;
};

export const getAllComplaints = async () => {
  const complaints = await prisma.complaint.findMany({
    include: {
      job: {
        select: {
          id: true,
          title: true,
          customer: { select: { id: true, name: true, email: true, phone: true } },
          usta: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      filedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { filedAt: "desc" },
  });

  // Map to frontend expected format
  return complaints.map((c) => ({
    id: c.id,
    reason: c.reason,
    details: c.details,
    status: c.status.toLowerCase(), // OPEN -> open
    filedAt: c.filedAt,
    jobId: c.job.id,
    jobTitle: c.job.title,
    customerName: c.job.customer?.name || "-",
    customerEmail: c.job.customer?.email || "-",
    customerPhone: c.job.customer?.phone || "-",
    professionalName: c.job.usta?.name || "-",
    professionalEmail: c.job.usta?.email || "-",
    professionalPhone: c.job.usta?.phone || "-",
  }));
};

export const resolveComplaint = async (id) => {
  const complaint = await prisma.complaint.findUnique({ where: { id } });

  if (!complaint) {
    const error = new Error("Complaint not found");
    error.status = 404;
    throw error;
  }

  return prisma.complaint.update({
    where: { id },
    data: { status: "RESOLVED" },
  });
};

export const rejectComplaint = async (id) => {
  const complaint = await prisma.complaint.findUnique({ where: { id } });

  if (!complaint) {
    const error = new Error("Complaint not found");
    error.status = 404;
    throw error;
  }

  return prisma.complaint.update({
    where: { id },
    data: { status: "REJECTED" },
  });
};
