import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },
    companyName: { type: String, default: "Acme Corporation" },
    companyEmail: { type: String, default: "hr@acme.co" },
    workingHours: { type: String, default: "09:00 – 18:00" },
    leaveAllocation: {
      casual: { type: Number, default: 8 },
      sick: { type: Number, default: 10 },
      earned: { type: Number, default: 12 },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", SettingsSchema);
