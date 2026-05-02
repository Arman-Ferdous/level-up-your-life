import mongoose from "mongoose";

const avatarSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    cost: {
      type: Number,
      required: true,
      min: 0
    },
    emoji: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ["fruit", "flower", "doll", "car"],
      required: true
    },
    rarity: {
      type: String,
      enum: ["common", "rare", "epic", "legendary"],
      default: "common"
    }
  },
  { timestamps: true }
);

export const Avatar = mongoose.model("Avatar", avatarSchema);
