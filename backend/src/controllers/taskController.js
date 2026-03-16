import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { Task } from "../models/Task.js";

export const createTask = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { title, description, type, dueDate, priority, reminderWeekdays } = req.body;

  const task = await Task.create({
    userId,
    title,
    description: description || "",
    type,
    dueDate: type === "deadline" && dueDate ? new Date(dueDate) : null,
    reminderWeekdays: type === "habit" ? reminderWeekdays ?? [] : [],
    priority: priority || "medium",
    completed: false
  });

  res.status(201).json({ task });
});

export const getTasks = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { type } = req.query;

  const query = { userId };
  if (type && ["habit", "deadline", "once"].includes(type)) {
    query.type = type;
  }

  const tasks = await Task.find(query)
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ tasks });
});

export const updateTask = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const { title, description, type, dueDate, completed, priority, reminderWeekdays } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid task id", 400);
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (type !== undefined) updateData.type = type;
  if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
  if (reminderWeekdays !== undefined) updateData.reminderWeekdays = reminderWeekdays;
  if (priority !== undefined) updateData.priority = priority;
  if (completed !== undefined) {
    updateData.completed = completed;
    updateData.completedOn = completed ? new Date() : null;
  }

  if (type === "habit") {
    updateData.dueDate = null;
  }
  if (type === "deadline" || type === "once") {
    updateData.reminderWeekdays = [];
  }

  const task = await Task.findOneAndUpdate(
    { _id: id, userId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  res.status(200).json({ task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid task id", 400);
  }

  const deleted = await Task.findOneAndDelete({ _id: id, userId });
  if (!deleted) {
    throw new AppError("Task not found", 404);
  }

  res.status(200).json({ success: true });
});
