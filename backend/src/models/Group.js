import mongoose from "mongoose";

const groupMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: ["Guild Master", "Veteran", "Novice"],
      default: "Novice"
    }
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    joinCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 6,
      maxlength: 6
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    members: {
      type: [groupMemberSchema],
      default: []
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

groupSchema.index({ joinCode: 1 }, { unique: true });
groupSchema.index({ "members.userId": 1, createdAt: -1 });

export const Group = mongoose.model("Group", groupSchema);
