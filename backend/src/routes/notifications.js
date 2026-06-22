import { Router } from "express";
import Notification from "../models/Notification.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

// Get user notifications
router.get("/", async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ notifications });
  } catch (e) {
    next(e);
  }
});

// Mark a notification as read
router.patch("/:id/read", async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return next({ status: 404, message: "Notification not found" });
    res.json({ notification });
  } catch (e) {
    next(e);
  }
});

// Mark all notifications as read
router.patch("/read-all", async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
