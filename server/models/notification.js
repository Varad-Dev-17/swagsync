import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["orders", "order", "returns", "return", "tickets", "ticket", "offers", "offer", "account", "system"],
      default: "orders",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      default: "/account/notifications",
    },
    linkText: {
      type: String,
      default: "View Details",
    },
    iconType: {
      type: String,
      enum: ["package", "return", "ticket", "tag", "sparkles", "shield", "security", "bell", "user", "offer"],
      default: "bell",
    },
    color: {
      type: String,
      default: "blue",
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    entityId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;
