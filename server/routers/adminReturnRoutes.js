import express from "express";
import {
  getAllReturnRequestsAdmin,
  getReturnRequestByIdAdmin,
  updateReturnRequestStatusAdmin,
  processRazorpayRefundAdmin,
} from "../controllers/returnRequestController.js";
import { identifier } from "../middlewares/identification.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

router.get("/", identifier, isAdmin, getAllReturnRequestsAdmin);
router.get("/:id", identifier, isAdmin, getReturnRequestByIdAdmin);
router.put("/:id", identifier, isAdmin, updateReturnRequestStatusAdmin);
router.post("/:id/refund-razorpay", identifier, isAdmin, processRazorpayRefundAdmin);

export default router;
