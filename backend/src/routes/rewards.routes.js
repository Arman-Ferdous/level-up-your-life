import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requirePremium } from "../middlewares/premium.middleware.js";
import { claimDailyBonus, getDailyBonusStatus } from "../controllers/rewards.controller.js";

export const rewardsRouter = Router();

rewardsRouter.use(requireAuth);
rewardsRouter.post("/daily-login", requirePremium, claimDailyBonus);
rewardsRouter.get("/daily-login/status", getDailyBonusStatus);
