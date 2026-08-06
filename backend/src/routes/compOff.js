import { Router } from "express";
import { z } from "zod";
import CompOffRequest from "../models/CompOffRequest.js";
import User from "../models/User.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { notifyAdmins, notifyUser } from "../services/notification.js";

const router = Router();
router.use(authRequired);

const DURATION_CREDIT = { half: 0.5, full: 1 };

// get compoff total leaves
router.get("/", async (req, res, next) => {
  try {
    const { userId, status } = req.query;
    const q = {};
    if (req.user.role !== "admin") q.user = req.user._id;
    else if (userId) q.user = userId;
    if (status) q.status = status;
    const requests = await CompOffRequest.find(q)
      .populate("user", "name email employeeId department")
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
    
    // Notify admins
    await notifyAdmins("New Comp-Off Request", `${req.user.name} has requested a ${data.duration}-day comp-off for ${data.overtimeDate}.`, "comp-off", request._id);

    res.status(201).json({ request });
  } catch (e) {
    next(e);
  }
});


// admin only: approves 
router.patch("/:id/approve", adminOnly, async (req, res, next) => {
  try {
    const existing = await CompOffRequest.findById(req.params.id);
    if (!existing) return next({ status: 404, message: "Not found" });
    if (existing.status !== "Pending") return next({ status: 400, message: "Request is not pending" });

    const credit = DURATION_CREDIT[existing.duration];
    await User.findByIdAndUpdate(existing.user, {
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
    const request = await CompOffRequest.findByIdAndUpdate(
      req.params.id,
      { status: "Rejected", decidedBy: req.user._id, decidedAt: new Date() },
      { new: true }
    ).populate("user", "name");
    if (!request) return next({ status: 404, message: "Not found" });

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
    const request = await CompOffRequest.findById(req.params.id);
    if (!request) return next({ status: 404, message: "Not found" });
    const owns = String(request.user) === String(req.user._id);
    if (!(req.user.role === "admin" || (owns && request.status === "Pending")))
      return next({ status: 403, message: "Forbidden" });
    await request.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
