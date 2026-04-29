import mongoose from "mongoose";

const groupCompletionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    completedOn: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const habitCompletionHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    dayKey: {
      type: String,
      required: true
    },
    completedOn: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    type: {
      type: String,
      enum: ["habit", "deadline", "once"],
      required: true
    },
    reminderWeekdays: {
      type: [String],
      enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      default: []
    },
    reminderTime: {
      type: String,
      default: null,
      match: /^([01]\d|2[0-3]):[0-5]\d$/
    },
    dueDate: {
      type: Date,
      default: null
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedOn: {
      type: Date,
      default: null
    },
    rewarded: {
      type: Boolean,
      default: false
    },
    groupCompletionUsers: {
      type: [groupCompletionSchema],
      default: []
    },
    habitCompletionHistory: {
      type: [habitCompletionHistorySchema],
      default: []
    },
    habitRewardMilestones: {
      type: [Number],
      default: []
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    }
  },
  { timestamps: true }
);

// Index for efficient queries
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, type: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, reminderWeekdays: 1 });
taskSchema.index({ groupId: 1, createdAt: -1 });
taskSchema.index({ groupId: 1, type: 1 });
taskSchema.index({ groupId: 1, "groupCompletionUsers.userId": 1 });
taskSchema.index({ groupId: 1, "habitCompletionHistory.dayKey": 1 });

export const Task = mongoose.model("Task", taskSchema);
