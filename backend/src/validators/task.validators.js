import mongoose from "mongoose";
import { z } from "zod";

const weekdaySchema = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
const reminderTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:mm format").nullable().optional();

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(500).default(""),
  type: z.enum(["habit", "deadline", "once"]),
  groupId: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.string().trim().refine((value) => mongoose.Types.ObjectId.isValid(value), "Invalid group id").optional()
  ).optional(),
  dueDate: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.string().datetime().nullable().optional()
  ),
  reminderWeekdays: z.array(weekdaySchema).max(7).default([]),
  reminderTime: reminderTimeSchema,
  priority: z.enum(["low", "medium", "high"]).default("medium")
}).superRefine((data, ctx) => {
  const isGroupTask = Boolean(data.groupId);

  if (isGroupTask && data.type === "deadline") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["type"],
      message: "Group tasks do not support deadline type. Use one-time task with a due date."
    });
  }

  if (isGroupTask && data.type === "once" && !data.dueDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dueDate"],
      message: "Due date is required for group one-time tasks"
    });
  }

  if (data.type === "deadline" && !data.dueDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dueDate"],
      message: "Due date is required for deadline tasks"
    });
  }

  if (data.type === "habit" && data.reminderWeekdays.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["reminderWeekdays"],
      message: "Select at least one weekday for habit reminders"
    });
  }
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  type: z.enum(["habit", "deadline", "once"]).optional(),
  dueDate: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.string().datetime().nullable().optional()
  ),
  reminderWeekdays: z.array(weekdaySchema).max(7).optional(),
  reminderTime: reminderTimeSchema,
  completed: z.boolean().optional(),
  priority: z.enum(["low", "medium", "high"]).optional()
});
