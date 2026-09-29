import Vendor from "../models/vendor.js";

/**
 * Middleware to verify that the requesting user is an authenticated, email-verified, and approved vendor.
 * Performs database-level status validation to prevent token staleness (e.g. if suspended after token issuance).
 */
export const isApprovedVendor = async (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Please log in first.",
    });
  }

  try {
    const vendor = await Vendor.findById(req.user.userId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor account not found.",
      });
    }

    if (vendor.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Vendors only.",
      });
    }

    if (!vendor.emailVerified && !vendor.verified) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Please verify your email before accessing the vendor portal.",
      });
    }

    if (vendor.vendorStatus === "PENDING") {
      return res.status(403).json({
        success: false,
        message: "Your Vendor account is awaiting Admin approval.",
        vendorStatus: "PENDING",
      });
    }

    if (vendor.vendorStatus === "SUSPENDED") {
      return res.status(403).json({
        success: false,
        message: "Your Vendor account has been suspended. Please contact support.",
        vendorStatus: "SUSPENDED",
      });
    }

    if (vendor.vendorStatus === "REJECTED") {
      return res.status(403).json({
        success: false,
        message: "Your Vendor application has been rejected.",
        vendorStatus: "REJECTED",
      });
    }

    if (vendor.vendorStatus !== "APPROVED") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Vendor account is not approved.",
      });
    }

    req.vendor = vendor;
    next();
  } catch (error) {
    console.error("[isApprovedVendor] Error verifying vendor:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authorization.",
    });
  }
};
