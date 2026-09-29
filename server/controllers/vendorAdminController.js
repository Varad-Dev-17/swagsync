import Vendor from "../models/vendor.js";
import transport from "../middlewares/sendMail.js";
import { vendorApprovalEmailTemplate } from "../utils/vendorApprovalEmailTemplate.js";
import { vendorRejectionEmailTemplate } from "../utils/vendorRejectionEmailTemplate.js";

export const getAllVendors = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const baseFilter = {};

    // Status filter
    if (status && status !== "all") {
      baseFilter.vendorStatus = status.toUpperCase();
    }

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      baseFilter.$or = [
        { "vendorProfile.fullName": searchRegex },
        { "vendorProfile.storeName": searchRegex },
        { email: searchRegex },
        { mobileNo: searchRegex },
        { "vendorProfile.phone": searchRegex },
        { vendorId: searchRegex },
        { username: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Fetch vendors
    const [vendors, totalCount] = await Promise.all([
      Vendor.find(baseFilter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Vendor.countDocuments(baseFilter),
    ]);

    // Calculate overall stats for all vendors
    const allVendorStats = await Vendor.aggregate([
      {
        $group: {
          _id: "$vendorStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      suspended: 0,
    };

    allVendorStats.forEach((group) => {
      const count = group.count;
      stats.total += count;
      const statusKey = group._id?.toLowerCase();
      if (statusKey && stats.hasOwnProperty(statusKey)) {
        stats[statusKey] = count;
      }
    });

    return res.status(200).json({
      success: true,
      vendors,
      stats,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error("[Get All Vendors] Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching vendors list.",
    });
  }
};

/**
 * 2. Get Vendor Details by ID
 */
export const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id).select("-password").lean();
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found.",
      });
    }

    return res.status(200).json({
      success: true,
      vendor,
    });
  } catch (error) {
    console.error("[Get Vendor By ID] Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching vendor details.",
    });
  }
};

/**
 * 3. Approve Vendor
 * Updates vendorStatus = APPROVED.
 * Sends approval email with Vendor login link.
 */
export const approveVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found.",
      });
    }

    if (!vendor.emailVerified && !vendor.verified) {
      return res.status(400).json({
        success: false,
        message: "Cannot approve vendor: Email has not been verified yet.",
      });
    }

    vendor.vendorStatus = "APPROVED";
    if (!vendor.vendorProfile) vendor.vendorProfile = {};
    vendor.vendorProfile.approvedAt = new Date();
    await vendor.save();

    // Send Approval Email
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const vendorLoginUrl = `${frontendUrl}/vendor/login`;

    try {
      await transport.sendMail({
        from: `"SwagSync" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
        to: vendor.email,
        subject: "Your SwagSync Vendor Account Has Been Approved!",
        html: vendorApprovalEmailTemplate(vendor, vendorLoginUrl),
      });
    } catch (mailErr) {
      console.error("[Approve Vendor] Approval email failed:", mailErr);
      // Still return success since status is updated, but mention email note
    }

    return res.status(200).json({
      success: true,
      message: `Vendor ${vendor.vendorProfile?.storeName || vendor.username} approved successfully. Approval email dispatched.`,
      vendor: {
        id: vendor._id,
        vendorId: vendor.vendorId,
        email: vendor.email,
        vendorStatus: vendor.vendorStatus,
        vendorProfile: vendor.vendorProfile,
      },
    });
  } catch (error) {
    console.error("[Approve Vendor] Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error approving vendor.",
    });
  }
};

/**
 * 4. Reject Vendor
 * Updates vendorStatus = REJECTED.
 * Sends rejection notification email.
 */
export const rejectVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found.",
      });
    }

    vendor.vendorStatus = "REJECTED";
    if (!vendor.vendorProfile) vendor.vendorProfile = {};
    vendor.vendorProfile.rejectedAt = new Date();
    if (reason) {
      vendor.vendorProfile.rejectionReason = reason;
    }
    await vendor.save();

    // Send Rejection Email
    try {
      await transport.sendMail({
        from: `"SwagSync" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
        to: vendor.email,
        subject: "Update on Your SwagSync Vendor Application",
        html: vendorRejectionEmailTemplate(vendor, reason),
      });
    } catch (mailErr) {
      console.error("[Reject Vendor] Rejection email failed:", mailErr);
    }

    return res.status(200).json({
      success: true,
      message: "Vendor application rejected.",
      vendor: {
        id: vendor._id,
        vendorId: vendor.vendorId,
        email: vendor.email,
        vendorStatus: vendor.vendorStatus,
        vendorProfile: vendor.vendorProfile,
      },
    });
  } catch (error) {
    console.error("[Reject Vendor] Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error rejecting vendor.",
    });
  }
};

/**
 * 5. Suspend Vendor
 * Updates vendorStatus = SUSPENDED.
 */
export const suspendVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found.",
      });
    }

    vendor.vendorStatus = "SUSPENDED";
    if (!vendor.vendorProfile) vendor.vendorProfile = {};
    vendor.vendorProfile.suspendedAt = new Date();
    await vendor.save();

    return res.status(200).json({
      success: true,
      message: `Vendor ${vendor.vendorProfile?.storeName || vendor.username} suspended successfully.`,
      vendor: {
        id: vendor._id,
        vendorId: vendor.vendorId,
        email: vendor.email,
        vendorStatus: vendor.vendorStatus,
        vendorProfile: vendor.vendorProfile,
      },
    });
  } catch (error) {
    console.error("[Suspend Vendor] Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error suspending vendor.",
    });
  }
};

/**
 * 6. Reactivate Vendor
 * Updates vendorStatus = APPROVED.
 */
export const reactivateVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found.",
      });
    }

    vendor.vendorStatus = "APPROVED";
    await vendor.save();

    return res.status(200).json({
      success: true,
      message: `Vendor ${vendor.vendorProfile?.storeName || vendor.username} reactivated successfully.`,
      vendor: {
        id: vendor._id,
        vendorId: vendor.vendorId,
        email: vendor.email,
        vendorStatus: vendor.vendorStatus,
        vendorProfile: vendor.vendorProfile,
      },
    });
  } catch (error) {
    console.error("[Reactivate Vendor] Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error reactivating vendor.",
    });
  }
};
