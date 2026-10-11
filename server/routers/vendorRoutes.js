import express from "express";
import multer from "multer";
import {
  vendorRegister,
  verifyVendorEmail,
  resendVendorOtp,
  vendorLogin,
  getVendorProfile,
  uploadVendorDocument,
  sendVendorForgotPasswordCode,
  verifyVendorForgotPasswordCode,
  changeVendorPassword,
} from "../controllers/vendorAuthController.js";
import { identifier } from "../middlewares/identification.js";
import { isApprovedVendor } from "../middlewares/isApprovedVendor.js";
import { authLimiter, otpTriggerLimiter } from "../middlewares/rateLimiter.js";

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

// Public Vendor Routes with Rate Limiting
router.post("/register", authLimiter, vendorRegister);
router.patch("/verify-email", authLimiter, verifyVendorEmail);
router.post("/verify-email", authLimiter, verifyVendorEmail);
router.post("/resend-otp", otpTriggerLimiter, resendVendorOtp);
router.post("/login", authLimiter, vendorLogin);
router.post("/upload-document", upload.single("document"), uploadVendorDocument);
router.post("/send-forgot-password-code", otpTriggerLimiter, sendVendorForgotPasswordCode);
router.patch("/verify-forgot-password-code", authLimiter, verifyVendorForgotPasswordCode);
router.post("/verify-forgot-password-code", authLimiter, verifyVendorForgotPasswordCode);

// Protected Vendor Portal Routes (Phase 1: Profile & Access validation)
router.get("/me", identifier, isApprovedVendor, getVendorProfile);
router.patch("/change-password", identifier, isApprovedVendor, changeVendorPassword);
router.post("/change-password", identifier, isApprovedVendor, changeVendorPassword);

export default router;
