import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { Group } from "../models/Group.js";

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
  const creatorId = req.user.sub;
  const { name } = req.body;

  const joinCode = await generateUniqueJoinCode();

  const group = await Group.create({
    name,
    creatorId,
    joinCode,
    members: [creatorId],
    createdAt: new Date()
  });

  res.status(201).json({ group });
});

export const joinGroup = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const joinCode = req.body.joinCode.trim().toLowerCase();

  const group = await Group.findOneAndUpdate(
    { joinCode },
    { $addToSet: { members: userId } },
    { new: true }
  );

  if (!group) {
    throw new AppError("Group not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Joined group successfully",
    group
  });
});

export const getMyGroups = asyncHandler(async (req, res) => {
  const userId = req.user.sub;

  const groups = await Group.find({ members: userId })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ groups });
});
