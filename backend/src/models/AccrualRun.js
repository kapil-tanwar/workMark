import mongoose from "mongoose";

const AccrualRunSchema = new mongoose.Schema(
  {
    monthKey: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    employeeCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("AccrualRun", AccrualRunSchema);
