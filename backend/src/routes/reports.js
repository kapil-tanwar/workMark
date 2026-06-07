import { Router } from "express";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import { authRequired, adminOnly } from "../middleware/auth.js";

const router = Router();
router.use(authRequired, adminOnly);

router.get("/attendance", async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const q = {};
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = String(from);
      if (to) q.date.$lte = String(to);
    }
    const records = await Attendance.find(q).populate("user", "name email employeeId department");
    const byStatus = records.reduce((m, r) => ((m[r.status] = (m[r.status] || 0) + 1), m), {});
    res.json({ total: records.length, byStatus, records });
  } catch (e) { next(e); }
});

router.get("/leaves", async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const q = {};
    if (from) q.startDate = { $gte: String(from) };
    if (to) q.endDate = { ...(q.endDate || {}), $lte: String(to) };
    const leaves = await Leave.find(q).populate("user", "name email employeeId department");
    const byStatus = leaves.reduce((m, l) => ((m[l.status] = (m[l.status] || 0) + 1), m), {});
    const byType = leaves.reduce((m, l) => ((m[l.type] = (m[l.type] || 0) + 1), m), {});
    res.json({ total: leaves.length, byStatus, byType, leaves });
  } catch (e) { next(e); }
});

export default router;
