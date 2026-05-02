import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getAiGuide, trackAiSuggestionAction } from "../controllers/aiGuideController.js";

export const aiRouter = Router();

aiRouter.use(requireAuth);
aiRouter.post("/guide", getAiGuide);
aiRouter.post("/track", trackAiSuggestionAction);