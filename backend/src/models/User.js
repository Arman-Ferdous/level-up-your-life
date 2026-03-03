import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true, minlength: 2, maxlength: 50 },
    email: { type: String, trim: true, lowercase: true, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    refreshTokenHash: { type: String, select: false, default: null }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);