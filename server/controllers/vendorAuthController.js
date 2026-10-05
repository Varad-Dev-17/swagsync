import Vendor from "../models/vendor.js";
import User from "../models/user.js";
import { hashPassword, doHashValidation, hmacProcess } from "../utils/hash.js";
import { verificationEmailTemplate } from "../utils/verificationEmailTemplate.js";
import { forgotPasswordEmailTemplate } from "../utils/forgotPasswordEmailTemplate.js";
import { getNextSequence } from "../utils/counterHelper.js";
import transport from "../middlewares/sendMail.js";
import jwt from "jsonwebtoken";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import {
  vendorRegisterSchema,
  vendorSigninSchema,
  acceptCodeSchema,
} from "../middlewares/validator.js";

// Helper: Cloudinary document upload
const uploadDocumentToCloudinary = async (buffer, mimetype, originalname) => {
  let optimizedBuffer = buffer;
  let optimizedMimetype = mimetype;

  if (mimetype.startsWith("image/")) {
    try {
      optimizedBuffer = await sharp(buffer)
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      optimizedMimetype = "image/webp";
    } catch (err) {
      console.error("[Document Upload] Sharp error, using original buffer:", err);
    }
  }

  return new Promise((resolve, reject) => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const b64 = Buffer.from(optimizedBuffer).toString("base64");
    const dataURI = "data:" + optimizedMimetype + ";base64," + b64;

    cloudinary.uploader.upload(
      dataURI,
      {
        folder: "swagsync-vendor-documents",
        resource_type: "auto",
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};

/**
 * Upload single business document
 */
export const uploadVendorDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No document file provided.",
      });
    }

    const result = await uploadDocumentToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    return res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        name: req.file.originalname,
        fileType: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error("[Vendor Document Upload] Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload document",
    });
  }
};

/**
 * 1. Register Vendor
 * Collects Personal, Store, Address, Business, Bank, and Documents.
 * Dispatches Email Verification OTP.
 * Sets emailVerified = false, vendorStatus = PENDING.
 */
