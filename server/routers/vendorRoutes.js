import express from "express";
import multer from "multer";
import {
  vendorRegister,
  verifyVendorEmail,
  resendVendorOtp,
  vendorLogin,
  getVendorProfile,
  uploadVendorDocument,
} from "../controllers/vendorAuthController.js";
import { identifier } from "../middlewares/identification.js";
import { isApprovedVendor } from "../middlewares/isApprovedVendor.js";

const router = express.Router();

// Multer memory storage for document uploads (Images and PDFs up to 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Only .jpg, .jpeg, .png, .webp, and .pdf formats allowed"),
        false
      );
    }
  },
});

// Public Vendor Routes
router.post("/register", vendorRegister);
router.patch("/verify-email", verifyVendorEmail);
router.post("/verify-email", verifyVendorEmail);
router.post("/resend-otp", resendVendorOtp);
router.post("/login", vendorLogin);
router.post("/upload-document", upload.single("document"), uploadVendorDocument);

// Protected Vendor Portal Routes (Phase 1: Profile & Access validation)
router.get("/me", identifier, isApprovedVendor, getVendorProfile);

export default router;
