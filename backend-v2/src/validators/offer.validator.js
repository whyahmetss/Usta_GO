import { z } from "zod";

export const createOfferSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  price: z.number().positive("Price must be positive"),
  message: z.string().optional(),
});

export const acceptOfferSchema = z.object({
  offerId: z.string().min(1, "Offer ID is required"),
});

export const rejectOfferSchema = z.object({
  offerId: z.string().min(1, "Offer ID is required"),
});

export const withdrawOfferSchema = z.object({
  offerId: z.string().min(1, "Offer ID is required"),
});
