import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { paySubscription, getAdminRevenue } from "../controllers/subscription.controller.js";

export const subscriptionRouter = Router();

subscriptionRouter.post("/pay", requireAuth, paySubscription);
subscriptionRouter.get("/admin/revenue", requireAuth, requireRole("admin"), getAdminRevenue);
