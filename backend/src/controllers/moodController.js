import { MoodEntry } from "../models/MoodEntry.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";

function getTodayString() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// POST /api/mood
// Save or update today's mood for the logged-in user
export const saveMood = asyncHandler(async (req, res) => {
  const { emoji, note } = req.body;
  const userId = req.user.sub;

  if (!emoji) throw new AppError("emoji is required", 400);

  const date = getTodayString();

  const entry = await MoodEntry.findOneAndUpdate(
    { userId, date },
    { $set: { emoji, note: note ?? "" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({ entry });
});

// GET /api/mood/today
// Return today's mood for the logged-in user
export const getTodayMood = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const date = getTodayString();

  const entry = await MoodEntry.findOne({ userId, date });

  res.status(200).json({ entry: entry ?? null });
});

// GET /api/mood/history
// Return last 7 days of moods for the logged-in user
export const getMoodHistory = asyncHandler(async (req, res) => {
  const userId = req.user.sub;

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });

  const entries = await MoodEntry.find({
    userId,
    date: { $in: dates },
  }).sort({ date: -1 });

  res.status(200).json({ entries });
});
