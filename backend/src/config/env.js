import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";

// Resolve .env relative to backend/ root (two levels up from src/config/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const required = [
  "MONGO_URI",
  "CLIENT_ORIGIN",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET"
];

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
}

export const env = {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI,
  clientOrigin: process.env.CLIENT_ORIGIN,
  remindersEnabled: process.env.REMINDERS_ENABLED !== "false",
  reminderIntervalMs: Number(process.env.REMINDER_INTERVAL_MS || 60000),

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,

  accessExpires: process.env.ACCESS_TOKEN_EXPIRES || "15m",
  refreshExpires: process.env.REFRESH_TOKEN_EXPIRES || "7d",

  adminName: process.env.ADMIN_NAME || "",
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPassword: process.env.ADMIN_PASSWORD || ""
};

export const isProd = env.nodeEnv === "production";