import express from "express";
import { getPublicLeaderboard, getTopByPoints } from "../controllers/leaderboardController.js";
 
const router = express.Router();
 
// Public routes - no auth required (it's a public leaderboard)
router.get("/", getPublicLeaderboard);
router.get("/top", getTopByPoints);
 
export default router;