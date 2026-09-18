import User from "../models/user.js";
import { hashPassword, doHashValidation, hmacProcess } from "../utils/hash.js";
import { verificationEmailTemplate } from "../utils/verificationEmailTemplate.js";
import { forgotPasswordEmailTemplate } from "../utils/forgotPasswordEmailTemplate.js";
import jwt from "jsonwebtoken";
import { getNextSequence } from "../utils/counterHelper.js";
import { createNotification } from "../utils/notificationHelper.js";

import {
  signupSchema,
  acceptCodeSchema,
  signinSchema,
  changePasswordSchema,
  acceptFPCodeSchema,
} from "../middlewares/validator.js";

import transport from "../middlewares/sendMail.js";

// SIGN UP Users only, no admin creation
export const signUp = async (req, res) => {
  console.log("Signup request received");
  const { username, email, password } = req.body;

  try {
    const { error } = signupSchema.validate({
      username,
      email,
      password,
    });
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res
        .status(409)
        .json({ success: false, message: "Email is already registered." });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res
        .status(409)
        .json({ success: false, message: "Username is already taken." });
    }

    const hashedPassword = await hashPassword(password, 12);

    // Generate verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    console.log("OTP generated");
    console.log(
      `[Signup Flow] Generated verification code ${verificationCode} for user ${email}`
    );

    let isEmailSimulated = false;
    try {
      console.log("Sending email...");
      let info = await transport.sendMail({
        from: `"SwagSync" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
        to: email,
        subject: "Verify Your Email",
        html: verificationEmailTemplate(verificationCode, username),
      });

      console.log("Email sent successfully or fallback activated:", info);
      if (info.simulated) {
        isEmailSimulated = true;
      }

      if (!info.accepted || info.accepted.length === 0) {
        throw new Error(
          `Email address ${email} was not accepted by the mail server.`
        );
      }
    } catch (mailError) {
      console.error("[Signup Flow] Email delivery failed:", mailError);
      return res.status(400).json({
        success: false,
        message: `Failed to send verification email: ${
          mailError.message || mailError
        }`,
      });
    }

    const hashedCodeValue = hmacProcess(
      verificationCode,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );

    // Normal user signup never admin
    const newUser = new User({
      email,
      password: hashedPassword,
      username,
      isAdmin: false,
      verificationCode: hashedCodeValue,
      verificationCodeValidation: Date.now(),
    });

    try {
      const seq = await getNextSequence('customerId');
      newUser.customerId = `CUST-${seq}`;
    } catch (seqError) {
      console.error("Failed to generate customerId", seqError);
    }

    const result = await newUser.save();
    result.password = undefined;

    console.log("Sending success response to frontend");
    res.status(201).json({
      success: true,
      message: isEmailSimulated
        ? "Account created! Render Free Tier blocks outbound SMTP, so your OTP code has been auto-provided."
        : "Your account has been created successfully. A verification code has been sent to your email.",
      verificationCode: isEmailSimulated ? verificationCode : undefined,
      result,
    });
  } catch (error) {
    console.error("[Signup Flow] Server error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// VERIFY EMAIL
export const verifyVerificationCode = async (req, res) => {
  const { email, codeProvided } = req.body;

  try {
    const { error, value } = acceptCodeSchema.validate({
      email,
      codeProvided,
    });
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email }).select(
      "+verificationCode +verificationCodeValidation"
    );
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists." });
    }

    if (existingUser.verified) {
      return res
        .status(400)
        .json({ success: false, message: "You are already verified." });
    }

    if (
      !existingUser.verificationCode ||
      !existingUser.verificationCodeValidation
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Something is wrong with the code!" });
    }

    if (Date.now() - existingUser.verificationCodeValidation > 3600000) {
      return res
        .status(400)
        .json({ success: false, message: "Verification code expired." });
    }

    const hashedCode = hmacProcess(
      codeProvided.toString(),
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );

    if (hashedCode === existingUser.verificationCode) {
      existingUser.verified = true;
      existingUser.verificationCode = undefined;
      existingUser.verificationCodeValidation = undefined;
      await existingUser.save();

      const token = jwt.sign(
        {
          userId: existingUser._id,
          email: existingUser.email,
          username: existingUser.username,
          verified: existingUser.verified,
          isAdmin: existingUser.isAdmin,
          profileImage: existingUser.profileImage,
          mobileNo: existingUser.mobileNo,
          dateOfBirth: existingUser.dateOfBirth,
          gender: existingUser.gender,
        },
        process.env.JWT_TOKEN_SECRET,
        { expiresIn: "8h" }
      );

      return res
        .status(200)
        .json({ success: true, message: "Email verified successfully.", token });
    }
    res
      .status(400)
      .json({ success: false, message: "Invalid verification code." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

// SIGN IN Normal users only
export const signIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { error } = signinSchema.validate({ email, password });
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email }).select("+password");
    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User does not exists." });
    }

    if (existingUser.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin accounts must use admin login.",
      });
    }

    if (!existingUser.verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before signing in.",
      });
    }

    const result = await doHashValidation(password, existingUser.password);
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials!" });
    }

    const token = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        username: existingUser.username,
        verified: existingUser.verified,
        isAdmin: existingUser.isAdmin,
        profileImage: existingUser.profileImage,
        mobileNo: existingUser.mobileNo,
        dateOfBirth: existingUser.dateOfBirth,
        gender: existingUser.gender,
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
        message: "Sign in successful.",
        token,
      });
  } catch (error) {
    console.error("[Signin] Server error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// SIGN OUT
export const signOut = async (req, res) => {
  console.log("SignOut success...");
  res
    .clearCookie("Authorization")
    .status(200)
    .json({ success: true, message: "Logged out successfully." });
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  const { userId, verified } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    const { error, value } = changePasswordSchema.validate({
      oldPassword,
      newPassword,
    });

    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    if (!verified) {
      return res
        .status(401)
        .json({ success: false, message: "You are not verified user!" });
    }

    const existingUser = await User.findOne({ _id: userId }).select(
      "+password"
    );

    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User does not exists!" });
    }

    const result = await doHashValidation(oldPassword, existingUser.password);
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials!" });
    }

    const hashedPassword = await hashPassword(newPassword, 12);
    existingUser.password = hashedPassword;

    await existingUser.save();

    createNotification({
      userId,
      type: "account",
      title: "Password Changed Successfully",
      message: "Your account password was updated. If you did not perform this change, please contact support or reset your password immediately.",
      link: "/account/profile",
      linkText: "Account Security",
      iconType: "security",
      color: "rose",
    });

    return res
      .status(200)
      .json({ success: true, message: "Password updated!!" });
  } catch (error) {
    console.error("[Change Password] Server error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// FORGOT PASSWORD SEND CODE
export const sendForgotPasswordCode = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists!" });
    }

    const codeValue = Math.floor(Math.random() * 1000000).toString();
    let info = await transport.sendMail({
      from: `"SwagSync" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
      to: existingUser.email,
      subject: "Forgot password code",
      html: forgotPasswordEmailTemplate(codeValue, existingUser.username),
    });

    if (info.accepted && info.accepted.length > 0) {
      const hashedCodeValue = hmacProcess(
        codeValue,
        process.env.HMAC_VERIFICATION_CODE_SECRET
      );
      existingUser.forgotPasswordCode = hashedCodeValue;
      existingUser.forgotPasswordCodeValidation = Date.now();
      await existingUser.save();
      return res.status(200).json({
        success: true,
        message: info.simulated
          ? "Forgot password code generated (Render Free Tier blocks SMTP, code provided)."
          : "Forgot password code sent!",
        code: info.simulated ? codeValue : undefined,
      });
    }
    res.status(400).json({ success: false, message: "Code sent failed!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// VERIFY FORGOT PASSWORD CODE
export const verifyForgotPasswordCode = async (req, res) => {
  const { email, providedCode, newPassword } = req.body;
  try {
    const { error, value } = acceptFPCodeSchema.validate({
      email,
      providedCode,
      newPassword,
    });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({ email }).select(
      "+forgotPasswordCode +forgotPasswordCodeValidation"
    );

    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: "User does not exists!" });
    }

    if (
      !existingUser.forgotPasswordCode ||
      !existingUser.forgotPasswordCodeValidation
    ) {
      return res.status(400).json({
        success: false,
        message: "No forgot password code found. Request a new code first.",
      });
    }

    if (
      Date.now() - existingUser.forgotPasswordCodeValidation >
      5 * 60 * 1000
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Code has been expired!" });
    }

    const hashedCodeValue = hmacProcess(
      codeValue,
      process.env.HMAC_VERIFICATION_CODE_SECRET
    );

    if (hashedCodeValue === existingUser.forgotPasswordCode) {
      const hashedPassword = await hashPassword(newPassword, 12);
      existingUser.password = hashedPassword;
      existingUser.forgotPasswordCode = undefined;
      existingUser.forgotPasswordCodeValidation = undefined;
      await existingUser.save();

      return res
        .status(200)
        .json({ success: true, message: "Password updated!!" });
    }
    return res.status(400).json({ success: false, message: "Invalid code!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

