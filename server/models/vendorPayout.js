import mongoose from "mongoose";

const vendorPayoutSchema = new mongoose.Schema(
  {
    payoutId: {
      type: String,
      unique: true,
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "Payout amount must be greater than zero"],
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "rejected"],
      default: "pending",
    },
    payoutMethod: {
      type: String,
      enum: ["bank_transfer", "upi", "neft"],
      default: "bank_transfer",
    },
    bankDetails: {
      accountHolderName: { type: String, trim: true },
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
      upiId: { type: String, trim: true },
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: "",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    adminRemarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

vendorPayoutSchema.index({ vendor: 1, createdAt: -1 });
vendorPayoutSchema.index({ status: 1 });

const VendorPayout = mongoose.model("VendorPayout", vendorPayoutSchema);
export default VendorPayout;
