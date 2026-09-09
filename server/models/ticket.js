import mongoose from "mongoose";

const ResponseSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const TicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: [
        "Order Issues",
        "Returns & Refunds",
        "Payment & Billing",
        "Coupons & Offers",
        "Account & Profile",
        "Other",
      ],
      default: "Order Issues",
    },
    orderId: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    responses: [ResponseSchema],
    lastResponseAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

TicketSchema.index({ user: 1, createdAt: -1 });
TicketSchema.index({ status: 1 });

const Ticket = mongoose.model("Ticket", TicketSchema);

export default Ticket;
