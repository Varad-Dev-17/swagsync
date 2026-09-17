import Order from "../models/order.js";
import Cart from "../models/cart.js";
import Address from "../models/address.js";
import Coupon from "../models/coupon.js";
import transport from "../middlewares/sendMail.js";
import { orderEmailTemplate } from "../utils/orderEmailTemplate.js";
import { cancelEmailTemplate } from "../utils/cancelEmailTemplate.js";
import { getNextSequence } from "../utils/counterHelper.js";
import { addTimelineEvent, appendAdminNote, mergeAdminNotesSafe } from "../utils/timelineHelper.js";
import { ORDER_POPULATE_CONFIG, formatAndFilterNotes } from "../utils/populateHelper.js";
import crypto from "crypto";
import Razorpay from "razorpay";
import { createNotification } from "../utils/notificationHelper.js";

// GET ALL ORDERS (Admin)
export const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
      paymentStatus,
      paymentMethod,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    if (search.trim()) {
      query.$or = [
        { orderId: { $regex: search.trim(), $options: "i" } },
        { "shippingAddress.name": { $regex: search.trim(), $options: "i" } },
        { "shippingAddress.email": { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate(ORDER_POPULATE_CONFIG)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: {
        orders: formatAndFilterNotes(orders, false), // False = Admin sees all confidential notes
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      data: null,
    });
  }
};

// GET ORDER BY ID (Admin)
export const getAdminOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate(ORDER_POPULATE_CONFIG)
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        data: null,
      });
    }

    // Fallback for older orders that missed pincode in schema
    if (order.shippingAddress && !order.shippingAddress.pincode) {
      const userAddress = await Address.findOne({ userId: order.user?._id, isDefault: true }) || await Address.findOne({ userId: order.user?._id });
      if (userAddress) {
        order.shippingAddress.pincode = userAddress.pincode;
        if (!order.shippingAddress.state) order.shippingAddress.state = userAddress.state;
        if (!order.shippingAddress.country) order.shippingAddress.country = userAddress.country;
      }
    }

    // Also fetch any return requests associated with this order
    const ReturnRequest = (await import("../models/returnRequest.js")).default;
    const returnRequests = await ReturnRequest.find({ order: id })
      .populate("product", "title images brand price")
      .populate({
        path: "originalVariant",
        select: "mainImage attributes sku price",
        populate: [{ path: "attributes.attribute" }, { path: "attributes.option" }],
      })
      .populate({
        path: "requestedExchangeVariant",
        select: "mainImage attributes sku price",
        populate: [{ path: "attributes.attribute" }, { path: "attributes.option" }],
      })
      .lean();

    const fullPayload = {
      ...order,
      returnRequests,
    };

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: formatAndFilterNotes(fullPayload, false), // False = Admin sees all confidential notes
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      data: null,
    });
  }
};

// GET USER ORDERS
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status, time } = req.query;

    const query = { user: userId };
    if (status && status !== 'all') query.status = status;

    if (time && time !== 'anytime') {
      const now = new Date();
      if (time === 'last_30_days') {
        query.createdAt = { $gte: new Date(now.setDate(now.getDate() - 30)) };
      } else if (time === 'last_6_months') {
        query.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 6)) };
      } else if (time === 'last_year') {
        query.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
      }
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate({
          path: "items.product",
          select: "title brand slug",
          populate: { path: "brand", select: "name" }
        })
        .populate({
          path: "items.variant",
          select: "mainImage attributes",
          populate: [
            { path: "attributes.attribute" },
            { path: "attributes.option" }
          ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: {
        orders: formatAndFilterNotes(orders, true), // True = Strip internal operational notes
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      data: null,
    });
  }
};

