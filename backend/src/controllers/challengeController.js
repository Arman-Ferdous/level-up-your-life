import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { Challenge } from "../models/Challenge.js";
import { User } from "../models/User.js";

export const createChallenge = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { title, description, betAmount, dueDate } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (betAmount > (user.points || 0)) {
    throw new AppError("Insufficient points available for this bet", 400);
  }

  const challenge = await Challenge.create({
    userId,
    title,
    description: description || "",
    betAmount,
    dueDate: new Date(dueDate)
  });

  await User.findByIdAndUpdate(userId, { $inc: { points: -betAmount } });

  res.status(201).json({ challenge });
});

export const getChallenges = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const challenges = await Challenge.find({ userId }).sort({ createdAt: -1 }).lean();
  res.status(200).json({ challenges });
});

export const completeChallenge = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid challenge id", 400);
  }

  const challenge = await Challenge.findOne({ _id: id, userId });
  if (!challenge) {
    throw new AppError("Challenge not found", 404);
  }

  if (challenge.status !== "active") {
    throw new AppError("Challenge has already been resolved", 400);
  }

  challenge.status = "won";
  challenge.resolvedAt = new Date();
  await challenge.save();

  const reward = challenge.betAmount * 2;
  await User.findByIdAndUpdate(userId, { $inc: { points: reward } });

  res.status(200).json({ challenge });
});

export const failChallenge = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid challenge id", 400);
  }

  const challenge = await Challenge.findOne({ _id: id, userId });
  if (!challenge) {
    throw new AppError("Challenge not found", 404);
  }

  if (challenge.status !== "active") {
    throw new AppError("Challenge has already been resolved", 400);
  }

  challenge.status = "lost";
  challenge.resolvedAt = new Date();
  await challenge.save();

  await User.findByIdAndUpdate(userId, { points: 0 });

  res.status(200).json({ challenge });
});
