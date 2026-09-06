import { Router } from "express";
import { z } from "zod";
import Leave from "../models/Leave.js";
import User from "../models/User.js";
import { authRequired, adminOnly, isDemoUser } from "../middleware/auth.js";
import { canRequestLeave, computeLeaveBalance } from "../utils/leaveBalance.js";
import { syncApprovedLeaveAttendance } from "../utils/syncLeaveAttendance.js";
import { ensureEarnedAccrualUpToDate } from "../utils/earnedAccrual.js";
import { notifyAdmins, notifyUser } from "../services/notification.js";

const router = Router();
router.use(authRequired);

// calculates and returns how many leave days the logged-in user has left
router.get("/balance", async (req, res, next) => {
  try {
    await ensureEarnedAccrualUpToDate();
    const user = await User.findById(req.user._id);
    const leaves = await Leave.find({ user: req.user._id });
    res.json({ balance: computeLeaveBalance(user, leaves, { includePending: true }) });
  } catch (e) {
    next(e);
  }
});

// gets a list of leave requests. admins see everyone's (scoped to demo or real), employees only see their own
router.get("/", async (req, res, next) => {
  try {
    await ensureEarnedAccrualUpToDate();
    const { userId, status } = req.query;
    const isDemo = isDemoUser(req.user);
    const q = {};
    if (req.user.role !== "admin") {
      q.user = req.user._id;
    } else {
      const userFilter = isDemo ? { isDummy: true } : { isDummy: { $ne: true } };
      if (userId) {
        userFilter._id = userId;
      }
      const scopedUsers = await User.find(userFilter).select("_id");
      const scopedIds = scopedUsers.map((u) => u._id);
      q.user = { $in: scopedIds };
    }
    if (status) q.status = status;
    const leaves = await Leave.find(q)
      .populate("user", "name email employeeId department isDummy")
      .sort({ createdAt: -1 });
    res.json({ leaves });
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  type: z.enum(["Earned Leave", "Comp-Off Leave"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration: z.string().default("full"),
  reason: z.string().min(1).max(500),
});

async function validateLeaveRequest(userId, type, startDate, endDate, duration, excludeLeaveId) {
  await ensureEarnedAccrualUpToDate();
  const user = await User.findById(userId);
  const q = { user: userId };
  if (excludeLeaveId) q._id = { $ne: excludeLeaveId };
  const leaves = await Leave.find(q);
  return canRequestLeave(user, leaves, type, startDate, endDate, duration);
}

// handles submitting a new leave request.
router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    if (data.endDate < data.startDate) {
      return next({ status: 400, message: "End date must be on or after start date" });
    }
    const isHalf = data.duration === "half" || parseFloat(data.duration) === 0.5;
    if (isHalf && data.startDate !== data.endDate) {
      return next({ status: 400, message: "Half-day leave must be for a single date" });
    }
    const check = await validateLeaveRequest(
      req.user._id,
      data.type,
      data.startDate,
      data.endDate,
      data.duration
    );
    if (!check.ok) return next({ status: 400, message: check.message });
    const leave = await Leave.create({ ...data, user: req.user._id });
    
    // Notify admins only for real accounts (exclude demo accounts from sending alerts to real admins)
    if (!isDemoUser(req.user)) {
      await notifyAdmins("New Leave Request", `${req.user.name} has requested ${data.type} from ${data.startDate} to ${data.endDate}.`, "leave", leave._id);
    }

    res.status(201).json({ leave });
  } catch (e) {
    next(e);
  }
});

// admin : approves the leave 
router.patch("/:id/approve", adminOnly, async (req, res, next) => {
  try {
    const existing = await Leave.findById(req.params.id).populate("user");
    if (!existing) return next({ status: 404, message: "Not found" });
    if (existing.status !== "Pending") return next({ status: 400, message: "Leave is not pending" });

    // Isolation check: demo admin can only approve dummy leaves; real admin can only approve real leaves
    const isDemo = isDemoUser(req.user);
    const isTargetDemo = isDemoUser(existing.user);
    if (isDemo !== isTargetDemo) {
      return next({ status: 403, message: "Access denied. Cross-environment approval is prohibited." });
    }

    const check = await validateLeaveRequest(
      existing.user._id,
      existing.type,
      existing.startDate,
      existing.endDate,
      existing.duration || "full",
      existing._id
    );
    if (!check.ok) return next({ status: 400, message: check.message });

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: "Approved", decidedBy: req.user._id, decidedAt: new Date() },
      { new: true }
    ).populate("user", "name");
    await syncApprovedLeaveAttendance(leave);
    
    // Notify user
    await notifyUser(leave.user._id, "Leave Approved", `Your ${leave.type} from ${leave.startDate} to ${leave.endDate} has been approved.`, "leave", leave._id);

    res.json({ leave });
  } catch (e) {
    next(e);
  }
});

// admin reject leave request
router.patch("/:id/reject", adminOnly, async (req, res, next) => {
  try {
    const existing = await Leave.findById(req.params.id).populate("user");
    if (!existing) return next({ status: 404, message: "Not found" });

    // Isolation check: demo admin can only reject dummy leaves; real admin can only reject real leaves
    const isDemo = isDemoUser(req.user);
    const isTargetDemo = isDemoUser(existing.user);
    if (isDemo !== isTargetDemo) {
      return next({ status: 403, message: "Access denied. Cross-environment action is prohibited." });
    }

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: "Rejected", decidedBy: req.user._id, decidedAt: new Date() },
      { new: true }
    ).populate("user", "name");

    // Notify user
    await notifyUser(leave.user._id, "Leave Rejected", `Your ${leave.type} from ${leave.startDate} to ${leave.endDate} has been rejected.`, "leave", leave._id);

    res.json({ leave });
  } catch (e) {
    next(e);
  }
});

// deletes a leave request.
router.delete("/:id", async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id).populate("user");
    if (!leave) return next({ status: 404, message: "Not found" });
    const owns = String(leave.user._id || leave.user) === String(req.user._id);

    if (req.user.role === "admin") {
      const isDemo = isDemoUser(req.user);
      const isTargetDemo = isDemoUser(leave.user);
      if (isDemo !== isTargetDemo) {
        return next({ status: 403, message: "Access denied. Cross-environment action is prohibited." });
      }
    } else if (!(owns && leave.status === "Pending")) {
      return next({ status: 403, message: "Forbidden" });
    }

    await leave.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
