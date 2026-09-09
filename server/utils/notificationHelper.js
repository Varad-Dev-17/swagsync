import Notification from "../models/notification.js";
import User from "../models/user.js";

/**
 * Creates a notification for a specific user.
 */
export const createNotification = async ({
  userId,
  type = "orders",
  title,
  message,
  link = "/account/notifications",
  linkText = "View Details",
  iconType = "bell",
  color = "text-blue-600 bg-blue-50 border-blue-100",
  entityId = "",
}) => {
  try {
    if (!userId || !title || !message) {
      return null;
    }

    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      link,
      linkText,
      iconType,
      color,
      entityId,
    });

    return notification;
  } catch (error) {
    console.error("[Create Notification Error]:", error.message);
    return null;
  }
};

/**
 * Creates a broadcast notification for all active users (e.g. new coupon added by admin).
 */
export const createBroadcastNotification = async ({
  type = "offers",
  title,
  message,
  link = "/account/coupons",
  linkText = "View Coupon",
  iconType = "tag",
  color = "text-amber-600 bg-amber-50 border-amber-100",
  entityId = "",
}) => {
  try {
    if (!title || !message) {
      return null;
    }

    // Get all registered users
    const users = await User.find({}).select("_id").lean();
    if (!users || users.length === 0) return null;

    const notifications = users.map((u) => ({
      user: u._id,
      type,
      title,
      message,
      link,
      linkText,
      iconType,
      color,
      entityId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await Notification.insertMany(notifications);
    return true;
  } catch (error) {
    console.error("[Create Broadcast Notification Error]:", error.message);
    return null;
  }
};
