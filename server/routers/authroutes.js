import express from "express";
import {
  signIn,
  signUp,
  verifyVerificationCode,
  signOut,
  changePassword,
  sendForgotPasswordCode,
  verifyForgotPasswordCode,
  // getByName,
} from "../controllers/authController.js";

import { identifier } from "../middlewares/identification.js";
import { authLimiter, otpTriggerLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Public routes with rate limiting
router.post("/signup", authLimiter, signUp);
router.patch("/verify-verification-code", authLimiter, verifyVerificationCode);
router.post("/signin", authLimiter, signIn);
router.post("/signout", signOut);
router.patch("/send-forgot-password-code", otpTriggerLimiter, sendForgotPasswordCode);
router.patch("/verify-forgot-password-code", authLimiter, verifyForgotPasswordCode);

// Protected routes
router.patch("/change-password", identifier, changePassword);
// router.get("/get-by-name/:username", identifier, getByName);

import multer from "multer";
import { updateProfilePhoto, removeProfilePhoto, updateProfileInfo } from "../controllers/userController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png, .webp formats allowed"), false);
    }
  },
});

router.patch("/profile-photo", identifier, upload.single("image"), updateProfilePhoto);
router.delete("/profile-photo", identifier, removeProfilePhoto);
router.patch("/profile-info", identifier, updateProfileInfo);

export default router;
