import { z } from "zod";

export const createReviewSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  ustaId: z.string().min(1, "Usta ID is required"),
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  comment: z.string().optional(),
});
