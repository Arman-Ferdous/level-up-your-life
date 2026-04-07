import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createChallengeSchema } from "../validators/challenge.validators.js";
import {
  createChallenge,
  getChallenges,
  completeChallenge,
  failChallenge
} from "../controllers/challengeController.js";

export const challengeRouter = Router();

challengeRouter.use(requireAuth);
challengeRouter.post("/", validate(createChallengeSchema), createChallenge);
challengeRouter.get("/", getChallenges);
challengeRouter.post("/:id/complete", completeChallenge);
challengeRouter.post("/:id/fail", failChallenge);
