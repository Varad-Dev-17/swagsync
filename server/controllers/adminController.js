import Admin from "../models/admin.js";
import User from "../models/user.js";
import { hashPassword } from "../utils/hash.js";
import jwt from "jsonwebtoken";

// ADMIN CREDENTIALS
const ADMIN_EMAIL = "varadmule17@gmail.com";
const ADMIN_PASSWORD = "P@ssword17";

// ADMIN AUTH
export const adminSignIn = async (req, res) => {
  console.log("Admin signin route called");
  const { email, password } = req.body;

  try {
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    let adminUser = await Admin.findOne({ email: ADMIN_EMAIL });

    if (!adminUser) {
      // Check if existing admin user exists in User collection to migrate password
      const existingUserAdmin = await User.findOne({ email: ADMIN_EMAIL });
      const passwordToUse = existingUserAdmin ? existingUserAdmin.password : await hashPassword(ADMIN_PASSWORD, 12);

      adminUser = new Admin({
        username: existingUserAdmin?.username || "admin",
        email: ADMIN_EMAIL,
        password: passwordToUse,
        isAdmin: true,
        role: "admin",
      });
      await adminUser.save();
      console.log("Admin created in admins collection...");
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
