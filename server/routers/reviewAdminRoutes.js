import express from "express";
import {
  getAllAdminReviews,
  deleteAdminReview,
  replyAdminReview,
  deleteAdminReviewReply,
} from "../controllers/reviewController.js";
import { identifier } from "../middlewares/identification.js";

const router = express.Router();

router.get("/", identifier, getAllAdminReviews);
router.delete("/:reviewId", identifier, deleteAdminReview);
router.post("/:reviewId/reply", identifier, replyAdminReview);
router.delete("/:reviewId/reply", identifier, deleteAdminReviewReply);

export default router;
