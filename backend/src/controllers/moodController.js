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

function isValidDateString(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
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

  if (!isValidDateString(date)) {
    throw new AppError("date must be in YYYY-MM-DD format", 400);
  }

  const selectedDate = parseLocalDate(date);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const earliestAllowed = new Date(startOfToday);
  earliestAllowed.setDate(earliestAllowed.getDate() - 29);

  if (selectedDate > startOfToday) {
    throw new AppError("Mood can only be logged up to today", 400);
  }

  if (selectedDate < earliestAllowed) {
    throw new AppError("Mood can only be logged for the last 30 days", 400);
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

  if (req.query.days !== undefined) {
    const days = Number(req.query.days);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      throw new AppError("Invalid days filter", 400);
    }

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - (days - 1));
    const startDate = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, "0")}-${String(fromDate.getDate()).padStart(2, "0")}`;

    const entries = await MoodEntry.find({
      userId,
      date: { $gte: startDate }
    }).sort({ date: 1, createdAt: 1 });

    res.status(200).json({ entries, filter: { days } });
    return;
  }

  const hasMonthFilter = req.query.year !== undefined || req.query.month !== undefined;

  if (hasMonthFilter) {
    const now = new Date();
    const year = Number(req.query.year ?? now.getFullYear());
    const month = Number(req.query.month ?? now.getMonth() + 1);

    if (!Number.isInteger(year) || year < 1970 || year > 3000) {
      throw new AppError("Invalid year filter", 400);
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new AppError("Invalid month filter", 400);
    }

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const entries = await MoodEntry.find({
      userId,
      date: { $gte: startDate, $lt: endDate }
    }).sort({ date: 1, createdAt: 1 });

    res.status(200).json({ entries, filter: { year, month } });
    return;
  }

  // Query by timestamps for the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const entries = await MoodEntry.find({
    userId,
    createdAt: { $gte: sevenDaysAgo },
  }).sort({ createdAt: -1 });

  res.status(200).json({ entries });
});
