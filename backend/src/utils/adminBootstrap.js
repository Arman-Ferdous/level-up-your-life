import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

export async function ensureAdminAccount() {
  if (!env.adminEmail || !env.adminPassword || !env.adminName) return;

  const email = env.adminEmail.toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role !== "admin") {
      await User.updateOne({ _id: existing._id }, { role: "admin" });
      console.log(`Promoted existing user to admin: ${email}`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(env.adminPassword, 12);
  await User.create({
    name: env.adminName,
    email,
    role: "admin",
    passwordHash
  });

  console.log(`Seeded admin account: ${email}`);
}
