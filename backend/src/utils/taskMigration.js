import { Group } from "../models/Group.js";
import { Task } from "../models/Task.js";

function asDateOrFallback(value, fallback) {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return fallback;
}

export async function migrateLegacyGroupTasks() {
  const groups = await Group.find({}).select({ _id: 1, members: 1 }).lean();
  const membersByGroupId = new Map(
    groups.map((group) => [
      String(group._id),
      (group.members || []).map((member) => String(member.userId))
    ])
  );

  const legacyTasks = await Task.find({
    groupId: { $ne: null },
    $or: [
      { type: "deadline" },
      { type: "once" },
      { groupCompletionUsers: { $exists: false } },
      { habitCompletionHistory: { $exists: false } }
    ]
  })
    .select({
      _id: 1,
      groupId: 1,
      userId: 1,
      type: 1,
      completed: 1,
      completedOn: 1,
      dueDate: 1,
      createdAt: 1,
      groupCompletionUsers: 1,
      habitCompletionHistory: 1
    })
    .lean();

  let migratedCount = 0;

  for (const task of legacyTasks) {
    const groupId = String(task.groupId);
    const memberUserIds = membersByGroupId.get(groupId) || [];
    const nextType = task.type === "deadline" ? "once" : task.type;
    const update = {};

    if (task.type === "deadline") {
      update.type = "once";
    }

    if (nextType === "once" && !task.dueDate) {
      update.dueDate = asDateOrFallback(task.createdAt, new Date());
    }

    if (!Array.isArray(task.groupCompletionUsers)) {
      update.groupCompletionUsers = [];
    }

    if (!Array.isArray(task.habitCompletionHistory)) {
      update.habitCompletionHistory = [];
    }

    // Preserve already-finished legacy one-time tasks by marking all current members complete.
    if (nextType === "once" && task.completed) {
      const completionDate = asDateOrFallback(task.completedOn, asDateOrFallback(task.createdAt, new Date()));
      update.groupCompletionUsers = memberUserIds.map((memberId) => ({
        userId: memberId,
        completedOn: completionDate
      }));
      update.completedOn = completionDate;
      update.completed = true;
    }

    if (Object.keys(update).length === 0) {
      continue;
    }

    await Task.updateOne({ _id: task._id }, { $set: update });
    migratedCount += 1;
  }

  if (migratedCount > 0) {
    console.log(`Migrated ${migratedCount} legacy group task(s) to the new model.`);
  }
}