// GET ORDER BY ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.isAdmin;

    const order = await Order.findById(id)
      .populate(ORDER_POPULATE_CONFIG)
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        data: null,
      });
    }

    // Users can only view their own orders unless admin
    if (!isAdmin && order.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
        data: null,
      });
    }

    const ReturnRequest = (await import("../models/returnRequest.js")).default;
    const returnRequests = await ReturnRequest.find({ order: id })
      .populate("product", "title images brand price returnPolicy")
      .populate({
        path: "originalVariant",
        select: "mainImage attributes sku price",
        populate: [{ path: "attributes.attribute" }, { path: "attributes.option" }],
      })
      .populate({
        path: "requestedExchangeVariant",
        select: "mainImage attributes sku price",
        populate: [{ path: "attributes.attribute" }, { path: "attributes.option" }],
      })
      .lean();

    const fullPayload = {
      ...order,
      returnRequests,
    };

    return res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: formatAndFilterNotes(fullPayload, !isAdmin), // Protect confidential notes if not admin
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      data: null,
    });
  }
};

// INIT RAZORPAY ORDER
export const initRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { shippingAddress, couponCode } = req.body;

    if (!shippingAddress || !shippingAddress.name || !shippingAddress.address || !shippingAddress.city || !shippingAddress.phone) {
      return res.status(400).json({ success: false, message: "Complete shipping address is required" });
    }

    const cart = await Cart.findOne({ userId }).populate("products.productId");
    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    let subtotal = 0;
    let taxAmount = 0;
    const Variant = (await import("../models/variant.js")).default;

    for (const item of cart.products) {
      const product = item.productId;
      if (!product || product.status !== "Active") {
        continue;
      }

      const variant = await Variant.findById(item.variantId);
      if (!variant) {
        continue;
      }
      
      if (variant.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Only ${variant.stock} items available for ${product.title}` });
      }

      const itemSellingPrice = variant.price * item.quantity;
      const gstRate = variant.gstRate || 0;
      const itemBasePrice = itemSellingPrice / (1 + (gstRate / 100));
      const itemGSTAmount = itemSellingPrice - itemBasePrice;

      subtotal += itemSellingPrice;
      taxAmount += itemGSTAmount;
    }

    let couponDiscount = 0;
    if (couponCode?.trim()) {
      const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase(), status: "active", isActive: true });
      if (coupon) {
        const now = new Date();
        const isValid = (!coupon.startDate || now >= coupon.startDate) &&
          (!coupon.endDate || now <= coupon.endDate) &&
          (coupon.usageLimit === null || coupon.usageCount < coupon.usageLimit) &&
          subtotal >= coupon.minOrderAmount;

        if (isValid) {
          if (coupon.type === "percentage") {
            couponDiscount = (subtotal * coupon.value) / 100;
          } else {
            couponDiscount = coupon.value;
          }
          if (coupon.maxDiscountAmount && couponDiscount > coupon.maxDiscountAmount) {
            couponDiscount = coupon.maxDiscountAmount;
          }
        }
      }
    }

    const finalSubtotal = Math.max(0, subtotal - couponDiscount);
    let shippingAmount = 0;
    if (finalSubtotal < 500) shippingAmount = 99;
    else if (finalSubtotal < 1000) shippingAmount = 49;
    else shippingAmount = 0;

    const totalAmount = finalSubtotal + taxAmount + shippingAmount;

    // Create Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create Razorpay order
    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `receipt_${userId}_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      data: {
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to initialize Razorpay order",
    });
  }
};

