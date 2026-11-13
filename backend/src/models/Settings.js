import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },
    companyName: { type: String, default: "Acme Corporation" },
    companyEmail: { type: String, default: "hr@acme.co" },
    workingHours: { type: String, default: "09:00 – 18:00" },
    monthlyEarnedAccrual: { type: Number, default: 1.5 },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", SettingsSchema);
