import { AppError } from "../utils/errors.js";
import { verifyAccessToken } from "../utils/tokens.js";

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) return next(new AppError("Unauthorized", 401));

  try {
    req.user = verifyAccessToken(token); // { sub, email }
    next();
  } catch {
    next(new AppError("Invalid/expired token", 401));
  }
}