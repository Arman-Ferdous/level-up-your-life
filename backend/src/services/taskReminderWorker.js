import { Task } from "../models/Task.js";
import mongoose from "mongoose";
import { Group } from "../models/Group.js";
import { createNotificationOncePerDay } from "../controllers/notificationController.js";
import { env } from "../config/env.js";

const WEEKDAY_CODE_MAP = {
  sun: "sun",
  mon: "mon",
  tue: "tue",
  wed: "wed",
  thu: "thu",
  fri: "fri",
  sat: "sat"
};

const formatToParts = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return byType;
};

const getDayKeyInTimeZone = (date, timeZone) => {
  const parts = formatToParts(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const getWeekdayCodeInTimeZone = (date, timeZone) => {
  const parts = formatToParts(date, timeZone);
  const weekdayShort = (parts.weekday || "").toLowerCase().slice(0, 3);
  return WEEKDAY_CODE_MAP[weekdayShort] || "sun";
};

const getRecipientUserIdsByTask = async (tasks) => {
  const groupedTaskIds = tasks
    .map((task) => task.groupId)
    .filter((groupId) => groupId && mongoose.Types.ObjectId.isValid(groupId));

  if (groupedTaskIds.length === 0) {
    return new Map();
  }

  const uniqueGroupIds = [...new Set(groupedTaskIds.map((id) => String(id)))];
  const groups = await Group.find({ _id: { $in: uniqueGroupIds } })
    .select({ _id: 1, members: 1 })
    .lean();

  const recipientsByGroupId = new Map();

  for (const group of groups) {
    const recipients = (group.members || []).map((member) => member.userId);
    recipientsByGroupId.set(String(group._id), recipients);
  }

  return recipientsByGroupId;
};

const getTaskRecipients = (task, recipientsByGroupId) => {
  if (!task.groupId) return [task.userId];

  const recipients = recipientsByGroupId.get(String(task.groupId));
  if (!recipients || recipients.length === 0) return [task.userId];

  return recipients;
};

const getCurrentTimeInTimeZone = (date, timeZone) => {
  const parts = formatToParts(date, timeZone);
  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
};

const isTimeInReminderWindow = (taskReminderTime, currentHHmm) => {
  if (!taskReminderTime) return true;

  const [taskHour, taskMin] = taskReminderTime.split(":").map(Number);
  const [currentHour, currentMin] = currentHHmm.split(":").map(Number);

  const taskTotalMin = taskHour * 60 + taskMin;
  const currentTotalMin = currentHour * 60 + currentMin;

  const windowStart = taskTotalMin;
  const windowEnd = taskTotalMin + 59;

  return currentTotalMin >= windowStart && currentTotalMin <= windowEnd;
};

export const runTaskReminderSweep = async (now = new Date()) => {
  const reminderTimeZone = env.reminderTimeZone;
  const todayWeekday = getWeekdayCodeInTimeZone(now, reminderTimeZone);
  const todayDayKey = getDayKeyInTimeZone(now, reminderTimeZone);
  const currentTime = getCurrentTimeInTimeZone(now, reminderTimeZone);

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

  const recipientsByGroupId = await getRecipientUserIdsByTask([...habitTasks, ...datedTasks]);

  for (const task of habitTasks) {
    const recipients = getTaskRecipients(task, recipientsByGroupId);

    if (!isTimeInReminderWindow(task.reminderTime, currentTime)) continue;

    for (const recipientId of recipients) {
      await createNotificationOncePerDay({
        userId: recipientId,
        taskId: task._id,
        type: "task_reminder",
        title: "Habit Reminder",
        message: `Reminder: "${task.title}" is scheduled for today.`,
        taskTitle: task.title,
        date: now,
        dayKey: todayDayKey
      });
    }
  }

  for (const task of datedTasks) {
    const dueDate = new Date(task.dueDate);
    const dueDayKey = getDayKeyInTimeZone(dueDate, reminderTimeZone);
    const recipients = getTaskRecipients(task, recipientsByGroupId);

    if (dueDayKey === todayDayKey) {
      if (!isTimeInReminderWindow(task.reminderTime, currentTime)) continue;

      for (const recipientId of recipients) {
        await createNotificationOncePerDay({
          userId: recipientId,
          taskId: task._id,
          type: "task_due",
          title: "Task Due Today",
          message: `Your task "${task.title}" is due today.`,
          taskTitle: task.title,
          date: now,
          dayKey: todayDayKey
        });
      }
      continue;
    }

    if (dueDate < now && dueDayKey < todayDayKey) {
      if (!isTimeInReminderWindow(task.reminderTime, currentTime)) continue;

      for (const recipientId of recipients) {
        await createNotificationOncePerDay({
          userId: recipientId,
          taskId: task._id,
          type: "task_overdue",
          title: "Task Overdue",
          message: `Your task "${task.title}" is overdue.`,
          taskTitle: task.title,
          date: now,
          dayKey: todayDayKey
        });
      }
    }
  }
};

export const startTaskReminderWorker = () => {
  if (!env.remindersEnabled) {
    console.log("Task reminder worker disabled by configuration.");
    return () => {};
  }

  let isSweepRunning = false;

  const runSweepSafely = async () => {
    if (isSweepRunning) return;

    isSweepRunning = true;
    try {
      await runTaskReminderSweep();
    } catch (error) {
      console.error("Task reminder sweep failed:", error);
    } finally {
      isSweepRunning = false;
    }
  };

  // Trigger one immediate sweep on startup so users do not wait for first interval.
  runSweepSafely();

  const timer = setInterval(runSweepSafely, env.reminderIntervalMs);
  console.log(`Task reminder worker started (interval: ${env.reminderIntervalMs}ms).`);

  return () => clearInterval(timer);
};
