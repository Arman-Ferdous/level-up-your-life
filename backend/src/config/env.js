import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";

// Resolve .env relative to backend/ root (two levels up from src/config/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function applyParsedEnv(parsed) {
  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function tryParseEnvText(text) {
  const normalized = text.replace(/^\uFEFF/, "");
  const parsed = dotenv.parse(normalized);
  return Object.keys(parsed).length > 0 ? parsed : null;
}

function loadEnvFromFile(filePath) {
  if (!fs.existsSync(filePath)) return false;

  const raw = fs.readFileSync(filePath);

  // Try UTF-8 first, then UTF-16LE for Windows-saved .env files.
  const utf8Parsed = tryParseEnvText(raw.toString("utf8"));
  if (utf8Parsed) {
    applyParsedEnv(utf8Parsed);
    return true;
  }

  const utf16Parsed = tryParseEnvText(raw.toString("utf16le"));
  if (utf16Parsed) {
    applyParsedEnv(utf16Parsed);
    return true;
  }

  return false;
}

const envCandidates = [
  path.resolve(__dirname, "../../.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "backend/.env")
];

for (const candidate of envCandidates) {
  if (loadEnvFromFile(candidate)) {
    break;
  }
}

// Safety fallbacks for local development when .env cannot be parsed/read.
const fallbackEnv = {
  MONGO_URI: "mongodb://127.0.0.1:27017/level-up-your-life",
  CLIENT_ORIGIN: "http://localhost:5173",
  JWT_ACCESS_SECRET: "dev_access_secret_change_me",
  JWT_REFRESH_SECRET: "dev_refresh_secret_change_me"
};

for (const [key, value] of Object.entries(fallbackEnv)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

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

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,

  accessExpires: process.env.ACCESS_TOKEN_EXPIRES || "15m",
  refreshExpires: process.env.REFRESH_TOKEN_EXPIRES || "7d",

  adminName: process.env.ADMIN_NAME || "",
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPassword: process.env.ADMIN_PASSWORD || ""
};

export const isProd = env.nodeEnv === "production";