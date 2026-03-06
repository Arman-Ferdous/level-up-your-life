import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { moodRouter } from "./routes/moodRoutes.js";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true
    })
  );

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 120
    })
  );

  app.get("/", (_req, res) => res.json({ success: true, message: "Backend is running" }));
  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/mood", moodRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}