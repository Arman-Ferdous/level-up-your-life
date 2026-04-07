import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
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
    betAmount: {
      type: Number,
      required: true,
      min: 1
    },
    dueDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["active", "won", "lost"],
      default: "active"
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

challengeSchema.index({ userId: 1, createdAt: -1 });

export const Challenge = mongoose.model("Challenge", challengeSchema);
