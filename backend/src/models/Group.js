import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
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
    members: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }
      ],
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
groupSchema.index({ members: 1, createdAt: -1 });

export const Group = mongoose.model("Group", groupSchema);