// CREATE ORDER (from cart)
export const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { shippingAddress, couponCode, paymentMethod = "cod", razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (
      !shippingAddress ||
      !shippingAddress.name ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.phone
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping address is required",
        data: null,
      });
    }

    if (paymentMethod === "razorpay") {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({
          success: false,
          message: "Razorpay payment details are missing",
          data: null,
        });
      }
      
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");
        
      if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment signature",
          data: null,
        });
      }
    }

    const cart = await Cart.findOne({ userId }).populate("products.productId");
    if (!cart || cart.products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
        data: null,
      });
    }

    let subtotal = 0;
    let totalMRP = 0;
    let taxAmount = 0;
    const orderItems = [];
    const Variant = (await import("../models/variant.js")).default;

    for (const item of cart.products) {
      const product = item.productId;

      if (!product || product.status !== "Active") {
        continue; // Skip ghost/inactive products
      }

      const variant = await Variant.findById(item.variantId);
      if (!variant) {
        continue; // Skip deleted variants
      }
      
      if (variant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${variant.stock} items available for ${product.title}`,
          data: null,
        });
      }

      const itemMRP = (variant.mrp || variant.price) * item.quantity;
      const itemSellingPrice = variant.price * item.quantity;
      const gstRate = variant.gstRate || 0;
      
      const itemBasePrice = itemSellingPrice / (1 + (gstRate / 100));
      const itemGSTAmount = itemSellingPrice - itemBasePrice;

      subtotal += itemSellingPrice;
      totalMRP += itemMRP;
      taxAmount += itemGSTAmount;

      orderItems.push({
        product: product._id,
        variant: variant._id,
        quantity: item.quantity,
        mrp: variant.mrp || variant.price,
        sellingPrice: variant.price,
        basePrice: variant.price / (1 + (gstRate / 100)),
        gstRate: gstRate,
        gstAmount: variant.price - (variant.price / (1 + (gstRate / 100))),
      });
    }

    let couponDiscount = 0;
    let couponApplied = null;

    if (couponCode?.trim()) {
      const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        status: "active",
        isActive: true,
      });

      if (coupon) {
        const now = new Date();
        const isValid =
          (!coupon.startDate || now >= coupon.startDate) &&
          (!coupon.endDate || now <= coupon.endDate) &&
          (coupon.usageLimit === null || coupon.usageCount < coupon.usageLimit) &&
          subtotal >= coupon.minOrderAmount;

        if (isValid) {
          if (coupon.type === "percentage") {
            couponDiscount = (subtotal * coupon.value) / 100;
          } else {
            couponDiscount = coupon.value;
          }

          if (coupon.maxDiscountAmount && couponDiscount > coupon.maxDiscountAmount) {
            couponDiscount = coupon.maxDiscountAmount;
          }

          couponApplied = {
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
          };

          coupon.usageCount += 1;
          await coupon.save();
        }
      }
    }

    const finalSubtotal = Math.max(0, subtotal - couponDiscount);
    
    let shippingAmount = 0;
    if (finalSubtotal < 500) shippingAmount = 99;
    else if (finalSubtotal < 1000) shippingAmount = 49;
    else shippingAmount = 0;

    const totalAmount = finalSubtotal + taxAmount + shippingAmount;
    const totalDiscountAmount = (totalMRP - subtotal) + couponDiscount;
    
    let orderId = "";
    try {
      const seq = await getNextSequence('orderId');
      orderId = `ORD-${seq}`;
    } catch (err) {
      console.error("Failed to generate orderId sequence", err);
      orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }

    const order = new Order({
      orderId,
      user: userId,
      items: orderItems,
      shippingAddress,
      totalMRP: Math.round(totalMRP * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(totalDiscountAmount * 100) / 100,
      shippingAmount: Math.round(shippingAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      coupon: couponApplied,
      paymentMethod,
      razorpayOrderId: paymentMethod === "razorpay" ? razorpayOrderId : undefined,
      razorpayPaymentId: paymentMethod === "razorpay" ? razorpayPaymentId : undefined,
      razorpaySignature: paymentMethod === "razorpay" ? razorpaySignature : undefined,
      paymentStatus: paymentMethod === "razorpay" ? "paid" : "pending",
      status: "pending",
    });

    const roundedPaidAmount = Math.round(order.totalAmount || totalAmount).toLocaleString('en-IN');

    // Automatically generate initial order audit timeline event
    addTimelineEvent(
      order,
      "Order Created",
      `Order ${orderId} confirmed via ${paymentMethod.toUpperCase()}. Total amount: ₹${roundedPaidAmount}`,
      "Customer",
      { orderId, totalAmount: order.totalAmount, paymentMethod, couponCode: couponApplied ? couponApplied.code : null }
    );

    await order.save();

    // Send user notification for placed order
    createNotification({
      userId: req.user.userId,
      type: "orders",
      title: "Order Placed Successfully!",
      message: `Your order #${orderId} for ₹${roundedPaidAmount} has been confirmed.`,
      link: `/account/orders/${order._id}`,
      linkText: "Track Order",
      iconType: "package",
      color: "blue",
      entityId: orderId,
    });

    for (const item of cart.products) {
      await Variant.findByIdAndUpdate(item.variantId, {
        $inc: { stock: -item.quantity },
      });
    }

    cart.products = [];
    await cart.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("items.product", "title images price")
      .populate({
        path: "items.variant",
        populate: [
          { path: "attributes.attribute" },
          { path: "attributes.option" }
        ]
      })
      .populate("user", "username email")
      .lean();

    try {
      if (populatedOrder.user && populatedOrder.user.email) {
        transport.sendMail({
          from: `"SwagSync Orders" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
          to: populatedOrder.user.email,
          subject: `Order Confirmation - ${orderId}`,
          html: orderEmailTemplate(populatedOrder, populatedOrder.user),
        }).catch(emailError => {
          console.error("Failed to send order confirmation email:", emailError);
        });
      }
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: formatAndFilterNotes(populatedOrder, true),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      data: null,
    });
  }
};

// UPDATE ORDER STATUS (Admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, trackingNumber, note, adminNotes, category, visibleToCustomer } = req.body;

    const validStatuses = ["pending", "processing", "packed", "shipped", "on_the_way", "delivered", "cancelled", "delayed"];
    const validPaymentStatuses = ["pending", "paid", "failed", "refunded"];

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        data: null,
      });
    }

    // Handle Admin Notes using strict APPEND-ONLY utilities
    if (note && typeof note === "string" && note.trim() !== "") {
      let adminName = "Admin";
      if (req.user && req.user.userId) {
        const User = (await import("../models/user.js")).default;
        const adminUser = await User.findById(req.user.userId).select("username email").lean();
        if (adminUser) adminName = adminUser.username || adminUser.email || "Admin";
      }
      appendAdminNote(
        order,
        note,
        adminName,
        category || "admin",
        visibleToCustomer !== false && visibleToCustomer !== "false"
      );
    } else if (adminNotes && Array.isArray(adminNotes)) {
      mergeAdminNotesSafe(order, adminNotes, "Admin");
    }

    const previousStatus = order.status;

    if (status && status !== order.status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status", data: null });
      }

      const transitionRules = {
        pending: ["processing", "packed", "shipped", "on_the_way", "delivered", "cancelled", "delayed"],
        processing: ["packed", "shipped", "on_the_way", "delivered", "cancelled", "delayed"],
        packed: ["shipped", "on_the_way", "delivered", "cancelled", "delayed"],
        shipped: ["on_the_way", "delivered", "cancelled", "delayed"],
        on_the_way: ["delivered", "cancelled", "delayed"],
        delayed: ["processing", "packed", "shipped", "on_the_way", "delivered", "cancelled"],
        delivered: [],
        cancelled: [],
      };

      if (!transitionRules[previousStatus].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${previousStatus} to ${status}`,
          data: null,
        });
      }

      // Handle cancellation - restore stock
      if (status === "cancelled" && previousStatus !== "cancelled") {
        const Variant = (await import("../models/variant.js")).default;
        for (const item of order.items) {
          if (item.variant) {
            await Variant.findByIdAndUpdate(item.variant, {
              $inc: { stock: item.quantity },
            });
          }
        }
      }

      if (status === "delivered" && previousStatus !== "delivered") {
        order.deliveredAt = new Date();
        if (!paymentStatus && order.paymentStatus === "pending") {
          order.paymentStatus = "paid";
        }
      } else if (status !== "delivered" && previousStatus === "delivered") {
        order.deliveredAt = null;
      }
      order.status = status;
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item.status !== "cancelled") {
            item.status = status;
          }
        });
      }

      const eventMap = {
        processing: ["Processing Started", "Order items inspected and packaging started.", "Warehouse"],
        packed: ["Order Packed", "Order items have been inspected, verified, and securely packed.", "Warehouse"],
        shipped: ["Shipped", `Order handed over to delivery partner.${trackingNumber || order.trackingNumber ? ` AWB/Tracking: ${trackingNumber || order.trackingNumber}` : ""}`, "Warehouse"],
        on_the_way: ["Out for Delivery", "Order is out for delivery and arriving soon.", "Courier"],
        delivered: ["Delivered", "Order package successfully delivered to customer.", "Warehouse"],
        cancelled: ["Cancelled", "Order cancelled by admin and item stock restored.", "Admin"],
        delayed: ["Delayed", "Order processing or transit has encountered a slight delay.", "Admin"]
      };

      const [evType, evDesc, perfBy] = eventMap[status] || [`Status Updated to ${status}`, `Status advanced to ${status}.`, "Admin"];
      addTimelineEvent(order, evType, evDesc, perfBy, { oldStatus: previousStatus, newStatus: status, trackingNumber: trackingNumber || order.trackingNumber });
    }

    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;

    await order.save();

    // Send user notification if status changed
    if (status && status !== previousStatus) {
      const statusTitles = {
        processing: "Order Processing",
        packed: "Order Packed!",
        shipped: "Order Shipped!",
        on_the_way: "Out for Delivery!",
        delivered: "Order Delivered Successfully!",
        cancelled: "Order Cancelled",
        delayed: "Order Delivery Delayed",
      };
      const title = statusTitles[status] || `Order Status: ${status}`;
      createNotification({
        userId: order.user,
        type: "orders",
        title,
        message: `Your order #${order.orderId} status has been updated to ${status.replace(/_/g, " ")}.`,
        link: `/account/orders/${order._id}`,
        linkText: "Track Order",
        iconType: "package",
        color: status === "delivered" 
          ? "text-emerald-600 bg-emerald-50 border-emerald-100" 
          : status === "cancelled" 
            ? "text-red-600 bg-red-50 border-red-100" 
            : "text-blue-600 bg-blue-50 border-blue-100",
        entityId: order.orderId,
      });
    }

    const populatedOrder = await Order.findById(id)
      .populate(ORDER_POPULATE_CONFIG)
      .lean();

    const ReturnRequest = (await import("../models/returnRequest.js")).default;
    const returnRequests = await ReturnRequest.find({ order: id })
      .populate("product", "title images brand price")
      .populate({
        path: "originalVariant",
        select: "mainImage attributes sku price",
        populate: [{ path: "attributes.attribute" }, { path: "attributes.option" }],
      })
      .populate({
        path: "requestedExchangeVariant",
        select: "mainImage attributes sku price",
        populate: [{ path: "attributes.attribute" }, { path: "attributes.option" }],
      })
      .lean();

    const fullPayload = {
      ...populatedOrder,
      returnRequests,
    };

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: formatAndFilterNotes(fullPayload, false),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order",
      data: null,
    });
  }
};

