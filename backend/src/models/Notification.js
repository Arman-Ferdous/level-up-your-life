import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true
    },
    type: {
      type: String,
      enum: ["task_due", "task_completed", "task_reminder", "task_overdue"],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      maxlength: 500
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    taskTitle: {
      type: String,
      maxlength: 120
    },
    dayKey: {
      type: String,
      default: null,
      maxlength: 10
    }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index(
  { userId: 1, taskId: 1, type: 1, dayKey: 1 },
  {
    unique: true,
    partialFilterExpression: { dayKey: { $type: "string" } }
  }
);

export const Notification = mongoose.model("Notification", notificationSchema);
