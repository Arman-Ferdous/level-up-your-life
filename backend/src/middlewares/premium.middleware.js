import { User } from "../models/User.js";
import { AppError } from "../utils/errors.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requirePremium = asyncHandler(async (req, res, next) => {
  if (!req.user) throw new AppError("Unauthorized", 401);

  const user = req.user.isPremiumActive
    ? req.user
    : await User.findById(req.user.sub);

  if (!user) throw new AppError("Unauthorized", 401);

  const isActive = await user.isPremiumActive();
  if (!isActive) {
    return res.status(403).json({ error: "This feature requires a Premium subscription" });
  }

  next();
});
