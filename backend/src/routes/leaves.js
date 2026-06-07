import { Router } from "express";
import { z } from "zod";
import Leave from "../models/Leave.js";
import Settings from "../models/Settings.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { canRequestLeave } from "../utils/leaveBalance.js";
import { syncApprovedLeaveAttendance } from "../utils/syncLeaveAttendance.js";

const router = Router();
router.use(authRequired);

router.get("/", async (req, res, next) => {
  try {
    const { userId, status } = req.query;
    const q = {};
    if (req.user.role !== "admin") q.user = req.user._id;
    else if (userId) q.user = userId;
    if (status) q.status = status;
    const leaves = await Leave.find(q).populate("user", "name email employeeId department").sort({ createdAt: -1 });
    res.json({ leaves });
  } catch (e) { next(e); }
});

const createSchema = z.object({
  type: z.enum(["Casual Leave", "Sick Leave", "Earned Leave"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(1).max(500),
});

async function validateLeaveRequest(userId, type, startDate, endDate, excludeLeaveId) {
  const settings = (await Settings.findOne({ key: "global" })) || (await Settings.create({ key: "global" }));
  const q = { user: userId };
  if (excludeLeaveId) q._id = { $ne: excludeLeaveId };
  const leaves = await Leave.find(q);
  return canRequestLeave(leaves, settings.leaveAllocation, type, startDate, endDate);
}

router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    if (data.endDate < data.startDate) {
      return next({ status: 400, message: "End date must be on or after start date" });
    }
    const check = await validateLeaveRequest(req.user._id, data.type, data.startDate, data.endDate);
    if (!check.ok) return next({ status: 400, message: check.message });
    const leave = await Leave.create({ ...data, user: req.user._id });
    res.status(201).json({ leave });
  } catch (e) { next(e); }
});

router.patch("/:id/approve", adminOnly, async (req, res, next) => {
  try {
    const existing = await Leave.findById(req.params.id);
    if (!existing) return next({ status: 404, message: "Not found" });
    if (existing.status !== "Pending") return next({ status: 400, message: "Leave is not pending" });

    const check = await validateLeaveRequest(
      existing.user,
      existing.type,
      existing.startDate,
      existing.endDate,
      existing._id
    );
    if (!check.ok) return next({ status: 400, message: check.message });

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: "Approved", decidedBy: req.user._id, decidedAt: new Date() },
      { new: true }
    );
    await syncApprovedLeaveAttendance(leave);
    res.json({ leave });
  } catch (e) { next(e); }
});

router.patch("/:id/reject", adminOnly, async (req, res, next) => {
  try {
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: "Rejected", decidedBy: req.user._id, decidedAt: new Date() },
      { new: true }
    );
    if (!leave) return next({ status: 404, message: "Not found" });
    res.json({ leave });
  } catch (e) { next(e); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return next({ status: 404, message: "Not found" });
    const owns = String(leave.user) === String(req.user._id);
    if (!(req.user.role === "admin" || (owns && leave.status === "Pending")))
      return next({ status: 403, message: "Forbidden" });
    await leave.deleteOne();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
