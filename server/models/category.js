import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
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
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    image: {
      url: String,
      public_id: String
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

export default mongoose.model("Category", CategorySchema);
