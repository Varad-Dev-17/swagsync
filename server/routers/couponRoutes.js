import express from "express";
import {
  getAllCoupons,
  getCouponById,
  validateCoupon,
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
} from "../controllers/couponController.js";
import { identifier } from "../middlewares/identification.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

// Admin routes
router.get("/", identifier, isAdmin, getAllCoupons);
router.get("/:id", identifier, isAdmin, getCouponById);
router.post("/", identifier, isAdmin, createCoupon);
router.put("/:id", identifier, isAdmin, updateCoupon);
router.patch("/:id/toggle-status", identifier, isAdmin, toggleCouponStatus);
router.delete("/:id", identifier, isAdmin, deleteCoupon);

// Also allow validating through admin route if needed
router.post("/validate", validateCoupon);

export default router;
