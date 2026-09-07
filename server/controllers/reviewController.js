import ProductReview from "../models/productReview.js";
import Product from "../models/product.js";
import Order from "../models/order.js";
import Variant from "../models/variant.js";

// GET REVIEWS BY PRODUCT
export const getReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      ProductReview.find({ product: productId })
        .populate("user", "username email")
        .populate({
          path: "variant",
          select: "attributes mainImage",
          populate: { path: "attributes.attribute", select: "name" },
        })
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ProductReview.countDocuments({ product: productId }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      data: {
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Error in getReviews:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      data: null,
    });
  }
};

// GET CURRENT LOGGED IN USER'S REVIEWS
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.userId;
    const reviews = await ProductReview.find({ user: userId })
      .populate("product", "title images slug")
      .populate("variant", "attributes mainImage")
      .lean();

    return res.status(200).json({
      success: true,
      message: "User reviews fetched successfully",
      data: reviews,
    });
  } catch (error) {
    console.error("Error in getUserReviews:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user reviews",
      data: null,
    });
  }
};

// CREATE REVIEW
export const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment, review: reviewText, images = [], variantId = null } = req.body;
    const userId = req.user.userId;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
        data: null,
      });
    }

    // Check if product exists (case-insensitive status check or simple existence check)
    const product = await Product.findById(productId);
    if (!product || product.status?.toLowerCase() === "inactive") {
      return res.status(404).json({
        success: false,
        message: "Product not found or currently inactive",
        data: null,
      });
    }

    // Check if user already reviewed this product variant
    const query = { product: productId, user: userId };
    if (variantId) {
      query.variant = variantId;
    } else {
      query.variant = null;
    }
    const existingReview = await ProductReview.findOne(query);
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: variantId
          ? "You have already reviewed this specific color/variant. Please update your existing review."
          : "You have already reviewed this product. Please update your existing review.",
        data: null,
      });
    }

    // Check if user has an order for this product/variant (Verified Buyer)
    const orderQuery = { user: userId, "items.product": productId };
    if (variantId) {
      orderQuery["items.variant"] = variantId;
    }
    let existingOrder = await Order.findOne(orderQuery);
    if (!existingOrder) {
      existingOrder = await Order.findOne({ user: userId, "items.product": productId });
    }
    const isVerified = !!existingOrder;

    const finalReviewText = reviewText !== undefined ? reviewText : (comment || "");

    // Create review
    const review = await ProductReview.create({
      product: productId,
      variant: variantId || null,
      user: userId,
      rating: Number(rating),
      review: finalReviewText.trim(),
      images: Array.isArray(images) ? images : [],
      verifiedBuyer: isVerified,
    });

    // Recalculate product ratings
    const allReviews = await ProductReview.find({ product: productId });
    let ratingAverage = 0;
    let ratingCount = 0;

    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      ratingAverage = Math.round((totalRating / allReviews.length) * 10) / 10;
      ratingCount = allReviews.length;
    }

    await Product.findByIdAndUpdate(productId, {
      ratingAverage,
      ratingCount,
    });

    const populatedReview = await ProductReview.findById(review._id)
      .populate("user", "username email")
      .populate("product", "title")
      .populate("variant", "attributes mainImage");

    return res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: populatedReview,
    });
  } catch (error) {
    console.error("Error in createReview:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this product/variant. Please update your existing review.",
        data: null,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create review",
      data: null,
    });
  }
};

// UPDATE REVIEW
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, review: reviewText, images } = req.body;
    const userId = req.user.userId;

    const review = await ProductReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
        data: null,
      });
    }

    // Only review owner can update
    if (review.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this review",
        data: null,
      });
    }

    // Update fields
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5",
          data: null,
        });
      }
      review.rating = Number(rating);
    }

    if (reviewText !== undefined || comment !== undefined) {
      review.review = (reviewText !== undefined ? reviewText : comment).trim();
    }

    if (images !== undefined && Array.isArray(images)) {
      review.images = images;
    }

    await review.save();

    // Recalculate product ratings
    const productId = review.product;
    const allReviews = await ProductReview.find({ product: productId });
    let ratingAverage = 0;
    let ratingCount = 0;

    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      ratingAverage = Math.round((totalRating / allReviews.length) * 10) / 10;
      ratingCount = allReviews.length;
    }

    await Product.findByIdAndUpdate(productId, {
      ratingAverage,
      ratingCount,
    });

    const populatedReview = await ProductReview.findById(reviewId)
      .populate("user", "username email")
      .populate("product", "title")
      .populate("variant", "attributes mainImage");

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: populatedReview,
    });
  } catch (error) {
    console.error("Error in updateReview:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update review",
      data: null,
    });
  }
};

// DELETE REVIEW
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.userId;

    const review = await ProductReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
        data: null,
      });
    }

    // Only review owner can delete
    if (review.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this review",
        data: null,
      });
    }

    const productId = review.product;
    await ProductReview.findByIdAndDelete(reviewId);

    // Recalculate product ratings
    const allReviews = await ProductReview.find({ product: productId });
    let ratingAverage = 0;
    let ratingCount = 0;

    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      ratingAverage = Math.round((totalRating / allReviews.length) * 10) / 10;
      ratingCount = allReviews.length;
    }

    await Product.findByIdAndUpdate(productId, {
      ratingAverage,
      ratingCount,
    });

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("Error in deleteReview:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete review",
      data: null,
    });
  }
};

// ADMIN: GET ALL REVIEWS
export const getAllAdminReviews = async (req, res) => {
  try {
    const { page = 1, limit = 30, rating } = req.query;
    const query = {};
    if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
      query.rating = Number(rating);
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      ProductReview.find(query)
        .populate("user", "username email")
        .populate("product", "title slug productId")
        .populate("variant", "mainImage attributes")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ProductReview.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Admin reviews fetched successfully",
      data: {
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Error in getAllAdminReviews:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin reviews",
      data: null,
    });
  }
};

// ADMIN: DELETE REVIEW
export const deleteAdminReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await ProductReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
        data: null,
      });
    }

    const productId = review.product;
    await ProductReview.findByIdAndDelete(reviewId);

    // Recalculate product ratings
    const allReviews = await ProductReview.find({ product: productId });
    let ratingAverage = 0;
    let ratingCount = 0;

    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      ratingAverage = Math.round((totalRating / allReviews.length) * 10) / 10;
      ratingCount = allReviews.length;
    }

    await Product.findByIdAndUpdate(productId, {
      ratingAverage,
      ratingCount,
    });

    return res.status(200).json({
      success: true,
      message: "Review deleted by admin successfully",
      data: null,
    });
  } catch (error) {
    console.error("Error in deleteAdminReview:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete review",
      data: null,
    });
  }
};
