import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { Avatar } from "../models/Avatar.js";
import { User } from "../models/User.js";

export const getAllAvatars = asyncHandler(async (_req, res) => {
  const avatars = await Avatar.find({}).sort({ cost: 1, createdAt: -1 }).lean();
  res.status(200).json({ avatars });
});

export const getUserAvatars = asyncHandler(async (req, res) => {
  const userId = req.user.sub;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await User.findById(userId)
    .populate("ownedAvatars", "key name emoji cost category rarity description")
    .populate("selectedAvatar", "key name emoji cost category rarity description")
    .lean();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({
    ownedAvatars: user.ownedAvatars || [],
    selectedAvatar: user.selectedAvatar || null
  });
});

export const buyAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { avatarId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(avatarId)) {
    throw new AppError("Invalid avatar id", 400);
  }

  const avatar = await Avatar.findById(avatarId);
  if (!avatar) {
    throw new AppError("Avatar not found", 404);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const alreadyOwned = user.ownedAvatars.some(
    (id) => id.toString() === avatarId
  );
  if (alreadyOwned) {
    throw new AppError("You already own this avatar", 400);
  }

  if (user.points < avatar.cost) {
    throw new AppError(
      `Insufficient points. You need ${avatar.cost} points but have ${user.points}`,
      400
    );
  }

  user.points -= avatar.cost;
  user.ownedAvatars.push(avatarId);

  if (!user.selectedAvatar) {
    user.selectedAvatar = avatarId;
  }

  await user.save();

  const updatedUser = await User.findById(userId)
    .populate("ownedAvatars", "key name emoji cost category rarity description")
    .populate("selectedAvatar", "key name emoji cost category rarity description")
    .lean();

  res.status(200).json({
    avatar,
    ownedAvatars: updatedUser.ownedAvatars || [],
    selectedAvatar: updatedUser.selectedAvatar || null,
    points: updatedUser.points,
    message: `Successfully purchased ${avatar.name}!`
  });
});

export const equipAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { avatarId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(avatarId)) {
    throw new AppError("Invalid avatar id", 400);
  }

  const avatar = await Avatar.findById(avatarId);
  if (!avatar) {
    throw new AppError("Avatar not found", 404);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const owns = user.ownedAvatars.some((id) => id.toString() === avatarId);
  if (!owns) {
    throw new AppError("You do not own this avatar", 400);
  }

  user.selectedAvatar = avatarId;
  await user.save();

  const updatedUser = await User.findById(userId)
    .populate("selectedAvatar", "key name emoji cost category rarity description")
    .lean();

  res.status(200).json({
    selectedAvatar: updatedUser.selectedAvatar,
    message: `Successfully equipped ${avatar.name}!`
  });
});
