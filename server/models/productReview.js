import mongoose from "mongoose";

const ProductReviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    review: {
      type: String,
      default: "",
      trim: true,
    },

    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
      },
    ],

    verifiedBuyer: {
      type: Boolean,
      default: false,
    },

    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      default: null,
    },

    vendorReply: {
      message: { type: String, trim: true },
      repliedAt: { type: Date },
      repliedBy: { type: String, enum: ["vendor", "admin"], default: "vendor" },
      authorName: { type: String, default: "Merchant Response" },
      vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
      admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    },
  },
  { timestamps: true }
);

ProductReviewSchema.index({ product: 1, variant: 1, user: 1 }, { unique: true });

export default mongoose.model("ProductReview", ProductReviewSchema);
