import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    vendorId: {
      type: String,
      unique: true,
      sparse: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      lowercase: true,
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    mobileNo: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      default: "vendor",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      select: false,
    },
    verificationCodeValidation: {
      type: Date,
      select: false,
    },
    forgotPasswordCode: {
      type: String,
      select: false,
    },
    forgotPasswordCodeValidation: {
      type: Date,
      select: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    vendorStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"],
      default: "PENDING",
    },
    vendorProfile: {
      fullName: { type: String, trim: true },
      phone: { type: String, trim: true },
      storeName: { type: String, trim: true },
      storeDescription: { type: String, trim: true },
      storeAddress: {
        addressLine1: { type: String, trim: true },
        addressLine2: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        country: { type: String, trim: true, default: "India" },
        pincode: { type: String, trim: true },
      },
      businessDetails: {
        businessName: { type: String, trim: true },
        businessType: { type: String, trim: true },
        gstNumber: { type: String, trim: true },
        panNumber: { type: String, trim: true },
      },
      bankDetails: {
        accountHolderName: { type: String, trim: true },
        bankName: { type: String, trim: true },
        accountNumber: { type: String, trim: true },
        ifscCode: { type: String, trim: true },
      },
      documents: [
        {
          name: { type: String, trim: true },
          url: { type: String, trim: true },
          publicId: { type: String, trim: true },
          fileType: { type: String, trim: true },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      rejectionReason: { type: String, trim: true },
      approvedAt: { type: Date },
      rejectedAt: { type: Date },
      suspendedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

vendorSchema.pre("save", function (next) {
  if (this.isModified("verified") && !this.isModified("emailVerified")) {
    this.emailVerified = this.verified;
  }
  if (this.isModified("emailVerified") && !this.isModified("verified")) {
    this.verified = this.emailVerified;
  }
  next();
});

export default mongoose.model("Vendor", vendorSchema);
