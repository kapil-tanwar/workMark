import mongoose from "mongoose";

const LeaveSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["Earned Leave", "Comp-Off Leave"], required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    duration: { type: String, enum: ["half", "full"], default: "full" },
    reason: { type: String, required: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    decidedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Leave", LeaveSchema);
