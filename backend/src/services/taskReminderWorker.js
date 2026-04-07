import { Task } from "../models/Task.js";
import { createNotificationOncePerDay } from "../controllers/notificationController.js";
import { env } from "../config/env.js";

const WEEKDAY_MAP = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const isSameCalendarDay = (a, b) => (
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()
);

export const runTaskReminderSweep = async (now = new Date()) => {
  const todayWeekday = WEEKDAY_MAP[now.getDay()];

  const [habitTasks, datedTasks] = await Promise.all([
    Task.find({
      type: "habit",
      completed: false,
      reminderWeekdays: todayWeekday
    }).lean(),
    Task.find({
      type: { $in: ["deadline", "once"] },
      completed: false,
      dueDate: { $ne: null }
    }).lean()
  ]);

  for (const task of habitTasks) {
    await createNotificationOncePerDay({
      userId: task.userId,
      taskId: task._id,
      type: "task_reminder",
      title: "Habit Reminder",
      message: `Reminder: "${task.title}" is scheduled for today.`,
      taskTitle: task.title,
      date: now
    });
  }

  for (const task of datedTasks) {
    const dueDate = new Date(task.dueDate);

    if (isSameCalendarDay(now, dueDate)) {
      await createNotificationOncePerDay({
        userId: task.userId,
        taskId: task._id,
        type: "task_due",
        title: "Task Due Today",
        message: `Your task "${task.title}" is due today.`,
        taskTitle: task.title,
        date: now
      });
      continue;
    }

    if (dueDate < now) {
      await createNotificationOncePerDay({
        userId: task.userId,
        taskId: task._id,
        type: "task_overdue",
        title: "Task Overdue",
        message: `Your task "${task.title}" is overdue.`,
        taskTitle: task.title,
        date: now
      });
    }
  }
};

export const startTaskReminderWorker = () => {
  if (!env.remindersEnabled) {
    console.log("Task reminder worker disabled by configuration.");
    return () => {};
  }

  const runSweepSafely = async () => {
    try {
      await runTaskReminderSweep();
    } catch (error) {
      console.error("Task reminder sweep failed:", error);
    }
  };

  // Trigger one immediate sweep on startup so users do not wait for first interval.
  runSweepSafely();

  const timer = setInterval(runSweepSafely, env.reminderIntervalMs);
  console.log(`Task reminder worker started (interval: ${env.reminderIntervalMs}ms).`);

  return () => clearInterval(timer);
};
