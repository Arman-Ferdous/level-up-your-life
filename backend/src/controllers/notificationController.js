import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { Notification } from "../models/Notification.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { unreadOnly = false } = req.query;

  const query = { userId };
  if (unreadOnly === "true") {
    query.read = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const unreadCount = await Notification.countDocuments({
    userId,
    read: false
  });

  res.status(200).json({ notifications, unreadCount });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid notification id", 400);
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { read: true },
    { new: true }
  );

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  res.status(200).json({ notification });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.sub;

  await Notification.updateMany(
    { userId, read: false },
    { read: true }
  );

  const unreadCount = 0;
  res.status(200).json({ message: "All notifications marked as read", unreadCount });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid notification id", 400);
  }

  const notification = await Notification.findOneAndDelete({
    _id: id,
    userId
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  res.status(200).json({ message: "Notification deleted" });
});

export const deleteAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.sub;

  await Notification.deleteMany({ userId });

  res.status(200).json({ message: "All notifications deleted" });
});

const getDayBounds = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const createNotificationIfNotExists = async ({
  userId,
  taskId,
  type,
  title,
  message,
  taskTitle,
  createdAtGte,
  createdAtLte
}) => {
  try {
    const query = { userId, taskId, type };

    if (createdAtGte || createdAtLte) {
      query.createdAt = {};
      if (createdAtGte) query.createdAt.$gte = createdAtGte;
      if (createdAtLte) query.createdAt.$lte = createdAtLte;
    }

    const existing = await Notification.findOne(query).lean();
    if (existing) return existing;

    return await Notification.create({
      userId,
      taskId,
      type,
      title,
      message,
      taskTitle: taskTitle || ""
    });
  } catch (error) {
    console.error("Error creating deduplicated notification:", error);
    return null;
  }
};

export const createNotificationOncePerDay = async ({
  userId,
  taskId,
  type,
  title,
  message,
  taskTitle,
  date = new Date()
}) => {
  const { start, end } = getDayBounds(date);

  return createNotificationIfNotExists({
    userId,
    taskId,
    type,
    title,
    message,
    taskTitle,
    createdAtGte: start,
    createdAtLte: end
  });
};

// Helper function to create a notification (used by other controllers)
export const createNotification = async (userId, taskId, type, title, message, taskTitle) => {
  try {
    const notification = await Notification.create({
      userId,
      taskId,
      type,
      title,
      message,
      taskTitle: taskTitle || ""
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};
