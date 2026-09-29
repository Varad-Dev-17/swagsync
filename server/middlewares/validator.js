import joi from "joi";

export const signupSchema = joi.object({
  username: joi.string().min(3).max(30).required(),
  email: joi
    .string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),
  password: joi
    .string()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"))
    .required(),
});

export const acceptCodeSchema = joi.object({
  email: joi
    .string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),
  codeProvided: joi.number().required(),
});

export const signinSchema = joi.object({
  email: joi
    .string()
    .min(8)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),
  password: joi
    .string()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"))
    .required(),
});

export const changePasswordSchema = joi.object({
  newPassword: joi
    .string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$")),
  oldPassword: joi
    .string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$")),
});

export const acceptFPCodeSchema = joi.object({
  email: joi
    .string()
    .min(6)
    .max(60)
    .required()
    .email({
      tlds: { allow: ["com", "net"] },
    }),
  providedCode: joi.number().required(),
  newPassword: joi
    .string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$")),
});

export const vendorRegisterSchema = joi.object({
  fullName: joi.string().min(2).max(100).required(),
  email: joi
    .string()
    .min(6)
    .max(80)
    .required()
    .email({ tlds: { allow: false } }),
  phone: joi.string().min(10).max(20).required(),
  password: joi
    .string()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$"))
    .required()
    .messages({
      "string.pattern.base": "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
    }),
  storeName: joi.string().min(2).max(100).required(),
  storeDescription: joi.string().allow("").max(1000).optional(),
  addressLine1: joi.string().min(3).max(200).required(),
  addressLine2: joi.string().allow("").max(200).optional(),
  city: joi.string().min(2).max(100).required(),
  state: joi.string().min(2).max(100).required(),
  country: joi.string().allow("").max(100).optional(),
  pincode: joi.string().min(4).max(12).required(),
  businessName: joi.string().min(2).max(150).required(),
  businessType: joi.string().min(2).max(100).required(),
  gstNumber: joi.string().allow("").max(20).optional(),
  panNumber: joi.string().allow("").max(15).optional(),
  accountHolderName: joi.string().min(2).max(100).required(),
  bankName: joi.string().min(2).max(100).required(),
  accountNumber: joi.string().min(6).max(35).required(),
  ifscCode: joi.string().min(4).max(20).required(),
  documents: joi.array().items(
    joi.object({
      name: joi.string().required(),
      url: joi.string().required(),
      publicId: joi.string().allow("").optional(),
      fileType: joi.string().allow("").optional(),
    })
  ).optional(),
});

export const vendorSigninSchema = joi.object({
  email: joi
    .string()
    .min(6)
    .max(80)
    .required()
    .email({ tlds: { allow: false } }),
  password: joi.string().required(),
});

