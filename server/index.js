import dns from "node:dns";
dns.setDefaultResultOrder?.("ipv4first");

import dotenv from "dotenv";
dotenv.config({ override: true });
import express from "express";
// Triggering server restart for database model separation (Admin, Vendor, User)
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { apiLimiter } from "./middlewares/rateLimiter.js";
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routers/authroutes.js";
import adminRoutes from "./routers/adminRoutes.js";
import userRoutes from "./routers/userRoutes.js";
import addressRoutes from "./routers/addressRoutes.js";

// Split routes
import productPublicRoutes from "./routers/productPublicRoutes.js";
import productAdminRoutes from "./routers/productAdminRoutes.js";
import departmentPublicRoutes from "./routers/departmentPublicRoutes.js";
import departmentAdminRoutes from "./routers/departmentAdminRoutes.js";
import categoryPublicRoutes from "./routers/categoryPublicRoutes.js";
import categoryAdminRoutes from "./routers/categoryAdminRoutes.js";
import brandPublicRoutes from "./routers/brandPublicRoutes.js";
import brandAdminRoutes from "./routers/brandAdminRoutes.js";
import attributePublicRoutes from "./routers/attributePublicRoutes.js";
import attributeAdminRoutes from "./routers/attributeAdminRoutes.js";
import attributeOptionPublicRoutes from "./routers/attributeOptionPublicRoutes.js";
import attributeOptionAdminRoutes from "./routers/attributeOptionAdminRoutes.js";
import attributeMappingAdminRoutes from "./routers/attributeMappingAdminRoutes.js";
import orderPublicRoutes from "./routers/orderPublicRoutes.js";
import orderAdminRoutes from "./routers/orderAdminRoutes.js";
import adminReturnRoutes from "./routers/adminReturnRoutes.js";

// Single-purpose routes
import reviewRoutes from "./routers/reviewRoutes.js";
import reviewAdminRoutes from "./routers/reviewAdminRoutes.js";
import wishlistRoutes from "./routers/wishlistRoutes.js";
import couponRoutes from "./routers/couponRoutes.js";
import couponPublicRoutes from "./routers/couponPublicRoutes.js";
import returnRequestRoutes from "./routers/returnRequestRoutes.js";
import uploadRoutes from "./routers/uploadRoutes.js";
import cartRoutes from "./routers/cartRoutes.js";
import dashboardRoutes from "./routers/dashboardRoutes.js";
import ticketRoutes from "./routers/ticketRoutes.js";
import ticketAdminRoutes from "./routers/ticketAdminRoutes.js";
import notificationRoutes from "./routers/notificationRoutes.js";
import vendorRoutes from "./routers/vendorRoutes.js";
import vendorAdminRoutes from "./routers/vendorAdminRoutes.js";
import vendorPortalRoutes from "./routers/vendorPortalRoutes.js";
import adminNotificationRoutes from "./routers/adminNotificationRoutes.js";

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Hardening: trust reverse proxies (Render, Cloudflare, etc.) and disable fingerprinting
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      "http://localhost:8081",
      "http://10.0.2.2:8081",
      process.env.FRONTEND_URL,
      process.env.RENDER_EXTERNAL_URL,
      "https://swagsync.onrender.com",
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(cookieParser());

// Apply global API rate limiting to all requests
app.use(apiLimiter);

// API Routes

// Admin only
app.use("/admin", adminRoutes); 
app.use("/admin/users", userRoutes);
app.use("/admin/products", productAdminRoutes);
app.use("/admin/departments", departmentAdminRoutes);
app.use("/admin/categories", categoryAdminRoutes);
app.use("/admin/brands", brandAdminRoutes);
app.use("/admin/attributes", attributeAdminRoutes);
app.use("/admin/attribute-options", attributeOptionAdminRoutes);
// Attribute Mapping (refactored to map Attributes to Categories)
app.use("/admin/attribute-mapping", attributeMappingAdminRoutes);
app.use("/admin/orders", orderAdminRoutes);
app.use("/admin/returns", adminReturnRoutes);
app.use("/admin/coupons", couponRoutes);
app.use("/admin/reviews", reviewAdminRoutes);
app.use("/admin/dashboard", dashboardRoutes);
app.use("/admin/upload", uploadRoutes);
app.use("/admin/tickets", ticketAdminRoutes);
app.use("/admin/vendors", vendorAdminRoutes);
app.use("/admin/notifications", adminNotificationRoutes);

// Public / User routes
app.use("/auth", authRoutes);
app.use("/vendor", vendorRoutes);
// Vendor Portal routes (Approved vendor access: store, products, variants, inventory, catalog)
app.use("/vendor/portal", vendorPortalRoutes);
app.use("/api/vendor/portal", vendorPortalRoutes);
app.use("/products", productPublicRoutes);
app.use("/departments", departmentPublicRoutes);
app.use("/categories", categoryPublicRoutes);
app.use("/brands", brandPublicRoutes);
app.use("/attributes", attributePublicRoutes);
app.use("/attribute-options", attributeOptionPublicRoutes);
app.use("/cart", cartRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/reviews", reviewRoutes);
app.use("/orders", orderPublicRoutes);
app.use("/addresses", addressRoutes);
app.use("/coupons", couponPublicRoutes);
app.use("/return-requests", returnRequestRoutes);
app.use("/tickets", ticketRoutes);
app.use("/notifications", notificationRoutes);

// Static Files
const distPath = path.join(__dirname, "../dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("MongoDB Connected");
  });
};

startServer();

export { app };
export default app;
