import User from "../models/user.js";
import Order from "../models/order.js";
import ReturnRequest from "../models/returnRequest.js";
import Ticket from "../models/ticket.js";
import Address from "../models/address.js";
import ProductReview from "../models/productReview.js";
import { hmacProcess } from "../utils/hash.js";
import { verificationEmailTemplate } from "../utils/verificationEmailTemplate.js";
import transport from "../middlewares/sendMail.js";
import { createNotification } from "../utils/notificationHelper.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("[Get All Users] Server error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const makeAdmin = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (user.isAdmin) {
      return res
        .status(400)
        .json({ success: false, message: "User is already an admin." });
    }

    user.isAdmin = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: `${user.username} is now an admin.`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("[Make Admin] Server error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const removeAdmin = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (!user.isAdmin) {
      return res
        .status(400)
        .json({ success: false, message: "User is not an admin." });
    }

    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot remove your own admin rights.",
      });
    }

    user.isAdmin = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: `${user.username} is no longer an admin.`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("[Remove Admin] Server error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("[Delete User] Server error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
      user,
    });
  } catch (error) {
    console.error("[Toggle User Status] Server error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

import { v2 as cloudinary } from "cloudinary";

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

export const updateProfilePhoto = async (req, res) => {
  try {
    const { userId } = req.user;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image provided" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    configureCloudinary();

    // If user already has a profile image, delete it from cloudinary
    if (user.profileImage && user.profileImage.publicId) {
      await cloudinary.uploader.destroy(user.profileImage.publicId);
    }

    // Upload new image
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "swagsync-users",
      resource_type: "image",
    });

    user.profileImage = {
      url: result.secure_url,
      publicId: result.public_id,
    };
    await user.save();

    createNotification({
      userId,
      type: "account",
      title: "Profile Photo Updated",
      message: "Your profile photo has been successfully updated.",
      link: "/account/profile",
      linkText: "View Profile",
      iconType: "account",
      color: "blue",
    });

    res.status(200).json({
      success: true,
      message: "Profile photo updated successfully",
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error("[Update Profile Photo] Server error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const removeProfilePhoto = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.profileImage && user.profileImage.publicId) {
      configureCloudinary();
      await cloudinary.uploader.destroy(user.profileImage.publicId);
      user.profileImage = undefined;
      await user.save();

      createNotification({
        userId,
        type: "account",
        title: "Profile Photo Removed",
        message: "Your profile photo has been removed.",
        link: "/account/profile",
        linkText: "View Profile",
        iconType: "account",
        color: "slate",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile photo removed successfully",
    });
  } catch (error) {
    console.error("[Remove Profile Photo] Server error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

import jwt from "jsonwebtoken";

export const updateProfileInfo = async (req, res) => {
  try {
    const { userId } = req.user;
    const { username, email, mobileNo, dateOfBirth, gender } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let emailChanged = false;

    // Handle email change
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      try {
        let info = await transport.sendMail({
          from: `"SwagSync" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
          to: email,
          subject: "Verify Your New Email",
          html: verificationEmailTemplate(verificationCode, username || user.username),
        });

        if (!info.accepted || info.accepted.length === 0) {
          throw new Error("Email was not accepted");
        }
      } catch (mailError) {
        console.error("[Email Change Flow] Email delivery failed:", mailError);
        return res.status(400).json({
          success: false,
          message: "Failed to send verification email.",
        });
      }

      const hashedCodeValue = hmacProcess(
        verificationCode,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );

      user.email = email;
      user.verified = false;
      user.verificationCode = hashedCodeValue;
      user.verificationCodeValidation = Date.now();
      emailChanged = true;
    }

    // Optional: check if username is already taken by another user
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Username already taken" });
      }
      user.username = username;
    }

    if (mobileNo !== undefined) user.mobileNo = mobileNo;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (gender !== undefined) user.gender = gender;

    await user.save();

    createNotification({
      userId,
      type: "account",
      title: "Profile Information Updated",
      message: emailChanged
        ? "Your profile was updated. A verification email was sent to your new address."
        : "Your profile details have been successfully updated.",
      link: "/account/profile",
      linkText: "View Profile",
      iconType: "account",
      color: "blue",
    });

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        username: user.username,
        verified: user.verified,
        isAdmin: user.isAdmin,
        profileImage: user.profileImage,
        mobileNo: user.mobileNo,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
      },
      process.env.JWT_TOKEN_SECRET,
      { expiresIn: "8h" }
    );

    res.status(200).json({
      success: true,
      message: emailChanged ? "Profile updated. Please verify your new email." : "Profile updated successfully",
      emailChanged,
      token,
      user: {
        username: user.username,
        email: user.email,
        verified: user.verified,
        mobileNo: user.mobileNo,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
      }
    });
  } catch (error) {
    console.error("[Update Profile Info] Server error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Parallel fetch for user's related data
    const [orders, returns, tickets, reviews, addresses] = await Promise.all([
      Order.find({ user: id })
        .populate("items.product", "name images price category")
        .sort({ createdAt: -1 })
        .lean(),
      ReturnRequest.find({ user: id })
        .populate("product", "name images price")
        .populate("order", "orderId totalAmount createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      Ticket.find({ user: id })
        .sort({ createdAt: -1 })
        .lean(),
      ProductReview.find({ user: id })
        .populate("product", "name images")
        .sort({ createdAt: -1 })
        .lean(),
      Address.find({ userId: id })
        .sort({ isDefault: -1, createdAt: -1 })
        .lean(),
    ]);

    // Calculate real stats
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => {
      if (order.status !== "cancelled") {
        return sum + (Number(order.totalAmount) || 0);
      }
      return sum;
    }, 0);
    const totalReturns = returns.length;
    const totalTickets = tickets.length;
    const totalReviews = reviews.length;

    res.status(200).json({
      success: true,
      user,
      orders,
      returns,
      tickets,
      reviews,
      addresses,
      stats: {
        totalOrders,
        totalSpent,
        totalReturns,
        totalTickets,
        totalReviews,
      },
    });
  } catch (error) {
    console.error("[Get User Details] Server error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

