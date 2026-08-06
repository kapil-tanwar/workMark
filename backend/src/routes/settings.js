import { Router } from "express";
import { z } from "zod";
import Settings from "../models/Settings.js";
import User from "../models/User.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
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
    const data = schema.parse(req.body);
    const s = await Settings.findOneAndUpdate({ key: "global" }, data, { new: true, upsert: true });
    res.json({ settings: s });
  } catch (e) {
    next(e);
  }
});

// lists out people who signed up for an admin account and are waiting for approval
router.get("/admin-requests", adminOnly, async (req, res, next) => {
  try {
    const requests = await User.find({ role: "admin", approvalStatus: "pending" }).select("-passwordHash");
    res.json({ requests });
  } catch (e) {
    next(e);
  }
});

// admin: approves a new admin
router.patch("/admin-requests/:id/approve", adminOnly, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { approvalStatus: "approved", active: true }, { new: true });
    if (user) await notifyUser(user._id, "Admin Account Approved", "Your admin account request has been approved. You can now log in.", "system");
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

// admin only: denies an admin signup request
router.patch("/admin-requests/:id/reject", adminOnly, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { approvalStatus: "rejected", active: false }, { new: true });
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

export default router;
