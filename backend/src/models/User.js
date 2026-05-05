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
    },
    adminBalance: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },
    premiumExpiresAt: { type: Date, default: null },
    lastLoginBonusAt: { type: Date, default: null },
    aiMessagesUsedToday: { type: Number, default: 0 },
    aiMessagesResetAt: { type: Date, default: null }
  },
  { timestamps: true }
);

userSchema.methods.isPremiumActive = async function () {
  if (!this.isPremium) return false;

  const expiresAt = this.premiumExpiresAt?.getTime() ?? 0;
  if (expiresAt > Date.now()) return true;

  this.isPremium = false;
  await this.save();
  return false;
};

export const User = mongoose.model("User", userSchema);