import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { Transaction } from "../models/Transaction.js";

function parseMonthYear(query) {
  const now = new Date();
  const fallbackYear = now.getUTCFullYear();
  const fallbackMonth = now.getUTCMonth() + 1;

  const year = Number(query.year ?? fallbackYear);
  const month = Number(query.month ?? fallbackMonth);

  if (!Number.isInteger(year) || year < 1970 || year > 3000) {
    throw new AppError("Invalid year filter", 400);
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new AppError("Invalid month filter", 400);
  }

  return { year, month };
}

function getMonthRange(year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  return { start, end, monthKey };
}

function ensureObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid transaction id", 400);
  }
}

export const createTransaction = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { type, category, amount, note, date } = req.body;

  const transaction = await Transaction.create({
    userId,
    type,
    category,
    amount,
    note: note ?? "",
    date: new Date(`${date}T00:00:00.000Z`),
  });

  res.status(201).json({ transaction });
});

export const getTransactions = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { year, month } = parseMonthYear(req.query);
  const { start, end } = getMonthRange(year, month);

  const transactions = await Transaction.find({
    userId,
    date: { $gte: start, $lt: end },
  })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  res.status(200).json({ transactions, filter: { year, month } });
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  ensureObjectId(id);

  const patch = { ...req.body };
  if (patch.date) {
    const parsedDate = new Date(`${patch.date}T00:00:00.000Z`);
    patch.date = parsedDate;
    patch.monthKey = `${parsedDate.getUTCFullYear()}-${String(parsedDate.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  const transaction = await Transaction.findOneAndUpdate(
    { _id: id, userId },
    patch,
    { new: true, runValidators: true }
  );

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  res.status(200).json({ transaction });
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  ensureObjectId(id);

  const deleted = await Transaction.findOneAndDelete({ _id: id, userId });
  if (!deleted) {
    throw new AppError("Transaction not found", 404);
  }

  res.status(200).json({ success: true });
});

export const getTransactionStats = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.sub);
  const { year, month } = parseMonthYear(req.query);
  const { start, end, monthKey } = getMonthRange(year, month);

  const [summaryRows, categoryRows, dailyRows] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { userId, date: { $gte: start, $lt: end }, type: "expense" } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
    ]),
    Transaction.aggregate([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.day": 1 } },
    ]),
  ]);

  const summary = { income: 0, expense: 0, balance: 0 };
  for (const row of summaryRows) {
    if (row._id === "income") summary.income = row.total;
    if (row._id === "expense") summary.expense = row.total;
  }
  summary.balance = summary.income - summary.expense;

  const categoryBreakdown = categoryRows.map((row) => ({
    category: row._id,
    total: row.total,
  }));

  const dailyMap = new Map();
  for (const row of dailyRows) {
    const day = String(row._id.day).padStart(2, "0");
    const prev = dailyMap.get(day) ?? { day, income: 0, expense: 0, balance: 0 };
    if (row._id.type === "income") prev.income = row.total;
    if (row._id.type === "expense") prev.expense = row.total;
    prev.balance = prev.income - prev.expense;
    dailyMap.set(day, prev);
  }

  res.status(200).json({
    monthKey,
    filter: { year, month },
    summary,
    categoryBreakdown,
    dailySeries: Array.from(dailyMap.values()),
  });
});
