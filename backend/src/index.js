import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import { connectDB, getDBStatus } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import employeeRoutes from "./routes/employees.js";
import attendanceRoutes from "./routes/attendance.js";
import leaveRoutes from "./routes/leaves.js";
import compOffRoutes from "./routes/compOff.js";
import reportRoutes from "./routes/reports.js";
import settingsRoutes from "./routes/settings.js";
import { ensureEarnedAccrualUpToDate, scheduleMonthlyAccrual } from "./utils/earnedAccrual.js";

function normalizeOrigin(origin) {
  return String(origin || "").trim().replace(/\/$/, "");
}

function getCorsOrigins() {
  return (process.env.CORS_ORIGIN || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
}

const app = express();
app.set("trust proxy", 1);

const corsOrigins = getCorsOrigins();

app.use(
  cors({
    origin(origin, callback) {
      // Non-browser clients (curl, health checks) have no Origin header
      if (!origin) return callback(null, true);
      if (!corsOrigins.length) return callback(null, true);

      const requestOrigin = normalizeOrigin(origin);
      if (corsOrigins.includes(requestOrigin)) {
        return callback(null, true);
      }

      console.warn(`CORS blocked origin: ${origin}. Allowed: ${corsOrigins.join(", ")}`);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/", (_req, res) =>
  res.json({ ok: true, service: "WorkFlow HR API", health: "/health" })
);
app.get("/health", (_req, res) => res.json({ ok: true, db: getDBStatus() }));

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/comp-off", compOffRoutes);
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
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    console.error("JWT_SECRET is required in production");
    process.exit(1);
  }

  try {
    await connectDB();
    await ensureEarnedAccrualUpToDate();
    scheduleMonthlyAccrual();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`API ready on port ${PORT}`);
      if (corsOrigins.length) {
        console.log("CORS allowed origins:", corsOrigins.join(", "));
      } else {
        console.warn("CORS_ORIGIN not set — all browser origins allowed (set in production)");
      }
    });
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
