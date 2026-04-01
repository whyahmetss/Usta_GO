import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  category: z.string().min(2, "Category is required"),
  location: z.string().min(2, "Location is required"),
  budget: z.number().min(0, "Budget must be 0 or positive").optional().default(0),
  photos: z.array(z.string()).optional(),
  status: z.string().optional(),
}).passthrough();

export const updateJobSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  budget: z.number().positive().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
});

export const jobStatusUpdateSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});
