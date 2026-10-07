import express from "express";
import {
  getAllProducts,
  getProductById,
  getProductBySlug,
  getRelatedProducts,
  getNewArrivals,
  getSearchSuggestions,
} from "../controllers/productController.js";

const router = express.Router();

const getActiveProducts = async (req, res, next) => {
  req.query.status = "Active";
  return getAllProducts(req, res, next);
};

// Public routes
router.get("/", getActiveProducts);
router.get("/suggestions", getSearchSuggestions);
router.get("/new-arrivals", getNewArrivals);
router.get("/slug/:slug", getProductBySlug);
router.get("/related/:id", getRelatedProducts);
router.get("/:id", getProductById);

export default router;
