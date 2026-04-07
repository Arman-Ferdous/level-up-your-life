import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { Task } from "../models/Task.js";
import { createNotification } from "./notificationController.js";
import { Group } from "../models/Group.js";
import { User } from "../models/User.js";

function toLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeTaskType(taskType, isGroupTask) {
  if (isGroupTask && taskType === "deadline") {
    return "once";
  }

  return taskType;
}

function normalizeTaskForResponse(task, isGroupTask) {
  return {
    ...task,
    type: normalizeTaskType(task.type, isGroupTask)
  };
}

async function getAccessibleGroup(groupId, userId, includeMembers = false) {
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    throw new AppError("Invalid group id", 400);
  }

  const group = await Group.findOne({
    _id: groupId,
    "members.userId": userId
  })
    .select(includeMembers ? { _id: 1, members: 1 } : { _id: 1 })
    .lean();

  if (!group) {
    throw new AppError("Group not found", 404);
  }

  return group;
}

async function buildGroupMembersPayload(group) {
  const memberUserIds = (group.members || []).map((member) => member.userId);

  const users = await User.find({ _id: { $in: memberUserIds } })
    .select({ _id: 1, name: 1 })
    .lean();

  const usersById = new Map(users.map((user) => [String(user._id), user]));

  return (group.members || []).map((member) => {
    const memberId = String(member.userId);
    return {
      userId: memberId,
      name: usersById.get(memberId)?.name || "Unknown",
      role: member.role || "Novice"
    };
  });
}

async function ensureTaskAccess(task, userId) {
  if (!task.groupId) {
    if (String(task.userId) !== String(userId)) {
      throw new AppError("Task not found", 404);
    }

    return;
  }

  const group = await getAccessibleGroup(task.groupId, userId);

  if (!group) {
    throw new AppError("You do not have access to this group task", 403);
  }
}

export const createTask = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { title, description, type, dueDate, priority, reminderWeekdays, reminderTime, groupId } = req.body;
  const isGroupTask = Boolean(groupId);

  if (isGroupTask) {
    await getAccessibleGroup(groupId, userId);

    if (type === "deadline") {
      throw new AppError("Group tasks do not support deadline type. Use one-time task with a due date.", 400);
    }

    if (type === "once" && !dueDate) {
      throw new AppError("Group one-time tasks require a due date", 400);
    }
  }

  const normalizedType = normalizeTaskType(type, isGroupTask);

  const task = await Task.create({
    userId,
    groupId: groupId || null,
    title,
    description: description || "",
    type: normalizedType,
    dueDate: (normalizedType === "deadline" || (isGroupTask && normalizedType === "once")) && dueDate
      ? new Date(dueDate)
      : null,
    reminderWeekdays: normalizedType === "habit" ? reminderWeekdays ?? [] : [],
    reminderTime: reminderTime || null,
    priority: priority || "medium",
    completed: false,
    groupCompletionUsers: [],
    habitCompletionHistory: []
  });

  await createNotification(
    userId,
    task._id,
    "task_reminder",
    "Task Created",
    `Your task "${task.title}" was created successfully.`,
    task.title
  );

  const taskResponse = normalizeTaskForResponse(task.toObject(), isGroupTask);
  res.status(201).json({ task: taskResponse });
});

export const getTasks = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { type, groupId } = req.query;
  const isGroupTaskQuery = Boolean(groupId);

  const query = {};
  let group = null;
  let groupMembers = [];

  if (isGroupTaskQuery) {
    group = await getAccessibleGroup(groupId, userId, true);
    query.groupId = groupId;
  } else {
    query.userId = userId;
  }

  if (type && ["habit", "deadline", "once"].includes(type)) {
    if (isGroupTaskQuery && (type === "once" || type === "deadline")) {
      query.type = { $in: ["once", "deadline"] };
    } else {
      query.type = type;
    }
  }

  const taskDocs = await Task.find(query)
    .sort({ createdAt: -1 })
    .lean();

  const tasks = taskDocs.map((task) => normalizeTaskForResponse(task, isGroupTaskQuery));

  if (isGroupTaskQuery && group) {
    groupMembers = await buildGroupMembersPayload(group);
  }

  res.status(200).json({ tasks, groupMembers });
});

