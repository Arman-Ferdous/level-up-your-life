import mongoose from "mongoose";
import dns from "node:dns";
import { env } from "./env.js";

dns.setServers(['1.1.1.1', '8.8.8.8']);

export async function connectDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  console.log("✅ MongoDB connected");
}