import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { ensureAdminAccount } from "./utils/adminBootstrap.js";
import { startTaskReminderWorker } from "./services/taskReminderWorker.js";
import { migrateLegacyGroupTasks } from "./utils/taskMigration.js";

async function main() {
  await connectDB();
  await ensureAdminAccount();
  await migrateLegacyGroupTasks();
  startTaskReminderWorker();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`✅ API running on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});