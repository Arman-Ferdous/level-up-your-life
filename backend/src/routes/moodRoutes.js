import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { saveMood, getTodayMood, getMoodHistory } from "../controllers/moodController.js";

export const moodRouter = Router();

moodRouter.post("/", requireAuth, saveMood);
moodRouter.get("/today", requireAuth, getTodayMood);
moodRouter.get("/history", requireAuth, getMoodHistory);
