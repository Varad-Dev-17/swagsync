import Coupon from "../models/coupon.js";
import { createBroadcastNotification } from "../utils/notificationHelper.js";

// GET ALL COUPONS (ADMIN)
export const getAllCoupons = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
      discountType,
    } = req.query;

    const query = {};

    if (search && search.trim()) {
      query.$or = [
        { code: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (discountType && discountType !== "all") {
      query.discountType = discountType;
    }

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const now = new Date();

    const [coupons, total, totalActive, totalExpired] = await Promise.all([
      Coupon.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
      Coupon.countDocuments(query),
      Coupon.countDocuments({ status: "active", expiryDate: { $gte: now } }),
      Coupon.countDocuments({ expiryDate: { $lt: now } }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Coupons fetched successfully",
      data: {
        coupons,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 1,
        },
        stats: {
          total,
          active: totalActive,
          expired: totalExpired,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAllCoupons:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
      data: null,
    });
  }
};

// GET ACTIVE COUPONS (PUBLIC / USER BAG & ACCOUNT)
export const getActiveCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      status: "active",
      expiryDate: { $gte: now },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Filter out coupons whose usage limit is reached
    const availableCoupons = coupons.filter(
      (c) => !c.usageLimit || c.usageLimit === 0 || c.usedCount < c.usageLimit
    );

    const data = availableCoupons.map((c) => ({
      ...c,
      isUpcoming: Boolean(c.startDate && new Date(c.startDate) > now),
    }));

    return res.status(200).json({
      success: true,
      message: "Active coupons fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Error in getActiveCoupons:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active coupons",
      data: [],
    });
  }
};

// GET SINGLE COUPON BY ID
export const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id).lean();

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon fetched successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Error in getCouponById:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupon",
      data: null,
    });
  }
};

// VALIDATE COUPON (PUBLIC / BAG CHECKOUT)
export const validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal = 0 } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a coupon code",
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: `Coupon code "${cleanCode}" is invalid`,
      });
    }

    if (coupon.status !== "active") {
      return res.status(400).json({
        success: false,
        message: `Coupon "${cleanCode}" is inactive or disabled`,
      });
    }

    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      return res.status(400).json({
        success: false,
        message: `Coupon "${cleanCode}" will be active from ${new Date(
          coupon.startDate
        ).toLocaleDateString()}`,
      });
    }

    if (coupon.expiryDate && now > coupon.expiryDate) {
      return res.status(400).json({
        success: false,
        message: `Coupon "${cleanCode}" has expired`,
      });
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: `Coupon "${cleanCode}" usage limit has been exceeded`,
      });
    }

    const total = Number(cartTotal) || 0;
    if (coupon.minimumOrderAmount > 0 && total < coupon.minimumOrderAmount) {
      const remaining = coupon.minimumOrderAmount - total;
      return res.status(400).json({
        success: false,
        message: `Add items worth ₹${remaining} more to apply coupon "${cleanCode}" (Min. order ₹${coupon.minimumOrderAmount})`,
        minOrderAmount: coupon.minimumOrderAmount,
        remaining,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = Math.round((total * coupon.discountValue) / 100);
      if (coupon.maximumDiscount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, total);
    }

    return res.status(200).json({
      success: true,
      message: `Coupon "${cleanCode}" applied successfully! You saved ₹${discountAmount}`,
      data: {
        coupon: {
          _id: coupon._id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minimumOrderAmount: coupon.minimumOrderAmount,
          maximumDiscount: coupon.maximumDiscount,
        },
        discountAmount,
        finalTotal: Math.max(0, total - discountAmount),
      },
    });
  } catch (error) {
    console.error("Error in validateCoupon:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to validate coupon",
    });
  }
};

