import express from "express";
import {
  getVendorDashboardStats,
  getVendorStore,
  updateVendorStore,
  getVendorStores,
  addVendorStore,
  updateVendorStoreById,
  deleteVendorStore,
  setDefaultVendorStore,
  getVendorManufacturers,
  addVendorManufacturer,
  updateVendorManufacturer,
  deleteVendorManufacturer,
  setDefaultVendorManufacturer,
  getVendorMasterCatalog,
  getVendorProducts,
  getVendorProductById,
  createVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
  getVendorProductVariants,
  updateVendorProductVariants,
  getVendorInventory,
  updateVendorVariantStock,
  // Phase 4 Operations
  getVendorOrders,
  getVendorOrderById,
  updateVendorOrderStatus,
  updateVendorOrderItemFulfillment,
  getVendorReturnRequests,
  getVendorReturnRequestById,
  updateVendorReturnStatus,
  getVendorTickets,
  getVendorTicketById,
  replyToVendorTicket,
  updateVendorTicketStatus,
  getVendorReviews,
  replyToVendorReview,
  deleteVendorReviewReply,
  getVendorEarningsSummary,
  getVendorTransactions,
  getVendorPayoutHistory,
  requestVendorPayout,
} from "../controllers/vendorPortalController.js";
import { identifier } from "../middlewares/identification.js";
import { isApprovedVendor } from "../middlewares/isApprovedVendor.js";
import { getMappedAttributes, mapAttributes } from "../controllers/attributeMappingController.js";
import { getAllVariantGroups } from "../controllers/productController.js";
import { getVariantGroupAnalytics } from "../controllers/variantAnalyticsController.js";
import { createCategory, updateCategory, deleteCategory } from "../controllers/categoryController.js";
import { createBrand, updateBrand, deleteBrand } from "../controllers/brandController.js";
import { createAttribute, updateAttribute, deleteAttribute } from "../controllers/attributeController.js";
import {
  createAttributeOption,
  updateAttributeOption,
  deleteAttributeOption,
} from "../controllers/attributeOptionController.js";

const router = express.Router();

import { upload, uploadToCloudinary } from "./uploadRoutes.js";

// Enforce authentication & approved vendor verification on ALL portal endpoints
router.use(identifier, isApprovedVendor);

// 1. Dashboard
router.get("/dashboard/stats", getVendorDashboardStats);

// 2. Store Profile & Multi-Store Management
router.get("/store", getVendorStore);
router.put("/store", updateVendorStore);
router.get("/stores", getVendorStores);
router.post("/stores", addVendorStore);
router.put("/stores/:id", updateVendorStoreById);
router.delete("/stores/:id", deleteVendorStore);
router.patch("/stores/:id/default", setDefaultVendorStore);

// 2B. Manufacturer Management (Multiple per vendor)
router.get("/manufacturers", getVendorManufacturers);
router.post("/manufacturers", addVendorManufacturer);
router.put("/manufacturers/:id", updateVendorManufacturer);
router.delete("/manufacturers/:id", deleteVendorManufacturer);
router.patch("/manufacturers/:id/default", setDefaultVendorManufacturer);

// 3. Catalog (Master Catalog View & Mutation for Vendor)
router.get("/catalog", getVendorMasterCatalog);
router.get("/categories/:id/attributes", getMappedAttributes);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);
router.post("/brands", createBrand);
router.put("/brands/:id", updateBrand);
router.delete("/brands/:id", deleteBrand);
router.post("/attributes", createAttribute);
router.put("/attributes/:id", updateAttribute);
router.delete("/attributes/:id", deleteAttribute);
router.post("/attribute-options", createAttributeOption);
router.put("/attribute-options/:id", updateAttributeOption);
router.delete("/attribute-options/:id", deleteAttributeOption);
router.post("/categories/:id/attributes", mapAttributes);

// 4. Products (Scoped to Vendor)
router.get("/products/variants/groups", getAllVariantGroups);
router.get("/products", getVendorProducts);
router.post("/products", createVendorProduct);
router.get("/products/:id", getVendorProductById);
router.put("/products/:id", updateVendorProduct);
router.delete("/products/:id", deleteVendorProduct);

// 5. Variants (Scoped to Vendor)
router.get("/products/:id/variants", getVendorProductVariants);
router.put("/products/:id/variants", updateVendorProductVariants);
router.get("/products/:id/variant-group/:primaryOptionId/analytics", getVariantGroupAnalytics);

// 6. Inventory (Scoped to Vendor)
router.get("/inventory", getVendorInventory);
router.patch("/inventory/:variantId", updateVendorVariantStock);

// 7. Orders & Fulfillment (Phase 4)
router.get("/orders", getVendorOrders);
router.get("/orders/:id", getVendorOrderById);
router.put("/orders/:id", updateVendorOrderStatus);
router.patch("/orders/:id/status", updateVendorOrderStatus);
router.patch("/orders/:id/items/:itemId/fulfillment", updateVendorOrderItemFulfillment);

// 8. Returns & Exchanges (Phase 4)
router.get("/returns", getVendorReturnRequests);
router.get("/returns/:id", getVendorReturnRequestById);
router.put("/returns/:id", updateVendorReturnStatus);
router.patch("/returns/:id/status", updateVendorReturnStatus);

// 9. Tickets & Customer Issues (Phase 4)
router.get("/tickets", getVendorTickets);
router.get("/tickets/:id", getVendorTicketById);
router.post("/tickets/:id/reply", replyToVendorTicket);
router.patch("/tickets/:id/status", updateVendorTicketStatus);

// 10. Reviews & Feedback (Phase 4)
router.get("/reviews", getVendorReviews);
router.post("/reviews/:id/reply", replyToVendorReview);
router.delete("/reviews/:id/reply", deleteVendorReviewReply);

// 11. Payments & Earnings (Phase 4)
router.get("/payments/summary", getVendorEarningsSummary);
router.get("/payments/transactions", getVendorTransactions);
router.get("/payments/payouts", getVendorPayoutHistory);
router.post("/payments/request-payout", requestVendorPayout);

// 12. Image Uploads (Vendor scoped)
router.post("/upload/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image provided" });
    }
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, "swagsync-vendor-products");
    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: { url: result.secure_url, publicId: result.public_id },
    });
  } catch (error) {
    console.error("Vendor upload error:", error);
    return res.status(500).json({ success: false, message: "Upload failed: " + (error.message || "Unknown error") });
  }
});

router.post("/upload/multiple", upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No images provided" });
    }
    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, file.mimetype, "swagsync-vendor-products")
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
    console.error("Vendor upload multiple error:", error);
    return res.status(500).json({ success: false, message: "Upload failed: " + (error.message || "Unknown error") });
  }
});

export default router;
