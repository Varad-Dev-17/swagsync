import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Coupon from "../server/models/coupon.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const REAL_COUPONS = [
  {
    code: "SWAGFIRST",
    description: "Flat ₹200 OFF on your first purchase above ₹999",
    discountType: "fixed",
    discountValue: 200,
    minimumOrderAmount: 999,
    maximumDiscount: 200,
    usageLimit: 500,
    usedCount: 14,
    startDate: new Date("2026-01-01"),
    expiryDate: new Date("2026-12-31"),
    status: "active",
  },
  {
    code: "TRENDY15",
    description: "15% discount on trending street fashion & apparel",
    discountType: "percentage",
    discountValue: 15,
    minimumOrderAmount: 1499,
    maximumDiscount: 600,
    usageLimit: 1000,
    usedCount: 82,
    startDate: new Date("2026-01-01"),
    expiryDate: new Date("2026-12-31"),
    status: "active",
  },
  {
    code: "FREESHIP",
    description: "Free delivery voucher for orders above ₹499",
    discountType: "fixed",
    discountValue: 99,
    minimumOrderAmount: 499,
    maximumDiscount: 99,
    usageLimit: 2000,
    usedCount: 215,
    startDate: new Date("2026-01-01"),
    expiryDate: new Date("2026-12-31"),
    status: "active",
  },
  {
    code: "FESTIVE30",
    description: "Extra 30% OFF on grand festive fashion collections",
    discountType: "percentage",
    discountValue: 30,
    minimumOrderAmount: 2499,
    maximumDiscount: 1200,
    usageLimit: 500,
    usedCount: 45,
    startDate: new Date("2026-01-01"),
    expiryDate: new Date("2026-12-31"),
    status: "active",
  },
  {
    code: "VIP500",
    description: "Flat ₹500 OFF on premium wardrobe cart above ₹3,499",
    discountType: "fixed",
    discountValue: 500,
    minimumOrderAmount: 3499,
    maximumDiscount: 500,
    usageLimit: 200,
    usedCount: 8,
    startDate: new Date("2026-01-01"),
    expiryDate: new Date("2026-12-31"),
    status: "active",
  },
];

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("MONGO_URI is not defined in .env");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding coupons...");

    for (const c of REAL_COUPONS) {
      await Coupon.findOneAndUpdate(
        { code: c.code },
        { $set: c },
        { upsert: true, new: true }
      );
      console.log(`Seeded / verified coupon: ${c.code}`);
    }

    const total = await Coupon.countDocuments();
    console.log(`Total coupons in database: ${total}`);
    await mongoose.disconnect();
    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
