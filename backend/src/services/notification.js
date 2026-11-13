import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { isDemoUser } from "../middleware/auth.js";

// Send a notification to a specific user
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

// Send a notification to all active, approved, NON-DEMO admins
export async function notifyAdmins(title, message, type = "admin", relatedId = null) {
  try {
    const admins = await User.find({
      role: "admin",
      active: true,
      isDummy: { $ne: true },  // exclude seeded demo accounts
      $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }],
    }).select("_id email employeeId");

    // Extra safety: filter out any that match the isDemoUser logic (legacy emails)
    const realAdmins = admins.filter((a) => !isDemoUser(a));

    const notifications = realAdmins.map((admin) => ({
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