export const vendorRegister = async (req, res) => {
  try {
    const { error, value } = vendorRegisterSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const {
      fullName,
      email,
      phone,
      password,
      storeName,
      storeDescription,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      pincode,
      businessName,
      businessType,
      gstNumber,
      panNumber,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      manufacturerName,
      countryOfOrigin,
      manufacturerAddress,
      packer,
      packerPhone,
      packerAddress,
      documents,
    } = value;

    const normalizedEmail = email.toLowerCase().trim();

    const resolvedMfgAddress =
      manufacturerAddress ||
      [addressLine1, addressLine2, city, state, pincode, country || "India"]
        .filter(Boolean)
        .join(", ");

    const mfgProfile = {
      manufacturerName: manufacturerName || storeName || fullName || "Primary Manufacturer",
      countryOfOrigin: countryOfOrigin || "India",
      manufacturerAddress: resolvedMfgAddress,
      packer: packer || storeName || fullName || "Primary Packer",
      packerPhone: packerPhone || phone || "",
      packerAddress: packerAddress || resolvedMfgAddress,
      isDefault: true,
    };

    const storeEntry = {
      storeName,
      storeDescription: storeDescription || "",
      phone,
      addressLine1,
      addressLine2: addressLine2 || "",
      city,
      state,
      country: country || "India",
      pincode,
      isDefault: true,
    };

    // Check if email already exists in Vendor or User table
    const existingVendor = await Vendor.findOne({ email: normalizedEmail });
    if (existingVendor) {
      if (existingVendor.verified || existingVendor.emailVerified) {
        return res.status(409).json({
          success: false,
          message: "An account with this email address is already registered as a vendor.",
        });
      }

      // If exists as unverified vendor, update record and resend verification
      if (!existingVendor.emailVerified) {
        const hashedPassword = await hashPassword(password, 12);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCodeValue = hmacProcess(
          verificationCode,
          process.env.HMAC_VERIFICATION_CODE_SECRET
        );

        existingVendor.password = hashedPassword;
        existingVendor.mobileNo = phone;
        existingVendor.verificationCode = hashedCodeValue;
        existingVendor.verificationCodeValidation = Date.now();
        existingVendor.vendorStatus = "PENDING";
        existingVendor.vendorProfile = {
          fullName,
          phone,
          storeName,
          storeDescription,
          storeAddress: {
            addressLine1,
            addressLine2: addressLine2 || "",
            city,
            state,
            country: country || "India",
            pincode,
          },
          stores: [storeEntry],
          manufacturers: [mfgProfile],
          manufacturerDetails: mfgProfile,
          businessDetails: {
            businessName,
            businessType,
            gstNumber: gstNumber || "",
            panNumber: panNumber || "",
          },
          bankDetails: {
            accountHolderName,
            bankName,
            accountNumber,
            ifscCode: ifscCode.toUpperCase(),
          },
          documents: documents || [],
        };

        await existingVendor.save();

        console.log(`[Vendor Registration] Generated OTP ${verificationCode} for ${normalizedEmail}`);

        try {
          await transport.sendMail({
            from: `"SwagSync" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
            to: normalizedEmail,
            subject: "Verify Your SwagSync Vendor Email",
            html: verificationEmailTemplate(verificationCode, fullName || storeName),
          });
        } catch (mailErr) {
          console.error("[Vendor Registration] Email delivery failed:", mailErr);
          return res.status(400).json({
            success: false,
            message: `Failed to dispatch verification email: ${mailErr.message || mailErr}`,
          });
        }

        return res.status(200).json({
          success: true,
          message: "Registration updated! A verification code has been sent to your email address.",
          email: normalizedEmail,
        });
      }

      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    // Also check if email is registered as customer
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.verified) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address is already registered.",
      });
    }

    // Generate unique username
    let baseUsername = (storeName || fullName)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 20);
    if (baseUsername.length < 3) baseUsername = "vendor_" + baseUsername;

    let uniqueUsername = baseUsername;
    let usernameExists = await Vendor.findOne({ username: uniqueUsername });
    while (usernameExists) {
      uniqueUsername = `${baseUsername}${Math.floor(100 + Math.random() * 900)}`;
      usernameExists = await Vendor.findOne({ username: uniqueUsername });
    }

    // Hash password
    const hashedPassword = await hashPassword(password, 12);

    // Generate 6-digit OTP
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[Vendor Registration] Generated OTP ${verificationCode} for ${normalizedEmail}`);

    const hashedCodeValue = hmacProcess(
      verificationCode,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );

    // Get next sequential vendorId
    let vendorId = `VEND-${Date.now().toString().slice(-6)}`;
    try {
      const seq = await getNextSequence("vendorId");
      vendorId = `VEND-${seq}`;
    } catch (seqError) {
      console.error("Failed to generate sequential vendorId:", seqError);
    }

    // Dispatch verification email
    try {
      await transport.sendMail({
        from: `"SwagSync" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
        to: normalizedEmail,
        subject: "Verify Your SwagSync Vendor Email",
        html: verificationEmailTemplate(verificationCode, fullName || storeName),
      });
    } catch (mailErr) {
      console.error("[Vendor Registration] Email delivery failed:", mailErr);
      return res.status(400).json({
        success: false,
        message: `Failed to dispatch verification email: ${mailErr.message || mailErr}`,
      });
    }

    // Save to dedicated vendors collection
    const newVendor = new Vendor({
      vendorId,
      username: uniqueUsername,
      email: normalizedEmail,
      password: hashedPassword,
      mobileNo: phone,
      role: "vendor",
      verified: false,
      emailVerified: false,
      vendorStatus: "PENDING",
      verificationCode: hashedCodeValue,
      verificationCodeValidation: Date.now(),
      isAdmin: false,
      isBlocked: false,
      vendorProfile: {
        fullName,
        phone,
        storeName,
        storeDescription: storeDescription || "",
        storeAddress: {
          addressLine1,
          addressLine2: addressLine2 || "",
          city,
          state,
          country: country || "India",
          pincode,
        },
        stores: [storeEntry],
        manufacturers: [mfgProfile],
        manufacturerDetails: mfgProfile,
        businessDetails: {
          businessName,
          businessType,
          gstNumber: gstNumber || "",
          panNumber: panNumber || "",
        },
        bankDetails: {
          accountHolderName,
          bankName,
          accountNumber,
          ifscCode: ifscCode.toUpperCase(),
        },
        documents: documents || [],
      },
    });

    await newVendor.save();

    return res.status(201).json({
      success: true,
      message: "Registration submitted successfully! A verification code has been sent to your email.",
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("[Vendor Registration] Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during vendor registration.",
    });
  }
};

/**
 * 2. Verify Vendor Email (OTP Verification)
 * Validates OTP code.
 * Upon success: emailVerified = true, verified = true, vendorStatus = PENDING.
 * DOES NOT grant vendor portal access (must wait for Admin approval).
 */
export const verifyVendorEmail = async (req, res) => {
  try {
    const email = req.body?.email;
    const rawCode = req.body?.codeProvided ?? req.body?.otp ?? req.body?.code;

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    if (!rawCode) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required.",
      });
    }

    const codeProvided = String(rawCode).trim();
    if (!/^\d{6}$/.test(codeProvided)) {
      return res.status(400).json({
        success: false,
        message: "Verification code must be exactly 6 digits.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const vendor = await Vendor.findOne({ email: normalizedEmail }).select(
      "+verificationCode +verificationCodeValidation"
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor account not found with this email.",
      });
    }

    if (vendor.role !== "vendor") {
      return res.status(400).json({
        success: false,
        message: "This account is not a vendor account.",
      });
    }

    if (vendor.emailVerified && vendor.verified) {
      return res.status(200).json({
        success: true,
        message: "Your email has already been verified! Awaiting Admin approval.",
        emailVerified: true,
        vendorStatus: vendor.vendorStatus || "PENDING",
      });
    }

    if (!vendor.verificationCode || !vendor.verificationCodeValidation) {
      return res.status(400).json({
        success: false,
        message: "No pending verification code found. Please click 'Resend Code'.",
      });
    }

    // Code validity: 1 hour (3600000ms)
    if (Date.now() - vendor.verificationCodeValidation > 3600000) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please click 'Resend Code'.",
      });
    }

    const hashedCode = hmacProcess(
      codeProvided,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );

    if (hashedCode !== vendor.verificationCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please check your code and try again.",
      });
    }

    // Verification successful -> vendorStatus remains PENDING awaiting admin approval
    vendor.verified = true;
    vendor.emailVerified = true;
    vendor.vendorStatus = "PENDING";
    vendor.verificationCode = undefined;
    vendor.verificationCodeValidation = undefined;

    await vendor.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully! Your vendor account is now awaiting Admin approval.",
      vendorStatus: "PENDING",
      emailVerified: true,
    });
  } catch (error) {
    console.error("[Verify Vendor Email] Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during email verification.",
    });
  }
};

/**
 * 3. Resend OTP for Vendor Email Verification
 */
export const resendVendorOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const vendor = await Vendor.findOne({ email: normalizedEmail }).select(
      "+verificationCode +verificationCodeValidation"
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor account not found.",
      });
    }

    if (vendor.role !== "vendor") {
      return res.status(400).json({
        success: false,
        message: "This account is not a vendor account.",
      });
    }

    if (vendor.emailVerified && vendor.verified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified.",
      });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[Resend OTP] Generated OTP ${verificationCode} for ${normalizedEmail}`);

    const hashedCodeValue = hmacProcess(
      verificationCode,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );

    vendor.verificationCode = hashedCodeValue;
    vendor.verificationCodeValidation = Date.now();
    await vendor.save();

    try {
      await transport.sendMail({
        from: `"SwagSync" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
        to: normalizedEmail,
        subject: "Verify Your SwagSync Vendor Email (Resent)",
        html: verificationEmailTemplate(
          verificationCode,
          vendor.vendorProfile?.fullName || vendor.username
        ),
      });
    } catch (mailErr) {
      console.error("[Resend OTP] Email failed:", mailErr);
      return res.status(400).json({
        success: false,
        message: "Failed to dispatch verification email.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "A new verification code has been dispatched to your email address.",
    });
  } catch (error) {
    console.error("[Resend OTP] Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while resending OTP.",
    });
  }
};

/**
 * 4. Vendor Login
 * Requires: role === vendor, emailVerified === true, vendorStatus === APPROVED.
 * Blocks PENDING, SUSPENDED, and REJECTED accounts.
 */
export const vendorLogin = async (req, res) => {
  try {
    const { error } = vendorSigninSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const vendor = await Vendor.findOne({ email: normalizedEmail }).select("+password");

    if (!vendor) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    // Check Email Verification
    if (!vendor.emailVerified && !vendor.verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address before logging in.",
        needsVerification: true,
        email: normalizedEmail,
      });
    }

    // Check Password
    const passwordMatch = await doHashValidation(password, vendor.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    // Check Vendor Status
    if (vendor.vendorStatus === "PENDING") {
      return res.status(403).json({
        success: false,
        message: "Your Vendor account is awaiting Admin approval.",
        vendorStatus: "PENDING",
      });
    }

    if (vendor.vendorStatus === "SUSPENDED") {
      return res.status(403).json({
        success: false,
        message: "Your Vendor account has been suspended. Please contact support.",
        vendorStatus: "SUSPENDED",
      });
    }

    if (vendor.vendorStatus === "REJECTED") {
      return res.status(403).json({
        success: false,
        message: "Your Vendor application has been rejected.",
        vendorStatus: "REJECTED",
      });
    }

    if (vendor.vendorStatus !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message: "Your Vendor account is not approved to access the vendor portal.",
        vendorStatus: vendor.vendorStatus,
      });
    }

    // Authenticated Approved Vendor -> Issue Token
    const token = jwt.sign(
      {
        userId: vendor._id,
        email: vendor.email,
        username: vendor.username,
        verified: vendor.verified,
        emailVerified: vendor.emailVerified,
        isAdmin: false,
        role: "vendor",
        vendorStatus: "APPROVED",
        vendorId: vendor.vendorId,
        storeName: vendor.vendorProfile?.storeName,
        fullName: vendor.vendorProfile?.fullName,
      },
      process.env.JWT_TOKEN_SECRET,
      { expiresIn: "8h" }
    );

    res.cookie("Authorization", "Bearer " + token, {
      expires: new Date(Date.now() + 8 * 3600000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      success: true,
      message: "Vendor login successful.",
      token,
      vendor: {
        id: vendor._id,
        vendorId: vendor.vendorId,
        email: vendor.email,
        username: vendor.username,
        role: "vendor",
        vendorStatus: "APPROVED",
        storeName: vendor.vendorProfile?.storeName,
        fullName: vendor.vendorProfile?.fullName,
      },
    });
  } catch (error) {
    console.error("[Vendor Login] Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during vendor login.",
    });
  }
};

/**
 * 5. Get Current Vendor Profile
 * Protected by identifier and isApprovedVendor.
 */
export const getVendorProfile = async (req, res) => {
  try {
    const vendor = req.vendor;
    return res.status(200).json({
      success: true,
      vendor: {
        id: vendor._id,
        vendorId: vendor.vendorId,
        email: vendor.email,
        username: vendor.username,
        role: vendor.role,
        vendorStatus: vendor.vendorStatus,
        emailVerified: vendor.emailVerified,
        vendorProfile: vendor.vendorProfile,
        createdAt: vendor.createdAt,
      },
    });
  } catch (error) {
    console.error("[Get Vendor Profile] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching vendor profile.",
    });
  }
};

/**
 * 6. Send Vendor Forgot Password OTP Code
 */
export const sendVendorForgotPasswordCode = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const vendor = await Vendor.findOne({ email: normalizedEmail });
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor account does not exist with this email." });
    }

    const codeValue = Math.floor(100000 + Math.random() * 900000).toString();
    const info = await transport.sendMail({
      from: `"SwagSync" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
      to: vendor.email,
      subject: "SwagSync Vendor - Password Reset Code",
      html: forgotPasswordEmailTemplate(codeValue, vendor.vendorProfile?.fullName || vendor.username),
    });

    const hashedCodeValue = hmacProcess(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );
    vendor.forgotPasswordCode = hashedCodeValue;
    vendor.forgotPasswordCodeValidation = Date.now();
    await vendor.save();

    return res.status(200).json({
      success: true,
      message: info?.simulated
        ? "Password reset code generated (Render Free Tier blocks SMTP, code provided)."
        : "Password reset code sent to your email!",
      code: info?.simulated ? codeValue : undefined,
    });
  } catch (error) {
    console.error("[Vendor Forgot Password] Error:", error);
    return res.status(500).json({ success: false, message: "Server error sending reset code." });
  }
};

/**
 * 7. Verify Vendor Forgot Password Code & Update Password
 */
export const verifyVendorForgotPasswordCode = async (req, res) => {
  const { email, providedCode, newPassword } = req.body;
  try {
    if (!email || !providedCode || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, reset code, and new password are required." });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const vendor = await Vendor.findOne({ email: normalizedEmail }).select(
      "+forgotPasswordCode +forgotPasswordCodeValidation"
    );

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor account not found." });
    }

    if (!vendor.forgotPasswordCode || !vendor.forgotPasswordCodeValidation) {
      return res.status(400).json({
        success: false,
        message: "No reset code found. Please request a new code.",
      });
    }

    if (Date.now() - vendor.forgotPasswordCodeValidation > 5 * 60 * 1000) {
      return res.status(400).json({ success: false, message: "Reset code has expired. Request a new one." });
    }

    const hashedCodeValue = hmacProcess(
      providedCode.toString().trim(),
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );

    if (hashedCodeValue !== vendor.forgotPasswordCode) {
      return res.status(400).json({ success: false, message: "Invalid reset code. Please check and try again." });
    }

    const hashedPassword = await hashPassword(newPassword, 12);
    vendor.password = hashedPassword;
    vendor.forgotPasswordCode = undefined;
    vendor.forgotPasswordCodeValidation = undefined;
    await vendor.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully! You can now log in with your new password.",
    });
  } catch (error) {
    console.error("[Vendor Verify FP Code] Error:", error);
    return res.status(500).json({ success: false, message: "Server error resetting password." });
  }
};

/**
 * 8. Change Vendor Password (Authenticated)
 */
export const changeVendorPassword = async (req, res) => {
  const vendorId = req.vendor?._id || req.user?.userId;
  const { oldPassword, newPassword } = req.body;

  try {
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
      });
    }

    const vendor = await Vendor.findById(vendorId).select("+password");
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor account not found.",
      });
    }

    const isMatch = await doHashValidation(oldPassword, vendor.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    vendor.password = await hashPassword(newPassword, 12);
    await vendor.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully!",
    });
  } catch (error) {
    console.error("[Change Vendor Password] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error changing password.",
    });
  }
};
