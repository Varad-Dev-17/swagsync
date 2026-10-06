import Notification from "../models/notification.js";

// Fetch notifications for Admin
export const getAdminNotifications = async (req, res) => {
  try {
    const { type, unreadOnly, limit = 50, page = 1 } = req.query;

    const query = { recipientRole: "admin" };

    if (type && type !== "all" && type !== "unread") {
      // Support matching category variations
      if (type === "orders" || type === "order") {
        query.type = { $in: ["orders", "order"] };
      } else if (type === "users" || type === "user") {
        query.type = { $in: ["users", "user"] };
      } else if (type === "returns" || type === "return") {
        query.type = { $in: ["returns", "return"] };
      } else if (type === "vendors" || type === "vendor") {
        query.type = { $in: ["vendors", "vendor"] };
      } else if (type === "reviews" || type === "review") {
        query.type = { $in: ["reviews", "review"] };
      } else if (type === "tickets" || type === "ticket") {
        query.type = { $in: ["tickets", "ticket"] };
      } else if (type === "stock" || type === "stocks") {
        query.type = { $in: ["stock", "stocks"] };
      } else {
        query.type = type;
      }
    }

    if (unreadOnly === "true" || type === "unread") {
      query.read = false;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipientRole: "admin", read: false }),
    ]);

    res.status(200).json({
      success: true,
      notifications,
      total,
      unreadCount,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    });
  } catch (error) {
    console.error("[Get Admin Notifications Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin notifications",
    });
  }
};

// Get unread notification count for Admin
export const getAdminUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipientRole: "admin",
      read: false,
    });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("[Get Admin Unread Count Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get admin unread count",
    });
  }
};

// Mark single notification as read
export const markAdminNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientRole: "admin" },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("[Mark Admin Notification Read Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
};

// Mark all admin notifications as read
export const markAllAdminNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientRole: "admin", read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: "All admin notifications marked as read",
    });
  } catch (error) {
    console.error("[Mark All Admin Read Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all as read",
    });
  }
};

// Delete single admin notification
export const deleteAdminNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipientRole: "admin",
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("[Delete Admin Notification Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};

// Clear all admin notifications
export const clearAllAdminNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ recipientRole: "admin" });

    res.status(200).json({
      success: true,
      message: "All admin notifications cleared",
    });
  } catch (error) {
    console.error("[Clear All Admin Notifications Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear notifications",
    });
  }
};
