import dotenv from "dotenv";
dotenv.config();

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
  refreshExpires: process.env.REFRESH_TOKEN_EXPIRES || "7d"
};

export const isProd = env.nodeEnv === "production";