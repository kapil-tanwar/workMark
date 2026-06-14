import { Router } from "express";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import User from "../models/User.js";
import { authRequired } from "../middleware/auth.js";
import { computeLeaveBalance } from "../utils/leaveBalance.js";
import { ensureEarnedAccrualUpToDate } from "../utils/earnedAccrual.js";

const router = Router();
router.use(authRequired);

const todayStr = () => new Date().toISOString().slice(0, 10);
const isSunday = () => new Date().getDay() === 0;
const nowHHmm = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

router.get("/", async (req, res, next) => {
  try {
    const { userId, from, to } = req.query;
    const q = {};
    if (req.user.role !== "admin") q.user = req.user._id;
    else if (userId) q.user = userId;
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = String(from);
      if (to) q.date.$lte = String(to);
    }
    const records = await Attendance.find(q).populate("user", "name email employeeId department").sort({ date: -1 });
    res.json({ records });
  } catch (e) { next(e); }
});

router.get("/today", async (req, res, next) => {
  try {
    const rec = await Attendance.findOne({ user: req.user._id, date: todayStr() });
    res.json({ record: rec });
  } catch (e) { next(e); }
});

router.post("/check-in", async (req, res, next) => {
  try {
    if (isSunday()) return next({ status: 400, message: "Check-in is not available on Sundays" });
    const date = todayStr();
    const time = nowHHmm();
    const now = new Date();
    const late = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);
    const status = late ? "Late" : "Present";
    const rec = await Attendance.findOneAndUpdate(
      { user: req.user._id, date },
      { $setOnInsert: { user: req.user._id, date }, $set: { checkIn: time, status } },
      { new: true, upsert: true }
    );
    res.json({ record: rec });
  } catch (e) { next(e); }
});

router.post("/check-out", async (req, res, next) => {
  try {
    if (isSunday()) return next({ status: 400, message: "Check-out is not available on Sundays" });
    const rec = await Attendance.findOneAndUpdate(
      { user: req.user._id, date: todayStr() },
      { $set: { checkOut: nowHHmm() } },
      { new: true }
    );
    if (!rec) return next({ status: 400, message: "No check-in for today" });
    res.json({ record: rec });
  } catch (e) { next(e); }
});

router.get("/summary/:userId", async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (req.user.role !== "admin" && String(req.user._id) !== userId)
      return next({ status: 403, message: "Forbidden" });

    const ym = new Date().toISOString().slice(0, 7);
    const recs = await Attendance.find({ user: userId, date: { $regex: `^${ym}` } });
    const counts = {
      present: recs.filter((r) => r.status === "Present" || r.status === "Late").length,
      absent: recs.filter((r) => r.status === "Absent").length,
      late: recs.filter((r) => r.status === "Late").length,
      leave: recs.filter((r) => r.status === "Leave").length,
    };

    await ensureEarnedAccrualUpToDate();
    const user = await User.findById(userId);
    const leaves = await Leave.find({ user: userId });
    const leaveBalance = computeLeaveBalance(user, leaves, { includePending: false });

    res.json({
      counts,
      leaveBalance,
    });
  } catch (e) { next(e); }
});

export default router;
