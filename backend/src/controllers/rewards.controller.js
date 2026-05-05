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
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);
}

export const claimDailyBonus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) throw new AppError("User not found", 404);

  const todayKey = getLocalDayKey();
  const lastClaimKey = user.lastLoginBonusAt ? getLocalDayKey(user.lastLoginBonusAt) : null;

  if (!lastClaimKey || lastClaimKey !== todayKey) {
    user.points = (user.points ?? 0) + DAILY_BONUS_COINS;
    user.lastLoginBonusAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      coinsAwarded: DAILY_BONUS_COINS,
      newBalance: user.points,
      alreadyClaimedToday: false
    });
  }

  return res.status(200).json({
    success: false,
    alreadyClaimedToday: true,
    nextClaimAt: getNextMidnight()
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
      isPremium: false
    });
  }

  const todayKey = getLocalDayKey();
  const lastClaimKey = user.lastLoginBonusAt ? getLocalDayKey(user.lastLoginBonusAt) : null;
  const alreadyClaimedToday = lastClaimKey === todayKey;

  res.status(200).json({
    canClaim: !alreadyClaimedToday,
    alreadyClaimedToday,
    isPremium: true
  });
});
