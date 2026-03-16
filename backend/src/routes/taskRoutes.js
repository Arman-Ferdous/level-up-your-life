import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask
} from "../controllers/taskController.js";
import {
  createTaskSchema,
  updateTaskSchema
} from "../validators/task.validators.js";

export const taskRouter = Router();

taskRouter.use(requireAuth);
taskRouter.post("/", validate(createTaskSchema), createTask);
taskRouter.get("/", getTasks);
taskRouter.put("/:id", validate(updateTaskSchema), updateTask);
taskRouter.delete("/:id", deleteTask);
