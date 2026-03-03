import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";

export function notFound(_req, _res, next) {
  next(new AppError("Route not found", 404));
}

export function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || 500;
  const message = err.message || "Server error";

  if (env.nodeEnv !== "production") console.error(err);

  res.status(status).json({
    message,
    ...(env.nodeEnv !== "production" && { stack: err.stack })
  });
}