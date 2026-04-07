import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { Group } from "../models/Group.js";
import { Types } from "mongoose";

const JOIN_CODE_LENGTH = 6;
const JOIN_CODE_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

function generateRandomJoinCode() {
  let code = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i += 1) {
    const index = Math.floor(Math.random() * JOIN_CODE_CHARS.length);
    code += JOIN_CODE_CHARS[index];
  }
  return code;
}

async function generateUniqueJoinCode(maxAttempts = 25) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = generateRandomJoinCode();
    const exists = await Group.exists({ joinCode: code });
    if (!exists) return code;
  }

  throw new AppError("Could not generate a unique join code. Try again.", 500);
}

export const createGroup = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { name, description = "", isPublic = false } = req.body;

  const joinCode = await generateUniqueJoinCode();

  const group = await Group.create({
    name: String(name).trim(),
    description: typeof description === "string" ? description.trim() : "",
    joinCode,
    isPublic: Boolean(isPublic),
    members: [
      {
        userId,
        role: "Guild Master"
      }
    ],
    createdAt: new Date()
  });

  res.status(201).json({ success: true, group });
});

export const joinGroup = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const joinCode = String(req.body.joinCode || "").trim().toLowerCase();

  if (joinCode.length !== JOIN_CODE_LENGTH) {
    throw new AppError("Join code must be 6 characters", 400);
  }

  const group = await Group.findOne({ joinCode });

  if (!group) {
    throw new AppError("Group not found", 404);
  }

  const alreadyMember = group.members.some((member) => String(member.userId) === String(userId));

  if (!alreadyMember) {
    group.members.push({
      userId,
      role: "Novice"
    });

    await group.save();
  }

  res.status(200).json({
    success: true,
    message: alreadyMember ? "You are already in this group." : "Joined group successfully",
    group
  });
});

export const getMyGroups = asyncHandler(async (req, res) => {
  const userId = req.user.sub;

  const groups = await Group.find({ "members.userId": userId })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ groups });
});

export const discoverGroups = asyncHandler(async (req, res) => {
  const userId = req.user.sub;

  const groups = await Group.find({
    isPublic: true,
    members: { $not: { $elemMatch: { userId: new Types.ObjectId(userId) } } }
  })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ groups });
});
