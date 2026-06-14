import mongoose from "mongoose";

const CompOffRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    overtimeDate: { type: String, required: true },
    duration: { type: String, enum: ["half", "full"], required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    creditAmount: { type: Number },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    decidedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("CompOffRequest", CompOffRequestSchema);
