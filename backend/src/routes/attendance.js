import { Router } from "express";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import User from "../models/User.js";
import Settings from "../models/Settings.js";
import { authRequired } from "../middleware/auth.js";
import { computeLeaveBalance } from "../utils/leaveBalance.js";
import { ensureEarnedAccrualUpToDate } from "../utils/earnedAccrual.js";
import { getISTDateStr, getISTTimeStr } from "../utils/timezone.js";

const router = Router();
router.use(authRequired);

const todayStr = () => getISTDateStr();
const isSunday = () => {
  const dateStr = getISTDateStr();
  return isSundayDate(dateStr);
};
const isSundayDate = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 0;
};
const nowHHmm = () => getISTTimeStr();

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
    const date = req.query.date || todayStr();
    const rec = await Attendance.findOne({ user: req.user._id, date });
    res.json({ record: rec });
  } catch (e) { next(e); }
});

router.post("/check-in", async (req, res, next) => {
  try {
    const date = req.body.date || todayStr();
    const time = req.body.time || nowHHmm();

    if (isSundayDate(date)) return next({ status: 400, message: "Check-in is not available on Sundays" });

    const settings = (await Settings.findOne({ key: "global" })) || (await Settings.create({ key: "global" }));
    const parts = (settings.workingHours || "09:00 – 18:00").split(/[-–—]/).map(s => s.trim());
    const dutyEndTime = parts[1] || "18:00";

    // Auto-checkout any prior active check-ins
    await Attendance.updateMany(
      { user: req.user._id, date: { $ne: date }, checkIn: { $exists: true }, checkOut: { $exists: false } },
      { $set: { checkOut: dutyEndTime } }
    );

    const [hours, minutes] = time.split(":").map(Number);
    const late = hours > 9 || (hours === 9 && minutes > 15);
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
    const date = req.body.date || todayStr();
    const time = req.body.time || nowHHmm();

    if (isSundayDate(date)) return next({ status: 400, message: "Check-out is not available on Sundays" });
    
    const rec = await Attendance.findOneAndUpdate(
      { user: req.user._id, date },
      { $set: { checkOut: time } },
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
