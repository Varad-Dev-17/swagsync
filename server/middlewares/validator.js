import joi from "joi";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PASSWORD_FRIENDLY_MSG = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.";

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
    .pattern(PASSWORD_REGEX)
    .required()
    .messages({
      "string.empty": "Password is required.",
      "string.pattern.base": PASSWORD_FRIENDLY_MSG,
    }),
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
    .pattern(PASSWORD_REGEX)
    .required()
    .messages({
      "string.empty": "Password is required.",
      "string.pattern.base": PASSWORD_FRIENDLY_MSG,
    }),
});

export const changePasswordSchema = joi.object({
  newPassword: joi
    .string()
    .pattern(PASSWORD_REGEX)
    .required()
    .messages({
      "string.empty": "New password is required.",
      "string.pattern.base": PASSWORD_FRIENDLY_MSG,
    }),
  oldPassword: joi
    .string()
    .required()
    .messages({
      "string.empty": "Current password is required.",
    }),
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
    .pattern(PASSWORD_REGEX)
    .required()
    .messages({
      "string.empty": "New password is required.",
      "string.pattern.base": PASSWORD_FRIENDLY_MSG,
    }),
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
    .pattern(PASSWORD_REGEX)
    .required()
    .messages({
      "string.empty": "Password is required.",
      "string.pattern.base": PASSWORD_FRIENDLY_MSG,
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
    .email({ tlds: { allow: false } })
    .messages({
      "string.empty": "Email is required.",
      "string.email": "Please enter a valid email address.",
    }),
  password: joi
    .string()
    .pattern(PASSWORD_REGEX)
    .required()
    .messages({
      "string.empty": "Password is required.",
      "string.pattern.base": PASSWORD_FRIENDLY_MSG,
    }),
});

