import { z } from "zod";

export const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(500)
      })
    )
    .min(1)
    .max(12)
});