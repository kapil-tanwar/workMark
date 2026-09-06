import { Router } from "express";
import { z } from "zod";
import Settings from "../models/Settings.js";
import User from "../models/User.js";
import { authRequired, adminOnly, isDemoUser } from "../middleware/auth.js";
import { notifyUser } from "../services/notification.js";

const router = Router();
router.use(authRequired);

// grabs the global settings
router.get("/", async (_req, res, next) => {
  try {
    const s = (await Settings.findOne({ key: "global" })) || (await Settings.create({ key: "global" }));
    res.json({ settings: s });
  } catch (e) {
    next(e);
  }
});

const schema = z.object({
  companyName: z.string().optional(),
  companyEmail: z.string().email().optional(),
  workingHours: z.string().optional(),
  monthlyEarnedAccrual: z.number().min(0).optional(),
});

// admin only: updates the global settings
router.patch("/", adminOnly, async (req, res, next) => {
  try {
    if (isDemoUser(req.user)) {
      return next({ status: 403, message: "Settings changes are disabled for demo accounts." });
    }
    const data = schema.parse(req.body);
    const s = await Settings.findOneAndUpdate({ key: "global" }, data, { new: true, upsert: true });
    res.json({ settings: s });
  } catch (e) {
    next(e);
  }
});

// lists out people who signed up for an admin account and are waiting for approval
// Demo admins see an empty list — they are not part of the real approval workflow
router.get("/admin-requests", adminOnly, async (req, res, next) => {
  try {
    if (isDemoUser(req.user)) {
      // Demo admin is not a real admin — return empty list so the UI shows nothing
      return res.json({ requests: [] });
    }
    const requests = await User.find({
      role: "admin",
      approvalStatus: "pending",
      isDummy: { $ne: true },
    }).select("-passwordHash");
    res.json({ requests });
  } catch (e) {
    next(e);
  }
});

// admin: approves a new admin (demo admin cannot perform this action)
router.patch("/admin-requests/:id/approve", adminOnly, async (req, res, next) => {
  try {
    if (isDemoUser(req.user)) {
      return next({ status: 403, message: "Demo accounts cannot approve admin requests." });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { approvalStatus: "approved", active: true }, { new: true });
    if (user) await notifyUser(user._id, "Admin Account Approved", "Your admin account request has been approved. You can now log in.", "system");
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

// admin only: denies an admin signup request (demo admin cannot perform this action)
router.patch("/admin-requests/:id/reject", adminOnly, async (req, res, next) => {
  try {
    if (isDemoUser(req.user)) {
      return next({ status: 403, message: "Demo accounts cannot reject admin requests." });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { approvalStatus: "rejected", active: false }, { new: true });
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

export default router;

