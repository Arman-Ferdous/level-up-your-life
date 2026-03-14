import { z } from "zod";

const transactionTypeSchema = z.enum(["income", "expense"]);

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  category: z.string().min(2).max(60).trim(),
  amount: z.number().positive().max(100000000),
  note: z.string().max(240).trim().optional().default(""),
  date: dateSchema,
});

export const updateTransactionSchema = z
  .object({
    type: transactionTypeSchema.optional(),
    category: z.string().min(2).max(60).trim().optional(),
    amount: z.number().positive().max(100000000).optional(),
    note: z.string().max(240).trim().optional(),
    date: dateSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
