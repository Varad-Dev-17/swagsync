import mongoose from "mongoose";

const ReturnRequestSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    originalVariant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      required: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["return", "exchange"],
      required: true,
    },
    reason: {
      type: String,
      enum: [
        "Damaged Product",
        "Damaged or Defective Product",
        "Wrong Item Received",
        "Size / Fit Issue",
        "Color Mismatch",
        "Quality Not as Expected",
        "Missing Items / Accessories",
        "Defective or Not Working",
        "Other"
      ],
      required: true,
    },
    additionalDetails: {
      type: String,
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    requestedExchangeVariant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      // Only required if type is "exchange"
      required: function() {
        return this.type === 'exchange';
      }
    },
    originalPrice: {
      type: Number,
    },
    exchangePrice: {
      type: Number,
    },
    priceDifference: {
      type: Number,
    },
    settlementType: {
      type: String,
      enum: ["additional_payment", "refund", "no_difference"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "pickup",
        "pickup_replace",
        "completed",
        "packed",
        "shipped",
        "pickup_scheduled",
        "picked_up",
        "received",
        "refunded",
        "exchanged"
      ],
      default: "pending",
    },
    qcStatus: {
      type: String,
      enum: ["pending", "passed", "failed"],
      default: "pending",
    },
    qcReason: {
      type: String,
    },
    refundStatus: {
      type: String,
      enum: ["not_required", "initiated", "processing", "completed", "failed"],
      default: "not_required",
    },
    refundAmount: { type: Number },
    refundMethod: { type: String },
    refundTransactionId: { type: String },
    refundFailureReason: { type: String },
    refundProcessedAt: { type: Date },
    adminNotes: [
      {
        note: { type: String, required: true },
        createdBy: { type: String, default: "Admin" },
        category: { type: String, default: "admin" },
        visibleToCustomer: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    timeline: [
      {
        eventId: { type: String, required: true },
        type: { type: String, required: true },
        description: { type: String },
        performedBy: { type: String, default: "System" },
        createdBy: { type: String, default: "System" },
        timestamp: { type: Date, default: Date.now },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
      },
    ],
  },
  { timestamps: true }
);

// Compound index to quickly find if a user has an active request for a specific order+product+variant
ReturnRequestSchema.index({ order: 1, product: 1, originalVariant: 1 }, { unique: false });

const ReturnRequest = mongoose.model("ReturnRequest", ReturnRequestSchema);
export default ReturnRequest;
