import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "task_due",
  "task_completed",
  "task_reminder",
  "task_overdue"
]);

export const notificationParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid notification ID")
});
