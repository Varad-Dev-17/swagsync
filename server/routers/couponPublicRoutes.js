import express from "express";
import {
  getActiveCoupons,
  validateCoupon,
} from "../controllers/couponController.js";

const router = express.Router();

router.get("/", getActiveCoupons);
router.get("/active", getActiveCoupons);
router.post("/validate", validateCoupon);

export default router;
