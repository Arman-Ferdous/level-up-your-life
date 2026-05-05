import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { User } from "../models/User.js";

const DAILY_BONUS_COINS = 50;

function getLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNextMidnight(date = new Date()) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
    0,
    0,
    0,
    0,
  );
}

export const claimDailyBonus = asyncHandler(async (req, res) => {
  // Atomic check-and-update: only updates if lastLoginBonusAt is before today.
  // This prevents double-claim race conditions from concurrent requests.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const updated = await User.findOneAndUpdate(
    {
      _id: req.user.sub,
      $or: [
        { lastLoginBonusAt: null },
        { lastLoginBonusAt: { $lt: startOfToday } },
      ],
    },
    {
      $inc: { points: DAILY_BONUS_COINS },
      $set: { lastLoginBonusAt: new Date() },
    },
    { new: true },
  );

  if (!updated) {
    // Either user not found OR already claimed today
    const user = await User.findById(req.user.sub).select(
      "points lastLoginBonusAt",
    );
    if (!user) throw new AppError("User not found", 404);
    return res.status(200).json({
      success: false,
      alreadyClaimedToday: true,
      nextClaimAt: getNextMidnight(),
    });
  }

  return res.status(200).json({
    success: true,
    coinsAwarded: DAILY_BONUS_COINS,
    newBalance: updated.points,
    alreadyClaimedToday: false,
  });
});

export const getDailyBonusStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) throw new AppError("User not found", 404);

  const isPremium = await user.isPremiumActive();
  if (!isPremium) {
    return res.status(200).json({
      canClaim: false,
      alreadyClaimedToday: false,
      isPremium: false,
    });
  }

  const todayKey = getLocalDayKey();
  const lastClaimKey = user.lastLoginBonusAt
    ? getLocalDayKey(user.lastLoginBonusAt)
    : null;
  const alreadyClaimedToday = lastClaimKey === todayKey;

  res.status(200).json({
    canClaim: !alreadyClaimedToday,
    alreadyClaimedToday,
    isPremium: true,
  });
});
