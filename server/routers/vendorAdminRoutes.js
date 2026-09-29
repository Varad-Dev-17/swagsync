import express from "express";
import {
  getAllVendors,
  getVendorById,
  approveVendor,
  rejectVendor,
  suspendVendor,
  reactivateVendor,
} from "../controllers/vendorAdminController.js";
import { identifier } from "../middlewares/identification.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

// All Admin Vendor routes require authentication and Admin authorization
router.use(identifier, isAdmin);

router.get("/", getAllVendors);
router.get("/:id", getVendorById);
router.patch("/:id/approve", approveVendor);
router.patch("/:id/reject", rejectVendor);
router.patch("/:id/suspend", suspendVendor);
router.patch("/:id/reactivate", reactivateVendor);

export default router;
