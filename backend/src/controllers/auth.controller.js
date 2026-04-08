import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { AppError } from "../utils/errors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions
} from "../utils/tokens.js";

function userDto(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    points: user.points ?? 0
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, password } = req.body;
  const email = req.body.email.trim().toLowerCase();

  const exists = await User.findOne({ email });
  if (exists) throw new AppError("Email already in use", 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });

  // Issue tokens
  const accessToken = signAccessToken({ sub: user._id.toString(), email, role: user.role });
  const refreshToken = signRefreshToken({ sub: user._id.toString() });

  // Store refresh hash (so we can revoke)
  const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
  await User.updateOne({ _id: user._id }, { refreshTokenHash });

  res.cookie("refreshToken", refreshToken, refreshCookieOptions());
  res.status(201).json({ user: userDto(user), accessToken });
});

export const login = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const email = req.body.email.trim().toLowerCase();

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) throw new AppError("Invalid credentials", 401);

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError("Invalid credentials", 401);

  const accessToken = signAccessToken({ sub: user._id.toString(), email, role: user.role });
  const refreshToken = signRefreshToken({ sub: user._id.toString() });

  const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
  await User.updateOne({ _id: user._id }, { refreshTokenHash });

  res.cookie("refreshToken", refreshToken, refreshCookieOptions());
  res.json({ user: userDto(user), accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await User.updateOne({ _id: payload.sub }, { refreshTokenHash: null });
    } catch {
      // ignore invalid token
    }
  }
  res.clearCookie("refreshToken", refreshCookieOptions());
  res.status(204).send();
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new AppError("Missing refresh token", 401);

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError("Invalid/expired refresh token", 401);
  }

  const user = await User.findById(payload.sub).select("+refreshTokenHash");
  if (!user || !user.refreshTokenHash) throw new AppError("Unauthorized", 401);

  const matches = await bcrypt.compare(token, user.refreshTokenHash);
  if (!matches) throw new AppError("Refresh token revoked", 401);

  // rotate refresh token
  const newRefresh = signRefreshToken({ sub: user._id.toString() });
  const newRefreshHash = await bcrypt.hash(newRefresh, 12);
  await User.updateOne({ _id: user._id }, { refreshTokenHash: newRefreshHash });

  const accessToken = signAccessToken({ sub: user._id.toString(), email: user.email, role: user.role });

  res.cookie("refreshToken", newRefresh, refreshCookieOptions());
  res.json({ accessToken });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) throw new AppError("User not found", 404);
  res.json({ user: userDto(user) });
});