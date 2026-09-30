import mongoose from "mongoose";

const ProductAttributeSchema = new mongoose.Schema(
  {
    attribute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attribute",
      required: true,
    },
    values: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { _id: false }
);

const ProductImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    productId: { type: String, unique: true, sparse: true },
    title: {
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

    shortDescription: {
      type: String,
      required: true,
      trim: true,
    },

    longDescription: {
      type: String,
      required: true,
      trim: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    attributes: [ProductAttributeSchema],

    returnPolicy: {
      returnable: {
        type: Boolean,
        default: true,
      },
      exchangeable: {
        type: Boolean,
        default: true,
      },
      returnDays: {
        type: Number,
        default: 7,
      },
    },

    ratingAverage: {
      type: Number,
      default: 0,
    },

    ratingCount: {
      type: Number,
      default: 0,
    },

    wishlistCount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Inactive",
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
      index: true,
    },

    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    store: {
      storeName: { type: String, trim: true },
      phone: { type: String, trim: true },
      storeDescription: { type: String, trim: true },
      addressLine1: { type: String, trim: true },
      addressLine2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true, default: "India" },
      pincode: { type: String, trim: true },
    },

    manufacturerId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    manufacturer: {
      manufacturerName: { type: String, trim: true },
      countryOfOrigin: { type: String, trim: true, default: "India" },
      manufacturerAddress: { type: String, trim: true },
      packer: { type: String, trim: true },
      packerPhone: { type: String, trim: true },
      packerAddress: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", ProductSchema);
