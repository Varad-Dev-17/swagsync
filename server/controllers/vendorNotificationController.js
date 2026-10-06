import Notification from "../models/notification.js";

// Fetch notifications for the authenticated vendor
export const getVendorNotifications = async (req, res) => {
  try {
    const vendorId = req.user?.userId;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { type, unreadOnly, limit = 50, page = 1 } = req.query;

    const query = { recipientRole: "vendor", user: vendorId };

    if (type && type !== "all" && type !== "unread") {
      if (type === "orders" || type === "order") {
        query.type = { $in: ["orders", "order"] };
      } else if (type === "returns" || type === "return") {
        query.type = { $in: ["returns", "return"] };
      } else if (type === "reviews" || type === "review") {
        query.type = { $in: ["reviews", "review"] };
      } else if (type === "stock" || type === "stocks") {
        query.type = { $in: ["stock", "stocks"] };
      } else if (type === "account") {
        query.type = "account";
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
      Notification.countDocuments({ recipientRole: "vendor", user: vendorId, read: false }),
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
    console.error("[Get Vendor Notifications Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendor notifications",
    });
  }
};

// Get unread notification count for Vendor
export const getVendorUnreadCount = async (req, res) => {
  try {
    const vendorId = req.user?.userId;
    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const count = await Notification.countDocuments({
      recipientRole: "vendor",
      user: vendorId,
      read: false,
    });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("[Get Vendor Unread Count Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get vendor unread count",
    });
  }
};

// Mark single notification as read
export const markVendorNotificationAsRead = async (req, res) => {
  try {
    const vendorId = req.user?.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientRole: "vendor", user: vendorId },
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
    console.error("[Mark Vendor Notification Read Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
};

// Mark all vendor notifications as read
export const markAllVendorNotificationsAsRead = async (req, res) => {
  try {
    const vendorId = req.user?.userId;

    await Notification.updateMany(
      { recipientRole: "vendor", user: vendorId, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: "All vendor notifications marked as read",
    });
  } catch (error) {
    console.error("[Mark All Vendor Read Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all as read",
    });
  }
};

// Delete single vendor notification
export const deleteVendorNotification = async (req, res) => {
  try {
    const vendorId = req.user?.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipientRole: "vendor",
      user: vendorId,
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
    console.error("[Delete Vendor Notification Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};

// Clear all vendor notifications
export const clearAllVendorNotifications = async (req, res) => {
  try {
    const vendorId = req.user?.userId;

    await Notification.deleteMany({
      recipientRole: "vendor",
      user: vendorId,
    });

    res.status(200).json({
      success: true,
      message: "All notifications cleared",
    });
  } catch (error) {
    console.error("[Clear All Vendor Notifications Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear notifications",
    });
  }
};