export const updateTask = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const { title, description, type, dueDate, completed, priority, reminderWeekdays, reminderTime } = req.body;
  const isCompletionOnlyUpdate =
    completed !== undefined &&
    title === undefined &&
    description === undefined &&
    type === undefined &&
    dueDate === undefined &&
    priority === undefined &&
    reminderWeekdays === undefined;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid task id", 400);
  }

  const existingTask = await Task.findById(id).lean();
  if (!existingTask) {
    throw new AppError("Task not found", 404);
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (type !== undefined) updateData.type = type;
  if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
  if (reminderWeekdays !== undefined) updateData.reminderWeekdays = reminderWeekdays;
  if (reminderTime !== undefined) updateData.reminderTime = reminderTime || null;
  if (priority !== undefined) updateData.priority = priority;
  if (completed !== undefined) {
    updateData.completed = completed;
    updateData.completedOn = completed ? new Date() : null;
  }

  if (type === "habit") {
    updateData.dueDate = null;
  }
  if (type === "deadline" || type === "once") {
    updateData.reminderWeekdays = [];
  }

  const task = await Task.findById(id);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  await ensureTaskAccess(task, userId);

  const isGroupTask = Boolean(task.groupId);
  const currentType = normalizeTaskType(task.type, isGroupTask);
  const nextType = type !== undefined ? normalizeTaskType(type, isGroupTask) : currentType;

  let group = null;

  if (isGroupTask) {
    group = await getAccessibleGroup(task.groupId, userId, true);

    if (type === "deadline") {
      throw new AppError("Group tasks do not support deadline type. Use one-time task with a due date.", 400);
    }

    if (nextType === "once") {
      const resolvedDueDate = dueDate !== undefined ? dueDate : task.dueDate;
      if (!resolvedDueDate) {
        if (isCompletionOnlyUpdate || isGroupTask) {
          updateData.dueDate = task.createdAt || new Date();
        } else {
          throw new AppError("Group one-time tasks require a due date", 400);
        }
      }
    }
  }

  if (type !== undefined) {
    updateData.type = nextType;
  }

  if (nextType === "habit") {
    updateData.dueDate = null;
    if (type !== undefined && currentType !== "habit") {
      updateData.groupCompletionUsers = [];
    }
  }

  if (nextType === "once") {
    updateData.reminderWeekdays = [];
    if (type !== undefined && currentType !== "once") {
      updateData.habitCompletionHistory = [];
    }
  }

  if (isGroupTask && completed !== undefined) {
    if (nextType === "once") {
      const completionUsers = Array.isArray(task.groupCompletionUsers)
        ? [...task.groupCompletionUsers]
        : [];

      const currentUserId = String(userId);
      const existingIndex = completionUsers.findIndex(
        (entry) => String(entry.userId) === currentUserId
      );

      if (completed && existingIndex === -1) {
        completionUsers.push({ userId, completedOn: new Date() });
      }

      if (!completed && existingIndex >= 0) {
        completionUsers.splice(existingIndex, 1);
      }

      const completedUserIdSet = new Set(completionUsers.map((entry) => String(entry.userId)));
      const allMembersComplete = (group.members || []).every((member) =>
        completedUserIdSet.has(String(member.userId))
      );

      updateData.groupCompletionUsers = completionUsers;
      updateData.completed = allMembersComplete;
      updateData.completedOn = allMembersComplete ? new Date() : null;
    }

    if (nextType === "habit") {
      const todayKey = toLocalDayKey();
      let history = Array.isArray(task.habitCompletionHistory)
        ? [...task.habitCompletionHistory]
        : [];

      history = history.filter((entry) => entry?.dayKey);

      const currentUserId = String(userId);
      const existingIndex = history.findIndex(
        (entry) => String(entry.userId) === currentUserId && entry.dayKey === todayKey
      );

      if (completed && existingIndex === -1) {
        history.push({ userId, dayKey: todayKey, completedOn: new Date() });
      }

      if (!completed && existingIndex >= 0) {
        history.splice(existingIndex, 1);
      }

      const currentUserCompletedToday = history.some(
        (entry) => String(entry.userId) === currentUserId && entry.dayKey === todayKey
      );

      updateData.habitCompletionHistory = history;
      updateData.completed = currentUserCompletedToday;
      updateData.completedOn = currentUserCompletedToday ? new Date() : null;
    }
  }

  const updatedTaskDoc = await Task.findOneAndUpdate(
    { _id: id },
    updateData,
    { new: true, runValidators: true }
  );

  const updatedTask = normalizeTaskForResponse(updatedTaskDoc.toObject(), isGroupTask);
  const groupMembers = isGroupTask && group ? await buildGroupMembersPayload(group) : [];

  if (!isGroupTask && completed === true && existingTask.completed !== true) {
    await createNotification(
      userId,
      task._id,
      "task_completed",
      "Task Completed",
      `Great work! You completed "${task.title}".`,
      task.title
    );
  }

  const hadDueDate = Boolean(existingTask.dueDate);
  if (!isGroupTask && dueDate !== undefined && dueDate && !hadDueDate) {
    await createNotification(
      userId,
      task._id,
      "task_due",
      "Deadline Added",
      `A due date was set for "${task.title}".`,
      task.title
    );
  }

  res.status(200).json({ task: updatedTask, groupMembers });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid task id", 400);
  }

  const task = await Task.findById(id);
  if (!task) {
    throw new AppError("Task not found", 404);
  }

  await ensureTaskAccess(task, userId);

  const deleted = await Task.findByIdAndDelete(id);
  if (!deleted) {
    throw new AppError("Task not found", 404);
  }

  res.status(200).json({ success: true });
});
