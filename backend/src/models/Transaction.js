import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 240,
      default: "",
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    monthKey: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

transactionSchema.pre("validate", function preValidate(next) {
  if (this.date) {
    const date = new Date(this.date);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    this.monthKey = `${year}-${month}`;
  }
  next();
});

transactionSchema.index({ userId: 1, monthKey: 1, date: -1, createdAt: -1 });

export const Transaction = mongoose.model("Transaction", transactionSchema);
