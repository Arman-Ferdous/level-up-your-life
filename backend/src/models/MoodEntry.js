import mongoose from "mongoose";

const moodEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emoji: {
      type: String,
      required: true,
    },
    date: {
      type: String,  // YYYY-MM-DD
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// One mood per user per day
moodEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

export const MoodEntry = mongoose.model("MoodEntry", moodEntrySchema);
