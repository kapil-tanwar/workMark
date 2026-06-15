import mongoose from "mongoose";
import User from "../models/User.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/attend_easy";

export async function connectDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log("MongoDB connected:", mongoose.connection.name);

  // Fix users saved with email: null (breaks unique index for optional email)
  await User.updateMany({ $or: [{ email: null }, { email: "" }] }, { $unset: { email: "" } });

  try {
    await User.syncIndexes();
  } catch (err) {
    console.warn("User index sync:", err.message);
  }

  return mongoose.connection;
}

export function getDBStatus() {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  return {
    ok: mongoose.connection.readyState === 1,
    state: states[mongoose.connection.readyState] || "unknown",
    name: mongoose.connection.name || null,
  };
}
