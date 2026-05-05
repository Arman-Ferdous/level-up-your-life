import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { Challenge } from "../models/Challenge.js";
import { MonthlyChallenge } from "../models/MonthlyChallenge.js";
import { User } from "../models/User.js";

function sortLeaderboardEntries(a, b) {
  if (a.completed !== b.completed) {
    return Number(b.completed) - Number(a.completed);
  }

  if (a.completed && b.completed) {
    return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
  }

  return new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
}

function buildLeaderboard(challenge, userId = null) {
  const rows = (challenge.participants || [])
    .map((participant) => ({
      userId: participant.userId?._id?.toString() || participant.userId?.toString(),
      name: participant.userId?.name || "Unknown user",
      email: participant.userId?.email || "",
      completed: Boolean(participant.completed),
      registeredAt: participant.registeredAt,
      completedAt: participant.completedAt
    }))
    .sort(sortLeaderboardEntries)
    .map((entry, index) => ({
      rank: index + 1,
      ...entry
    }));

  const winner = rows.find((entry) => entry.completed) || null;
  const currentUserEntry = userId ? rows.find((entry) => entry.userId === userId) || null : null;

  return {
    leaderboard: rows,
    winner,
    currentUserEntry,
    participantCount: rows.length,
    completedCount: rows.filter((entry) => entry.completed).length
  };
}

function toMonthlyChallengeDto(challenge, userId = null) {
  const { leaderboard, winner, currentUserEntry, participantCount, completedCount } = buildLeaderboard(
    challenge,
    userId
  );

  return {
    _id: challenge._id,
    title: challenge.title,
    description: challenge.description,
    month: challenge.month,
    year: challenge.year,
    startDate: challenge.startDate,
    endDate: challenge.endDate,
    createdAt: challenge.createdAt,
    updatedAt: challenge.updatedAt,
    participantCount,
    completedCount,
    winner,
    currentUserEntry,
    leaderboard
  };
}

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

export const createMonthlyChallenge = asyncHandler(async (req, res) => {
  const { title, description, month, year, startDate, endDate } = req.body;

  const challenge = await MonthlyChallenge.create({
    title,
    description: description || "",
    month,
    year,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    createdBy: req.user.sub
  });

  const populated = await MonthlyChallenge.findById(challenge._id)
    .populate("participants.userId", "name email")
    .lean();

  res.status(201).json({
    monthlyChallenge: toMonthlyChallengeDto(populated, req.user.sub)
  });
});

export const deleteMonthlyChallenge = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid challenge id", 400);
  }

  const existing = await MonthlyChallenge.findById(id).lean();
  if (!existing) {
    throw new AppError("Monthly challenge not found", 404);
  }

  await MonthlyChallenge.deleteOne({ _id: id });
  res.status(200).json({ success: true, deletedChallengeId: id });
});

export const getMonthlyChallenges = asyncHandler(async (req, res) => {
  const userId = req.user.sub;

  const challenges = await MonthlyChallenge.find({})
    .sort({ year: -1, month: -1, createdAt: -1 })
    .populate("participants.userId", "name email")
    .lean();

  res.status(200).json({
    monthlyChallenges: challenges.map((challenge) => toMonthlyChallengeDto(challenge, userId))
  });
});

export const registerMonthlyChallenge = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.sub;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid challenge id", 400);
  }

  const challenge = await MonthlyChallenge.findById(id);
  if (!challenge) {
    throw new AppError("Monthly challenge not found", 404);
  }

  const alreadyRegistered = challenge.participants.some(
    (participant) => participant.userId.toString() === userId
  );

  if (alreadyRegistered) {
    throw new AppError("You are already registered for this monthly challenge", 400);
  }

  challenge.participants.push({
    userId,
    registeredAt: new Date(),
    completed: false,
    completedAt: null
  });

  await challenge.save();

  const populated = await MonthlyChallenge.findById(challenge._id)
    .populate("participants.userId", "name email")
    .lean();

  res.status(200).json({
    monthlyChallenge: toMonthlyChallengeDto(populated, userId)
  });
});

export const completeMonthlyChallenge = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.sub;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid challenge id", 400);
  }

  const challenge = await MonthlyChallenge.findById(id);
  if (!challenge) {
    throw new AppError("Monthly challenge not found", 404);
  }

  const participant = challenge.participants.find(
    (entry) => entry.userId.toString() === userId
  );

  if (!participant) {
    throw new AppError("You must register before marking this challenge complete", 400);
  }

  if (participant.completed) {
    throw new AppError("Challenge already marked as completed", 400);
  }

  participant.completed = true;
  participant.completedAt = new Date();

  await challenge.save();

  const populatedChallenge = await MonthlyChallenge.findById(challenge._id)
    .populate("participants.userId", "name email")
    .lean();

  const { leaderboard, winner, currentUserEntry, participantCount, completedCount } = buildLeaderboard(
    populatedChallenge,
    userId
  );

  const isWinner = currentUserEntry?.rank === 1 && currentUserEntry?.completed;
  const awardedPoints = isWinner ? 50 : 15;
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $inc: { points: awardedPoints } },
    { new: true }
  ).lean();

  res.status(200).json({
    monthlyChallenge: {
      _id: populatedChallenge._id,
      title: populatedChallenge.title,
      description: populatedChallenge.description,
      month: populatedChallenge.month,
      year: populatedChallenge.year,
      startDate: populatedChallenge.startDate,
      endDate: populatedChallenge.endDate,
      createdAt: populatedChallenge.createdAt,
      updatedAt: populatedChallenge.updatedAt,
      participantCount,
      completedCount,
      winner,
      currentUserEntry,
      leaderboard
    },
    awardedPoints,
    updatedUser
  });
});

export const getMonthlyChallengeLeaderboard = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid challenge id", 400);
  }

  const challenge = await MonthlyChallenge.findById(id)
    .populate("participants.userId", "name email")
    .lean();

  if (!challenge) {
    throw new AppError("Monthly challenge not found", 404);
  }

  const { leaderboard, winner, participantCount, completedCount } = buildLeaderboard(
    challenge,
    req.user.sub
  );

  res.status(200).json({
    challenge: {
      _id: challenge._id,
      title: challenge.title,
      month: challenge.month,
      year: challenge.year,
      startDate: challenge.startDate,
      endDate: challenge.endDate
    },
    leaderboard,
    winner,
    participantCount,
    completedCount
  });
});
