import { MoodEntry } from "../models/MoodEntry.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";

function getTodayString() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// Parse YYYY-MM-DD string to local Date object
function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// POST /api/mood
// Save or update today's mood for the logged-in user
export const saveMood = asyncHandler(async (req, res) => {
  const { emoji, note, date: clientDate, timestamp } = req.body;
  const userId = req.user.sub;

  if (!emoji) throw new AppError("emoji is required", 400);

  // Use client-provided date (respects user's timezone) or fallback to server date
  let date = clientDate;
  if (!date) {
    date = getTodayString();
  }

  // Check if entry already exists
  const existingEntry = await MoodEntry.findOne({ userId, date });
  
  // Only set createdAt/updatedAt for new entries
  const updateData = { $set: { emoji, note: note ?? "", date } };
  if (timestamp && !existingEntry) {
    // Only set timestamps for NEW entries, not updates
    updateData.$set.createdAt = new Date(timestamp);
    updateData.$set.updatedAt = new Date(timestamp);
  }

  const entry = await MoodEntry.findOneAndUpdate(
    { userId, date },
    updateData,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(200).json({ entry });
});

// GET /api/mood/today
// Return today's mood for the logged-in user
export const getTodayMood = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  // Accept date from query params to respect client timezone
  const date = req.query.date || getTodayString();

  const entry = await MoodEntry.findOne({ userId, date });

  res.status(200).json({ entry: entry ?? null });
});

// GET /api/mood/history
// Return last 7 days of moods for the logged-in user
export const getMoodHistory = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  
  // Query by timestamps for the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const entries = await MoodEntry.find({
    userId,
    createdAt: { $gte: sevenDaysAgo },
  }).sort({ createdAt: -1 });

  res.status(200).json({ entries });
});
