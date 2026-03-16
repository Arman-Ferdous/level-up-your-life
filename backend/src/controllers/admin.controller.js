import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { User } from "../models/User.js";
import { MoodEntry } from "../models/MoodEntry.js";
import { Transaction } from "../models/Transaction.js";

export const getAllUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({}, { name: 1, email: 1, role: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ users });
});

export const deleteUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await User.findById(id).lean();
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (req.user.sub === id) {
    throw new AppError("Admin cannot delete own account", 400);
  }

  await Promise.all([
    User.deleteOne({ _id: id }),
    MoodEntry.deleteMany({ userId: id }),
    Transaction.deleteMany({ userId: id })
  ]);

  res.status(200).json({ success: true, deletedUserId: id });
});
