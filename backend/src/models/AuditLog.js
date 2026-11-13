import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorEmployeeId: String,
    ip: String,
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export default mongoose.model("AuditLog", AuditLogSchema);
