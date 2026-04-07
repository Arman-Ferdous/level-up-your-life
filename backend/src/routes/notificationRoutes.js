import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} from "../controllers/notificationController.js";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get("/", getNotifications);
notificationRouter.put("/read-all", markAllAsRead);
notificationRouter.put("/:id/read", markAsRead);
notificationRouter.delete("/:id", deleteNotification);
notificationRouter.delete("/", deleteAllNotifications);
