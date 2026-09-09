import Notification from "../models/notification.js";

// Fetch notifications for current user
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { type, unreadOnly, limit = 50, page = 1 } = req.query;

    const query = { user: userId };

    if (type && type !== "all" && type !== "unread") {
      query.type = type;
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
      Notification.countDocuments({ user: userId, read: false }),
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
    console.error("[Get Notifications Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const count = await Notification.countDocuments({ user: userId, read: false });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("[Get Unread Count Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
    });
  }
};

// Mark single notification as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
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
    console.error("[Mark As Read Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
};

// Mark all notifications as read for current user
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId;

    await Notification.updateMany({ user: userId, read: false }, { read: true });

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("[Mark All As Read Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all as read",
    });
  }
};

// Delete single notification
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: userId,
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
    console.error("[Delete Notification Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};

// Clear all notifications for current user
export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;

    await Notification.deleteMany({ user: userId });

    res.status(200).json({
      success: true,
      message: "All notifications cleared",
    });
  } catch (error) {
    console.error("[Clear All Notifications Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear notifications",
    });
  }
};
