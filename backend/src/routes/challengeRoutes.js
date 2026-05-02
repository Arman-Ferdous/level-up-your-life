import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createChallengeSchema,
  createMonthlyChallengeSchema
} from "../validators/challenge.validators.js";
import {
  createChallenge,
  getChallenges,
  completeChallenge,
  failChallenge,
  createMonthlyChallenge,
  deleteMonthlyChallenge,
  getMonthlyChallenges,
  registerMonthlyChallenge,
  completeMonthlyChallenge,
  getMonthlyChallengeLeaderboard
} from "../controllers/challengeController.js";

export const challengeRouter = Router();

challengeRouter.use(requireAuth);

challengeRouter.get("/monthly", getMonthlyChallenges);
challengeRouter.get("/monthly/:id/leaderboard", getMonthlyChallengeLeaderboard);
challengeRouter.post("/monthly/:id/register", registerMonthlyChallenge);
challengeRouter.post("/monthly/:id/complete", completeMonthlyChallenge);
challengeRouter.post(
  "/monthly",
  requireRole("admin"),
  validate(createMonthlyChallengeSchema),
  createMonthlyChallenge
);
challengeRouter.delete("/monthly/:id", requireRole("admin"), deleteMonthlyChallenge);

challengeRouter.post("/", validate(createChallengeSchema), createChallenge);
challengeRouter.get("/", getChallenges);
challengeRouter.post("/:id/complete", completeChallenge);
challengeRouter.post("/:id/fail", failChallenge);