// UPDATE INDIVIDUAL ORDER ITEM STATUS (Admin)
export const updateOrderItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, productId, status, trackingNumber, courier } = req.body;

    const validStatuses = ["pending", "processing", "packed", "shipped", "on_the_way", "delivered", "cancelled", "delayed"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status provided", data: null });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found", data: null });
    }

    let targetItem = null;
    if (itemId) {
      targetItem = order.items.find((item) => String(item._id) === String(itemId) || (item._id && String(item._id.toString()) === String(itemId)));
    }
    if (!targetItem && productId) {
      targetItem = order.items.find((item) => String(item.product) === String(productId) || (item.product && String(item.product.toString()) === String(productId)));
    }
    if (!targetItem && typeof itemId === "number" && order.items[itemId]) {
      targetItem = order.items[itemId];
    }

    if (!targetItem) {
      return res.status(404).json({ success: false, message: "Order item not found in order", data: null });
    }

    const oldStatus = targetItem.status || order.status;
    targetItem.status = status;
    if (trackingNumber !== undefined) targetItem.trackingNumber = trackingNumber;
    if (courier !== undefined) targetItem.courier = courier;

    // Add timeline event
    const Product = (await import("../models/product.js")).default;
    const prodDoc = await Product.findById(targetItem.product).select("title").lean();
    const prodTitle = prodDoc ? prodDoc.title : "Product Item";

    addTimelineEvent(
      order,
      `Item Status: ${status.toUpperCase()}`,
      `[${prodTitle}] status updated from ${oldStatus} to ${status} by Admin.`,
      "Admin",
      { itemId: targetItem._id, productId: targetItem.product, oldStatus, newStatus: status, trackingNumber, courier }
    );

    // If all active items now share the same status, sync master order status
    const activeItems = order.items.filter((item) => item.status !== "cancelled");
    if (activeItems.length > 0 && activeItems.every((item) => item.status === status)) {
      order.status = status;
    }

    await order.save();

    const populatedOrder = await Order.findById(id)
      .populate(ORDER_POPULATE_CONFIG)
      .lean();

    const ReturnRequest = (await import("../models/returnRequest.js")).default;
    const returnRequests = await ReturnRequest.find({ order: id })
      .populate("product", "title images brand price")
      .populate({
        path: "originalVariant",
        select: "mainImage attributes sku price",
        populate: [{ path: "attributes.attribute" }, { path: "attributes.option" }],
      })
      .populate({
        path: "requestedExchangeVariant",
        select: "mainImage attributes sku price",
        populate: [{ path: "attributes.attribute" }, { path: "attributes.option" }],
      })
      .lean();

    const fullPayload = {
      ...populatedOrder,
      returnRequests,
    };

    return res.status(200).json({
      success: true,
      message: "Order item status updated successfully",
      data: formatAndFilterNotes(fullPayload, false),
    });
  } catch (error) {
    console.error("Error updating order item status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update item status",
      data: null,
    });
  }
};

