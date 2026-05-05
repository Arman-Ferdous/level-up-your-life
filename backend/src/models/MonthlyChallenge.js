import mongoose from "mongoose";

const monthlyParticipantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const monthlyChallengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true,
      min: 2024
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    participants: {
      type: [monthlyParticipantSchema],
      default: []
    }
  },
  { timestamps: true }
);

monthlyChallengeSchema.index({ year: -1, month: -1 });
monthlyChallengeSchema.index({ month: 1, year: 1 }, { unique: true });
monthlyChallengeSchema.index({ "participants.userId": 1 });

export const MonthlyChallenge = mongoose.model("MonthlyChallenge", monthlyChallengeSchema);