// CREATE COUPON (ADMIN)
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description = "",
      discountType,
      discountValue,
      minimumOrderAmount = 0,
      maximumDiscount = 0,
      usageLimit = 0,
      startDate,
      expiryDate,
      status = "active",
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    if (!["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Discount type must be either 'percentage' or 'fixed'",
      });
    }

    const numValue = Number(discountValue);
    if (isNaN(numValue) || numValue <= 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be a positive number",
      });
    }

    if (discountType === "percentage" && numValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    if (!expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Expiry date is required",
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Coupon with code "${cleanCode}" already exists`,
      });
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      description: description.trim(),
      discountType,
      discountValue: numValue,
      minimumOrderAmount: Number(minimumOrderAmount) || 0,
      maximumDiscount: Number(maximumDiscount) || 0,
      usageLimit: Number(usageLimit) || 0,
      usedCount: 0,
      startDate: startDate ? new Date(startDate) : new Date(),
      expiryDate: new Date(expiryDate),
      status: status || "active",
      createdBy: req.user?._id,
    });

    // If coupon is active, notify all users of the new coupon
    if (coupon.status === "active") {
      const discountDesc =
        coupon.discountType === "percentage"
          ? `${coupon.discountValue}% OFF`
          : `₹${coupon.discountValue} FLAT OFF`;
      createBroadcastNotification({
        type: "offers",
        title: `🎉 Special Offer: Use Code ${coupon.code}`,
        message: `Get ${discountDesc} on your order with coupon code ${coupon.code}! Check available coupons now.`,
        link: "/account/coupons",
        linkText: "View Coupons",
        iconType: "offer",
        color: "emerald",
        entityId: coupon._id.toString(),
      });
    }

    return res.status(201).json({
      success: true,
      message: `Coupon "${cleanCode}" created successfully`,
      data: coupon,
    });
  } catch (error) {
    console.error("Error in createCoupon:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create coupon",
    });
  }
};

// UPDATE COUPON (ADMIN)
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      description,
      discountType,
      discountValue,
      minimumOrderAmount,
      maximumDiscount,
      usageLimit,
      startDate,
      expiryDate,
      status,
    } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    if (code && code.trim().toUpperCase() !== coupon.code) {
      const cleanCode = code.trim().toUpperCase();
      const existing = await Coupon.findOne({
        code: cleanCode,
        _id: { $ne: id },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Coupon code "${cleanCode}" already exists`,
        });
      }
      coupon.code = cleanCode;
    }

    if (description !== undefined) coupon.description = description.trim();

    if (discountType !== undefined) {
      if (!["percentage", "fixed"].includes(discountType)) {
        return res.status(400).json({
          success: false,
          message: "Discount type must be 'percentage' or 'fixed'",
        });
      }
      coupon.discountType = discountType;
    }

    if (discountValue !== undefined) {
      const numValue = Number(discountValue);
      if (isNaN(numValue) || numValue <= 0) {
        return res.status(400).json({
          success: false,
          message: "Discount value must be a positive number",
        });
      }
      if (coupon.discountType === "percentage" && numValue > 100) {
        return res.status(400).json({
          success: false,
          message: "Percentage discount cannot exceed 100%",
        });
      }
      coupon.discountValue = numValue;
    }

    if (minimumOrderAmount !== undefined) {
      coupon.minimumOrderAmount = Number(minimumOrderAmount) || 0;
    }

    if (maximumDiscount !== undefined) {
      coupon.maximumDiscount = Number(maximumDiscount) || 0;
    }

    if (usageLimit !== undefined) {
      coupon.usageLimit = Number(usageLimit) || 0;
    }

    if (startDate !== undefined) {
      coupon.startDate = startDate ? new Date(startDate) : coupon.startDate;
    }

    if (expiryDate !== undefined) {
      coupon.expiryDate = new Date(expiryDate);
    }

    if (status !== undefined) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be 'active' or 'inactive'",
        });
      }
      coupon.status = status;
    }

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Error in updateCoupon:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update coupon",
    });
  }
};

// TOGGLE STATUS (ADMIN)
export const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    coupon.status = coupon.status === "active" ? "inactive" : "active";
    await coupon.save();

    return res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" status changed to ${coupon.status}`,
      data: coupon,
    });
  } catch (error) {
    console.error("Error in toggleCouponStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle coupon status",
    });
  }
};

// DELETE COUPON (ADMIN)
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Coupon "${coupon.code}" deleted successfully`,
      data: coupon,
    });
  } catch (error) {
    console.error("Error in deleteCoupon:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
    });
  }
};
