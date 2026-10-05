import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        variant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Variant",
        },
        vendor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Vendor",
        },
        quantity: { type: Number, default: 1 },
        mrp: { type: Number, required: true },
        sellingPrice: { type: Number, required: true },
        basePrice: { type: Number, required: true },
        gstRate: { type: Number, required: true },
        gstAmount: { type: Number, required: true },
        status: {
          type: String,
          default: "pending",
          enum: ["pending", "processing", "packed", "shipped", "on_the_way", "delivered", "cancelled", "delayed"],
        },
        cancellationReason: { type: String, default: "" },
        trackingNumber: { type: String, default: "" },
        courier: { type: String, default: "" },
      },
    ],
    shippingAddress: {
      name: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
      phone: String,
    },
    totalMRP: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    shippingAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    coupon: {
      code: String,
      type: { type: String },
      value: Number,
    },
    paymentMethod: { type: String, default: "cod" },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentStatus: {
      type: String,
      default: "pending",
      enum: ["pending", "paid", "failed", "refunded"],
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "processing", "packed", "shipped", "on_the_way", "delivered", "cancelled", "delayed"],
    },
    cancellationReason: { type: String, default: "" },
    deliveredAt: { type: Date, default: null },
    trackingNumber: String,
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

const Order = mongoose.model("Order", OrderSchema);
export default Order;
