import { Router } from "express";
import { z } from "zod";
import Settings from "../models/Settings.js";
import User from "../models/User.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { notifyUser } from "../services/notification.js";

const router = Router();
router.use(authRequired);

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

router.patch("/", adminOnly, async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    const s = await Settings.findOneAndUpdate({ key: "global" }, data, { new: true, upsert: true });
    res.json({ settings: s });
  } catch (e) {
    next(e);
  }
});

router.get("/admin-requests", adminOnly, async (req, res, next) => {
  try {
    const requests = await User.find({ role: "admin", approvalStatus: "pending" }).select("-passwordHash");
    res.json({ requests });
  } catch (e) {
    next(e);
  }
});

router.patch("/admin-requests/:id/approve", adminOnly, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { approvalStatus: "approved", active: true }, { new: true });
    if (user) await notifyUser(user._id, "Admin Account Approved", "Your admin account request has been approved. You can now log in.", "system");
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

router.patch("/admin-requests/:id/reject", adminOnly, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { approvalStatus: "rejected", active: false }, { new: true });
    // Not strictly necessary to notify rejected admins since they can't login, but we can try just in case we add email later.
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

export default router;
