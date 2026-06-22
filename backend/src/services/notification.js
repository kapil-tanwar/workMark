import Notification from "../models/Notification.js";
import User from "../models/User.js";

/**
 * Send a notification to a specific user
 */
export async function notifyUser(userId, title, message, type = "system", relatedId = null) {
  try {
    await Notification.create({
      recipient: userId,
      title,
      message,
      type,
      relatedId,
    });
  } catch (err) {
    console.error("Failed to create user notification:", err);
  }
}

/**
 * Send a notification to all active, approved admins
 */
export async function notifyAdmins(title, message, type = "admin", relatedId = null) {
  try {
    const admins = await User.find({
      role: "admin",
      active: true,
      $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }],
    }).select("_id");
    const notifications = admins.map((admin) => ({
      recipient: admin._id,
      title,
      message,
      type,
      relatedId,
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    console.error("Failed to create admin notifications:", err);
  }
}
