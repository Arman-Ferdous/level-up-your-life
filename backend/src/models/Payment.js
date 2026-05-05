import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, default: "" },
    amount: { type: Number, required: true },
    cardLast4: { type: String, default: "" },
    status: { type: String, enum: ["success", "failed"], default: "success" }
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
