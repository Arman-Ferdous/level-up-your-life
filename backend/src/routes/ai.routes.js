import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getAiGuide, trackAiSuggestionAction, chatWithAi, getAiUsage } from "../controllers/aiGuideController.js";
import { validate } from "../middlewares/validate.middleware.js";
import { chatSchema } from "../validators/ai.validators.js";

export const aiRouter = Router();

aiRouter.use(requireAuth);
aiRouter.get("/usage", getAiUsage);
aiRouter.post("/guide", getAiGuide);
aiRouter.post("/track", trackAiSuggestionAction);
aiRouter.post("/chat", validate(chatSchema), chatWithAi);