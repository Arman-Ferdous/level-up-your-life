import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";

const SUBSCRIPTION_AMOUNT = 499;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isValidCard(cardNumber) {
  return /^\d{16}$/.test(cardNumber);
}

function isValidCvv(cvv) {
  return /^\d{3}$/.test(cvv);
}

export const paySubscription = asyncHandler(async (req, res) => {
  const cardNumberRaw = String(req.body?.cardNumber || "");
  const cvvRaw = String(req.body?.cvv || "");
  const cardNumber = cardNumberRaw.replace(/\s+/g, "");
  const cvv = cvvRaw.trim();

  if (!isValidCard(cardNumber) || !isValidCvv(cvv)) {
    return res.status(400).json({ error: "Invalid card details" });
  }

  const user = await User.findById(req.user.sub);
  if (!user) throw new AppError("User not found", 404);

  const cardLast4 = cardNumber.slice(-4);

  await Payment.create({
    userId: user._id,
    userName: user.name,
    amount: SUBSCRIPTION_AMOUNT,
    cardLast4,
    status: "success"
  });

  const premiumExpiresAt = new Date(Date.now() + THIRTY_DAYS_MS);
  user.isPremium = true;
  user.premiumExpiresAt = premiumExpiresAt;
  await user.save();

  await User.updateOne({ role: "admin" }, { $inc: { adminBalance: SUBSCRIPTION_AMOUNT } });

  return res.status(200).json({
    success: true,
    message: "Payment successful! Premium activated.",
    premiumExpiresAt,
    amount: SUBSCRIPTION_AMOUNT
  });
});

export const getAdminRevenue = asyncHandler(async (req, res) => {
  const adminUser = await User.findById(req.user.sub).select({ adminBalance: 1 });
  if (!adminUser) throw new AppError("Admin not found", 404);

  const [totalPayments, recentPayments] = await Promise.all([
    Payment.countDocuments({ status: "success" }),
    Payment.find({ status: "success" })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("userId", "name")
      .lean()
  ]);

  res.status(200).json({
    totalBalance: adminUser.adminBalance ?? 0,
    totalPayments,
    recentPayments
  });
});
