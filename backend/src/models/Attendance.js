import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    checkIn: String,  // HH:mm
    checkOut: String, // HH:mm
    status: { type: String, enum: ["Present", "Late", "Absent", "Leave"], default: "Present" },
  },
  { timestamps: true }
);

AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", AttendanceSchema);
