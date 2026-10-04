import mongoose from "mongoose";

const AttributeSchema = new mongoose.Schema(
  {
    categoryIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    fieldType: {
      type: String,
      enum: ["select", "color", "text", "number"],
      required: true,
    },

    usage: {
      type: String,
      enum: ["Product", "Variant"],
      default: "Product",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Attribute", AttributeSchema);
