import bcrypt from "bcryptjs";
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "../models/User.js";
import { Task } from "../models/Task.js";
import { Notification } from "../models/Notification.js";

const MOCK_USER = {
  name: "Weekly Review Mock User",
  email: "weekly.review.mock.user@example.com",
  password: "WeeklyReview!234"
};

const CLIENT_ORIGIN = "http://localhost:5173";

jest.setTimeout(30000);

let mongoServer;
let app;
let accessToken;
let consoleErrorSpy;

function setTestEnv() {
  process.env.NODE_ENV = "test";
  process.env.CLIENT_ORIGIN = CLIENT_ORIGIN;
  process.env.JWT_ACCESS_SECRET = "test_access_secret_for_weekly_review";
  process.env.JWT_REFRESH_SECRET = "test_refresh_secret_for_weekly_review";
  process.env.ACCESS_TOKEN_EXPIRES = "1h";
  process.env.REFRESH_TOKEN_EXPIRES = "7d";
}

function getWeekWindow(referenceDate = new Date()) {
  const start = new Date(referenceDate);
  const day = start.getDay();
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + offsetToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function inWindow(dateValue, start, end) {
  const date = new Date(dateValue);
  return date >= start && date <= end;
}

function buildWeeklyReview(tasks, referenceDate = new Date()) {
  const { start, end } = getWeekWindow(referenceDate);

  const dueTasks = tasks.filter((task) => task.dueDate && inWindow(task.dueDate, start, end));
  const completedTasks = tasks
    .filter((task) => task.completed && task.completedOn)
    .filter((task) => inWindow(task.completedOn, start, end));
  const missedTasks = dueTasks.filter((task) => !task.completed);

  return { start, end, dueTasks, completedTasks, missedTasks };
}

function createWeekDate(referenceDate, dayOffset) {
  const date = new Date(referenceDate);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(12, 0, 0, 0);
  return date;
}

function api(method, path) {
  return request(app)[method](path).set("Origin", CLIENT_ORIGIN);
}

function authedApi(method, path) {
  return api(method, path).set("Authorization", `Bearer ${accessToken}`);
}

async function createWeeklyTask({ title, dueDate }) {
  const response = await authedApi("post", "/api/tasks").send({
    title,
    description: "Task used to verify weekly review lifecycle behavior.",
    type: "deadline",
    dueDate: dueDate.toISOString(),
    priority: "medium"
  });

  expect(response.status).toBe(201);
  expect(response.body.task.title).toBe(title);
  return response.body.task;
}

beforeAll(async () => {
  setTestEnv();
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    dbName: "weekly-review-tests"
  });

  const importedApp = await import("../app.js");
  app = importedApp.createApp();

  await Promise.all([
    User.deleteMany({}),
    Task.deleteMany({}),
    Notification.deleteMany({})
  ]);

  const passwordHash = await bcrypt.hash(MOCK_USER.password, 12);
  await User.create({
    name: MOCK_USER.name,
    email: MOCK_USER.email,
    passwordHash
  });

  const loginResponse = await api("post", "/api/auth/login").send({
    email: MOCK_USER.email,
    password: MOCK_USER.password
  });

  expect(loginResponse.status).toBe(200);
  expect(loginResponse.body.accessToken).toBeTruthy();
  accessToken = loginResponse.body.accessToken;
});

beforeEach(async () => {
  await Promise.all([Task.deleteMany({}), Notification.deleteMany({})]);
});

afterAll(async () => {
  if (consoleErrorSpy) {
    consoleErrorSpy.mockRestore();
  }

  await Promise.all([
    Task.deleteMany({}),
    Notification.deleteMany({}),
    User.deleteMany({})
  ]);

  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe("Weekly review task flow", () => {
  it("rejects weekly-review access without a token", async () => {
    const response = await api("get", "/api/tasks");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/unauthorized|invalid/i);
  });

  it("shows a created task inside the selected week", async () => {
    const now = new Date();
    const { start } = getWeekWindow(now);
    const taskDueDate = createWeekDate(start, 2);
    const taskTitle = "Weekly review show task";
    const createdTask = await createWeeklyTask({ title: taskTitle, dueDate: taskDueDate });

    let tasksResponse = await authedApi("get", "/api/tasks");
    expect(tasksResponse.status).toBe(200);

    let review = buildWeeklyReview(tasksResponse.body.tasks, now);
    expect(review.dueTasks.map((task) => task.title)).toContain(taskTitle);
    expect(review.missedTasks.map((task) => task.title)).toContain(taskTitle);
    expect(review.completedTasks.map((task) => task.title)).not.toContain(taskTitle);
    expect(review.completedTasks.map((task) => task._id)).not.toContain(createdTask._id);
  });

  it("marks a task as completed inside the selected week", async () => {
    const now = new Date();
    const { start } = getWeekWindow(now);
    const taskDueDate = createWeekDate(start, 2);
    const taskTitle = "Weekly review complete task";
    const createdTask = await createWeeklyTask({ title: taskTitle, dueDate: taskDueDate });

    const completeResponse = await authedApi("put", `/api/tasks/${createdTask._id}`).send({
      completed: true
    });

    expect(completeResponse.status).toBe(200);
    expect(completeResponse.body.task.completed).toBe(true);

    const tasksResponse = await authedApi("get", "/api/tasks");
    expect(tasksResponse.status).toBe(200);

    const review = buildWeeklyReview(tasksResponse.body.tasks, now);
    expect(review.completedTasks.map((task) => task._id)).toContain(createdTask._id);
    expect(review.completedTasks.map((task) => task.title)).toContain(taskTitle);
    expect(review.missedTasks.map((task) => task._id)).not.toContain(createdTask._id);
  });

  it("removes a task from the selected week after deletion", async () => {
    const now = new Date();
    const { start } = getWeekWindow(now);
    const taskDueDate = createWeekDate(start, 2);
    const taskTitle = "Weekly review delete task";
    const createdTask = await createWeeklyTask({ title: taskTitle, dueDate: taskDueDate });

    const deleteResponse = await authedApi("delete", `/api/tasks/${createdTask._id}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);

    const tasksResponse = await authedApi("get", "/api/tasks");
    expect(tasksResponse.status).toBe(200);

    const review = buildWeeklyReview(tasksResponse.body.tasks, now);
    expect(review.dueTasks.map((task) => task._id)).not.toContain(createdTask._id);
    expect(review.completedTasks.map((task) => task._id)).not.toContain(createdTask._id);
    expect(tasksResponse.body.tasks.map((task) => task._id)).not.toContain(createdTask._id);
    expect(await Task.findById(createdTask._id)).toBeNull();
  });

  it("keeps tasks outside the selected week out of the weekly review", async () => {
    const now = new Date();
    const { end } = getWeekWindow(now);
    const outsideWeekDate = createWeekDate(end, 2);
    const taskTitle = "Outside weekly review task";

    const createResponse = await authedApi("post", "/api/tasks").send({
      title: taskTitle,
      description: "Task that should not appear in the chosen week.",
      type: "deadline",
      dueDate: outsideWeekDate.toISOString(),
      priority: "medium"
    });

    expect(createResponse.status).toBe(201);

    const tasksResponse = await authedApi("get", "/api/tasks");
    expect(tasksResponse.status).toBe(200);

    const review = buildWeeklyReview(tasksResponse.body.tasks, now);
    expect(review.dueTasks.map((task) => task.title)).not.toContain(taskTitle);
    expect(review.completedTasks.map((task) => task.title)).not.toContain(taskTitle);
    expect(tasksResponse.body.tasks.map((task) => task.title)).toContain(taskTitle);
  });
});