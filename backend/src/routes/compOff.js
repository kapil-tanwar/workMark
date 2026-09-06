import { Router } from "express";
import { z } from "zod";
import CompOffRequest from "../models/CompOffRequest.js";
import User from "../models/User.js";
import { authRequired, adminOnly, isDemoUser } from "../middleware/auth.js";
import { notifyAdmins, notifyUser } from "../services/notification.js";

const router = Router();
router.use(authRequired);

const DURATION_CREDIT = { half: 0.5, full: 1 };

// get compoff total leaves
router.get("/", async (req, res, next) => {
  try {
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
    const requests = await CompOffRequest.find(q)
      .populate("user", "name email employeeId department isDummy")
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  overtimeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration: z.enum(["half", "full"]),
  reason: z.string().min(1).max(500),
});


// request compoff
router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const request = await CompOffRequest.create({ ...data, user: req.user._id });
    
    // Notify admins only for real accounts (do not notify real admins about demo requests)
    if (!isDemoUser(req.user)) {
      await notifyAdmins("New Comp-Off Request", `${req.user.name} has requested a ${data.duration}-day comp-off for ${data.overtimeDate}.`, "comp-off", request._id);
    }

    res.status(201).json({ request });
  } catch (e) {
    next(e);
  }
});


// admin only: approves 
router.patch("/:id/approve", adminOnly, async (req, res, next) => {
  try {
    const existing = await CompOffRequest.findById(req.params.id).populate("user");
    if (!existing) return next({ status: 404, message: "Not found" });
    if (existing.status !== "Pending") return next({ status: 400, message: "Request is not pending" });

    // Isolation check: demo admin can only approve dummy requests; real admin can only approve real requests
    const isDemo = isDemoUser(req.user);
    const isTargetDemo = isDemoUser(existing.user);
    if (isDemo !== isTargetDemo) {
      return next({ status: 403, message: "Access denied. Cross-environment action is prohibited." });
    }

    const credit = DURATION_CREDIT[existing.duration];
    await User.findByIdAndUpdate(existing.user._id, {
      $inc: { "leaveBalances.compOffTotal": credit },
    });

    const request = await CompOffRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: "Approved",
        creditAmount: credit,
        decidedBy: req.user._id,
        decidedAt: new Date(),
      },
      { new: true }
    ).populate("user", "name email employeeId department");

    // Notify user
    await notifyUser(request.user._id, "Comp-Off Approved", `Your ${request.duration}-day comp-off request for ${request.overtimeDate} has been approved.`, "comp-off", request._id);

    res.json({ request });
  } catch (e) {
    next(e);
  }
});

// admin only: rejects 
router.patch("/:id/reject", adminOnly, async (req, res, next) => {
  try {
    const existing = await CompOffRequest.findById(req.params.id).populate("user");
    if (!existing) return next({ status: 404, message: "Not found" });

    // Isolation check: demo admin can only reject dummy requests; real admin can only reject real requests
    const isDemo = isDemoUser(req.user);
    const isTargetDemo = isDemoUser(existing.user);
    if (isDemo !== isTargetDemo) {
      return next({ status: 403, message: "Access denied. Cross-environment action is prohibited." });
    }

    const request = await CompOffRequest.findByIdAndUpdate(
      req.params.id,
      { status: "Rejected", decidedBy: req.user._id, decidedAt: new Date() },
      { new: true }
    ).populate("user", "name");

    // Notify user
    await notifyUser(request.user._id, "Comp-Off Rejected", `Your ${request.duration}-day comp-off request for ${request.overtimeDate} has been rejected.`, "comp-off", request._id);

    res.json({ request });
  } catch (e) {
    next(e);
  }
});

// deletes a comp-off request
router.delete("/:id", async (req, res, next) => {
  try {
    const request = await CompOffRequest.findById(req.params.id).populate("user");
    if (!request) return next({ status: 404, message: "Not found" });
    const owns = String(request.user._id || request.user) === String(req.user._id);

    if (req.user.role === "admin") {
      const isDemo = isDemoUser(req.user);
      const isTargetDemo = isDemoUser(request.user);
      if (isDemo !== isTargetDemo) {
        return next({ status: 403, message: "Access denied. Cross-environment action is prohibited." });
      }
    } else if (!(owns && request.status === "Pending")) {
      return next({ status: 403, message: "Forbidden" });
    }

    await request.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
