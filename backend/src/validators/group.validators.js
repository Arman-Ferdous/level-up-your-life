import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Group name is required").max(120)
});

export const joinGroupSchema = z.object({
  joinCode: z
    .string()
    .trim()
    .min(6, "Join code must be 6 characters")
    .max(6, "Join code must be 6 characters")
    .regex(/^[a-zA-Z0-9]{6}$/, "Join code must be alphanumeric")
});
