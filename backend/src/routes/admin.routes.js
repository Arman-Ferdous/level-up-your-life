import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { getAllUsers, deleteUserById } from "../controllers/admin.controller.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin"));
adminRouter.get("/users", getAllUsers);
adminRouter.delete("/users/:id", deleteUserById);
