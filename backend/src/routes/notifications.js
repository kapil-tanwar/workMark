import { Router } from "express";
import Notification from "../models/Notification.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

// gets the latest notifications
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

// marks a specific notification as read 
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

// marks all of the user's unread notifications as read at once
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
