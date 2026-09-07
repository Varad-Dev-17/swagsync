import express from "express";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import sharp from "sharp";
import { identifier } from "../middlewares/identification.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

// Multer setup
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

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = async (buffer, mimetype, folder = "swagsync-products") => {
  let optimizedBuffer = buffer;
  let optimizedMimetype = mimetype;

  if (mimetype.startsWith("image/")) {
    try {
      optimizedBuffer = await sharp(buffer)
        .resize({ width: 1500, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      optimizedMimetype = "image/webp";
    } catch (err) {
      console.error("Sharp optimization failed, using original buffer:", err);
    }
  }

  return new Promise((resolve, reject) => {
    // Configure Cloudinary here to avoid ES module import hoisting issues with dotenv
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const b64 = Buffer.from(optimizedBuffer).toString("base64");
    const dataURI = "data:" + optimizedMimetype + ";base64," + b64;

    console.log({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecretLoaded: !!process.env.CLOUDINARY_API_SECRET,
    });

    cloudinary.uploader.upload(
      dataURI,
      { folder, resource_type: "image" },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};

// UPLOAD SINGLE IMAGE (Admin only)
router.post(
  "/image",
  identifier,
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image provided",
          data: null,
        });
      }

      const result = await uploadToCloudinary(
        req.file.buffer,
        req.file.mimetype
      );

      return res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({
        success: false,
        message: "Upload failed",
        data: null,
      });
    }
  }
);

// UPLOAD MULTIPLE IMAGES (Admin only, max 5)
router.post(
  "/multiple",
  identifier,
  isAdmin,
  upload.array("images", 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No images provided",
          data: null,
        });
      }

      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, file.mimetype)
      );

      const results = await Promise.all(uploadPromises);

      const images = results.map((result) => ({
        url: result.secure_url,
        publicId: result.public_id,
      }));

      return res.status(200).json({
        success: true,
        message: "Images uploaded successfully",
        data: images,
      });
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({
        success: false,
        message: "Upload failed",
        data: null,
      });
    }
  }
);

// UPLOAD MULTIPLE IMAGES (User, max 5)
router.post(
  "/user-multiple",
  identifier,
  upload.array("images", 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No images provided",
          data: null,
        });
      }

      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, file.mimetype, "swagsync-returns")
      );

      const results = await Promise.all(uploadPromises);

      const images = results.map((result) => ({
        url: result.secure_url,
        publicId: result.public_id,
      }));

      return res.status(200).json({
        success: true,
        message: "Images uploaded successfully",
        data: images,
      });
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({
        success: false,
        message: "Upload failed",
        data: null,
      });
    }
  }
);

// DELETE IMAGE (Admin only)
router.delete("/image", identifier, isAdmin, async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Public ID is required",
        data: null,
      });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok") {
      return res.status(400).json({
        success: false,
        message: "Failed to delete image",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({
      success: false,
      message: "Delete failed",
      data: null,
    });
  }
});

export default router;
