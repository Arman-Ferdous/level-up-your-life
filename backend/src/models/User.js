import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, minlength: 2, maxlength: 50 },
    email: { type: String, trim: true, lowercase: true, required: true, unique: true },
    role: { type: String, enum: ["user", "admin"], default: "user", required: true },
    passwordHash: { type: String, required: true, select: false },
    refreshTokenHash: { type: String, select: false, default: null },
    points: { type: Number, default: 100 },
    streak: { type: Number, default: 0 },
    ownedAvatars: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Avatar",
      default: []
    },
    selectedAvatar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Avatar",
      default: null
    }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);