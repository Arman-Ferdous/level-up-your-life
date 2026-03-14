import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
} from "../controllers/transactionController.js";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "../validators/transaction.validators.js";

export const transactionRouter = Router();

transactionRouter.use(requireAuth);
transactionRouter.get("/stats", getTransactionStats);
transactionRouter.get("/", getTransactions);
transactionRouter.post("/", validate(createTransactionSchema), createTransaction);
transactionRouter.put("/:id", validate(updateTransactionSchema), updateTransaction);
transactionRouter.delete("/:id", deleteTransaction);
