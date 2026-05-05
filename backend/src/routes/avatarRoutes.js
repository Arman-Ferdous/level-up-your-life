import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getAllAvatars,
  getUserAvatars,
  buyAvatar,
  equipAvatar
} from "../controllers/avatarController.js";

export const avatarRouter = Router();

avatarRouter.get("/shop", getAllAvatars);
avatarRouter.use(requireAuth);
avatarRouter.get("/my", getUserAvatars);
avatarRouter.post("/buy", buyAvatar);
avatarRouter.post("/equip", equipAvatar);
