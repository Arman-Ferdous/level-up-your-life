import { z } from "zod";

export const createChallengeSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(500).default(""),
  betAmount: z.number().int().positive("Bet amount must be a positive number"),
  dueDate: z.string().datetime("Invalid due date")
});