// CANCEL ORDER (User)
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const order = await Order.findOne({ _id: id, user: userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        data: null,
      });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled",
        data: null,
      });
    }

    const Variant = (await import("../models/variant.js")).default;
    for (const item of order.items) {
      if (item.variant) {
        await Variant.findByIdAndUpdate(item.variant, {
          $inc: { stock: item.quantity },
        });
      }
    }

    order.status = "cancelled";

    // Append timeline audit event
    addTimelineEvent(
      order,
      "Order Cancelled",
      "Order was cancelled directly by customer before dispatch.",
      "Customer",
      { status: "cancelled" }
    );

    await order.save();

    const populatedOrder = await Order.findById(id)
      .populate(ORDER_POPULATE_CONFIG)
      .lean();

    try {
      if (populatedOrder.user && populatedOrder.user.email) {
        transport.sendMail({
          from: `"SwagSync Orders" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
          to: populatedOrder.user.email,
          subject: `Order Cancelled - ${populatedOrder.orderId}`,
          html: cancelEmailTemplate(populatedOrder, populatedOrder.user),
        }).catch(emailError => {
          console.error("Failed to send order cancellation email:", emailError);
        });
      }
    } catch (emailError) {
      console.error("Failed to send order cancellation email:", emailError);
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: formatAndFilterNotes(populatedOrder, true),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      data: null,
    });
  }
};

// GET ORDER STATS (Admin)
export const getOrderStats = async (req, res) => {
  try {
    const Order = (await import("../models/order.js")).default;
    const stats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments();
    
    const formattedStats = {
      total: totalOrders,
      pending: 0,
      processing: 0,
      packed: 0,
      shipped: 0,
      on_the_way: 0,
      delivered: 0,
      cancelled: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'processing') {
        formattedStats.packed = (formattedStats.packed || 0) + stat.count;
      } else if (Object.prototype.hasOwnProperty.call(formattedStats, stat._id)) {
        formattedStats[stat._id] = stat.count;
      }
    });

    return res.status(200).json({
      success: true,
      message: "Order stats fetched successfully",
      data: formattedStats
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order stats",
      data: null
    });
  }
};
