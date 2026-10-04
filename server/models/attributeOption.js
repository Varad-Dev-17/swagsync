import mongoose from "mongoose";

const AttributeOptionSchema = new mongoose.Schema(
  {
    attribute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attribute",
      required: true,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
    },

    storedValue: {
      type: String,
      required: true,
      trim: true,
    },

    hex: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
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

AttributeOptionSchema.index(
  {
    attribute: 1,
    displayName: 1,
  },
  { unique: true }
);

export default mongoose.model("AttributeOption", AttributeOptionSchema);
