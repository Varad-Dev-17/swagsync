import mongoose from "mongoose";

const BrandSchema = new mongoose.Schema(
  {
    departmentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],

    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
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

export default mongoose.model("Brand", BrandSchema);
