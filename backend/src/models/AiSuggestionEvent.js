import mongoose from "mongoose";

const aiSuggestionEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    surface: {
      type: String,
      enum: ["home", "sidebar", "notifications"],
      required: true,
      index: true
    },
    eventType: {
      type: String,
      enum: ["impression", "click"],
      required: true,
      default: "click"
    },
    suggestionKey: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    suggestionLabel: {
      type: String,
      trim: true,
      default: ""
    },
    destination: {
      type: String,
      trim: true,
      default: ""
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

aiSuggestionEventSchema.index({ userId: 1, surface: 1, suggestionKey: 1, createdAt: -1 });

export const AiSuggestionEvent = mongoose.model("AiSuggestionEvent", aiSuggestionEventSchema);