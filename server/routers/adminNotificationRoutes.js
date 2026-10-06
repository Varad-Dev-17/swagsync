import express from "express";
import { identifier } from "../middlewares/identification.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import {
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  deleteAdminNotification,
  clearAllAdminNotifications,
} from "../controllers/adminNotificationController.js";

const router = express.Router();

router.use(identifier, isAdmin);

router.get("/", getAdminNotifications);
router.get("/unread-count", getAdminUnreadCount);
router.patch("/mark-all-read", markAllAdminNotificationsAsRead);
router.patch("/:id/read", markAdminNotificationAsRead);
router.delete("/clear-all", clearAllAdminNotifications);
router.delete("/:id", deleteAdminNotification);

export default router;
