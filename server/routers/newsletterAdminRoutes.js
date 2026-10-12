import express from "express";
import { getSubscribers, broadcastNewsletter } from "../controllers/newsletterController.js";
import {
  checkAndSendExpiringCouponAlerts,
  sendWeeklyNewArrivalsDigest,
  checkAndSendAbandonedCartAlerts,
} from "../cron/promoCron.js";
import { identifier } from "../middlewares/identification.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

router.get("/subscribers", identifier, isAdmin, getSubscribers);
router.post("/broadcast", identifier, isAdmin, broadcastNewsletter);

// Manual trigger for admin testing/instant execution
router.post("/trigger-automation", identifier, isAdmin, async (req, res) => {
  try {
    const { jobType } = req.body; // 'expiring_coupons' | 'new_arrivals' | 'abandoned_cart'
    let result = 0;

    if (jobType === "expiring_coupons") {
      result = await checkAndSendExpiringCouponAlerts();
    } else if (jobType === "new_arrivals") {
      result = await sendWeeklyNewArrivalsDigest();
    } else if (jobType === "abandoned_cart") {
      result = await checkAndSendAbandonedCartAlerts();
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid jobType. Allowed: 'expiring_coupons', 'new_arrivals', 'abandoned_cart'",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Triggered '${jobType}' automation successfully.`,
      result,
    });
  } catch (error) {
    console.error("Error triggering automation:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
