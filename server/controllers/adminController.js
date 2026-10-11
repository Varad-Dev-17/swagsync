import Admin from "../models/admin.js";
import User from "../models/user.js";
import { hashPassword } from "../utils/hash.js";
import jwt from "jsonwebtoken";

// ADMIN AUTH
export const adminSignIn = async (req, res) => {
  const { email, password } = req.body;

  const expectedAdminEmail = process.env.ADMIN_EMAIL;
  const expectedAdminPassword = process.env.ADMIN_PASSWORD;

  if (!expectedAdminEmail || !expectedAdminPassword) {
    console.error("[Security Alert] ADMIN_EMAIL or ADMIN_PASSWORD is not set in environment.");
    return res.status(500).json({
      success: false,
      message: "Admin authentication service unavailable. Contact system administrator.",
    });
  }

  try {
    if (
      !email ||
      !password ||
      email.trim().toLowerCase() !== expectedAdminEmail.trim().toLowerCase() ||
      password !== expectedAdminPassword
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    let adminUser = await Admin.findOne({ email: expectedAdminEmail });

    if (!adminUser) {
      // Check if existing admin user exists in User collection to migrate password
      const existingUserAdmin = await User.findOne({ email: expectedAdminEmail });
      const passwordToUse = existingUserAdmin ? existingUserAdmin.password : await hashPassword(expectedAdminPassword, 12);

      adminUser = new Admin({
        username: existingUserAdmin?.username || "admin",
        email: expectedAdminEmail,
        password: passwordToUse,
        isAdmin: true,
        role: "admin",
      });
      await adminUser.save();
    }

    const token = jwt.sign(
      {
        userId: adminUser._id,
        email: adminUser.email,
        username: adminUser.username,
        verified: true,
        isAdmin: true,
        role: "admin",
      },
      process.env.JWT_TOKEN_SECRET,
      { expiresIn: "8h" }
    );

    res
      .cookie("Authorization", "Bearer " + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      })
      .status(200)
      .json({
        success: true,
        message: "Admin sign in successful.",
        token,
      });
  } catch (error) {
    console.error("[Admin Signin] Server error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

