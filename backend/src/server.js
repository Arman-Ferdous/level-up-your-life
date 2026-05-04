import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { ensureAdminAccount } from "./utils/adminBootstrap.js";
import { ensureDefaultAvatars } from "./utils/avatarBootstrap.js";
import { startTaskReminderWorker } from "./services/taskReminderWorker.js";
import { migrateLegacyGroupTasks } from "./utils/taskMigration.js";

async function main() {
  await connectDB();
  await ensureAdminAccount();
  await ensureDefaultAvatars();
  await migrateLegacyGroupTasks();
  startTaskReminderWorker();
  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`✅ API running on http://localhost:${env.port}`);
  });

  server.on("error", (error) => {
    if (error?.code === "EADDRINUSE") {
      console.error(`❌ Port ${env.port} is already in use. Stop the other backend process or change PORT in backend/.env.`);
    } else {
      console.error("❌ Server failed to start:", error);
    }
    process.exit(1);
  });
}

main().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});