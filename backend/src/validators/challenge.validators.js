import { z } from "zod";

export const createChallengeSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(500).default(""),
  betAmount: z.number().int().positive("Bet amount must be a positive number"),
  dueDate: z.string().datetime("Invalid due date")
});

export const createMonthlyChallengeSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    description: z.string().trim().max(500).default(""),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2024),
    startDate: z.string().datetime("Invalid start date"),
    endDate: z.string().datetime("Invalid end date")
  })
  .refine((value) => new Date(value.endDate).getTime() > new Date(value.startDate).getTime(), {
    message: "End date must be after start date",
    path: ["endDate"]
  });
