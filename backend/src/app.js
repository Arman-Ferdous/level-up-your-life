import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { moodRouter } from "./routes/moodRoutes.js";
import { transactionRouter } from "./routes/transactionRoutes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { challengeRouter } from "./routes/challengeRoutes.js";
import { taskRouter } from "./routes/taskRoutes.js";
import { aiRouter } from "./routes/ai.routes.js";
import { notificationRouter } from "./routes/notificationRoutes.js";
import { groupRouter } from "./routes/group.routes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import { avatarRouter } from "./routes/avatarRoutes.js";
import { rewardsRouter } from "./routes/rewards.routes.js";
import { subscriptionRouter } from "./routes/subscription.routes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        // In development, allow any localhost
        if (env.nodeEnv === "development" && origin?.includes("localhost")) {
          callback(null, true);
        } else if (origin === env.clientOrigin) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    }),
  );

  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 120,
    }),
  );

  app.get("/", (_req, res) =>
    res.json({ success: true, message: "Backend is running" }),
  );
  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/mood", moodRouter);
  app.use("/api/transactions", transactionRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/tasks", taskRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/challenges", challengeRouter);
  app.use("/api/notifications", notificationRouter);
  app.use("/api/groups", groupRouter);
  app.use("/api/leaderboard", leaderboardRoutes);
  app.use("/api/notifications", notificationRouter);
  app.use("/api/avatars", avatarRouter);
  app.use("/api/rewards", rewardsRouter);
  app.use("/api/subscription", subscriptionRouter);
  app.use("/api/leaderboard", leaderboardRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
