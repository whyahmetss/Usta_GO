import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CUSTOMER", "USTA"]).default("CUSTOMER"),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  referralCode: z.preprocess(
    (v) => {
      if (v === null || v === undefined) return undefined;
      if (typeof v === "string" && v.trim() === "") return undefined;
      return v;
    },
    z.string().optional()
  ),
}).passthrough();

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  profileImage: z.string().optional(),
  isActive: z.boolean().optional(),
});
