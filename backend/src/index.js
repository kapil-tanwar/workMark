import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import { connectDB, getDBStatus } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import employeeRoutes from "./routes/employees.js";
import attendanceRoutes from "./routes/attendance.js";
import leaveRoutes from "./routes/leaves.js";
import reportRoutes from "./routes/reports.js";
import settingsRoutes from "./routes/settings.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? "*", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true, db: getDBStatus() }));

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);

app.use((err, _req, res, _next) => {
  if (err?.name === "ZodError") {
    return res.status(400).json({ error: err.issues?.[0]?.message || "Validation failed" });
  }
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`API ready on http://localhost:${PORT}`));
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    if (err.code === "ENOTFOUND" || String(err.message).includes("querySrv")) {
      console.error("\nThe MongoDB Atlas hostname could not be resolved.");
      console.error("Use a valid Atlas URI, or run local MongoDB and set in backend/.env:");
      console.error("  MONGODB_URI=mongodb://127.0.0.1:27017/attend_easy\n");
    } else if (err.name === "MongooseServerSelectionError") {
      console.error("\nCould not reach MongoDB. Start local MongoDB (mongod) or fix MONGODB_URI in backend/.env\n");
    }
    process.exit(1);
  }
}

start();
