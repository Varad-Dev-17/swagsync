import crypto from "crypto";
import Razorpay from "razorpay";
import ReturnRequest from "../models/returnRequest.js";
import Order from "../models/order.js";
import Product from "../models/product.js";
import Variant from "../models/variant.js";
import Address from "../models/address.js";
import { addTimelineEvent, appendAdminNote, mergeAdminNotesSafe } from "../utils/timelineHelper.js";
import { RETURN_REQUEST_POPULATE_CONFIG, formatAndFilterNotes } from "../utils/populateHelper.js";
import { validateQcTransition, validateRefundTransition, validateReturnStatusTransition } from "../utils/returnValidationHelper.js";
import { createNotification } from "../utils/notificationHelper.js";

// INIT RAZORPAY PAYMENT FOR EXCHANGE DIFFERENCE
export const initRazorpayExchangePayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId, productId, requestedExchangeVariantId, quantity = 1 } = req.body;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const orderItem = order.items.find((item) => {
      const pId = typeof item.product === 'object' ? item.product?._id : item.product;
      return String(pId) === String(productId) || String(item._id) === String(productId);
    });

    if (!orderItem) {
      return res.status(404).json({ success: false, message: "Item not found in this order" });
    }

    const reqVariant = await Variant.findById(requestedExchangeVariantId);
    if (!reqVariant || reqVariant.product.toString() !== String(orderItem.product?._id || orderItem.product)) {
      return res.status(400).json({ success: false, message: "Invalid exchange variant selected" });
    }

    const originalPrice = (orderItem.price || orderItem.sellingPrice || 0) * quantity;
    const exchangePrice = (reqVariant.price || 0) * quantity;
    const priceDifference = exchangePrice - originalPrice;

    if (priceDifference <= 0) {
      return res.status(400).json({ success: false, message: "No extra payment required for this exchange" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(priceDifference * 100),
      currency: "INR",
      receipt: `exc_${userId.toString().slice(-6)}_${Date.now()}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      data: {
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
        priceDifference,
      },
    });
  } catch (error) {
    console.error("Init Razorpay Exchange Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to initialize exchange payment gateway",
    });
  }
};

// CREATE RETURN/EXCHANGE REQUEST
export const createReturnRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      orderId, // Order _id
      productId,
      variantId,
      quantity = 1,
      type,
      reason,
      additionalDetails,
      images,
      requestedExchangeVariantId,
      paymentMethod = "cod",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    // Validate Order exists and belongs to user
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        data: null,
      });
    }

    // Validate Product exists in Order
    const orderItem = order.items.find((item) => {
      const pId = typeof item.product === 'object' ? item.product?._id : item.product;
      const pMatch = String(pId) === String(productId) || String(item._id) === String(productId);
      if (!pMatch) return false;
      if (variantId) {
        const vId = typeof item.variant === 'object' ? item.variant?._id : item.variant;
        return String(vId) === String(variantId);
      }
      return true;
    });

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        message: "Product not found in this order",
        data: null,
      });
    }

    // Check order delivery status
    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Returns and exchanges can only be requested for delivered orders",
        data: null,
      });
    }

    // Check return window
    const returnWindowDays = 7;
    const deliveryDate = order.deliveredAt || order.updatedAt;
    const daysSinceDelivery = Math.floor(
      (new Date() - new Date(deliveryDate)) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDelivery > returnWindowDays) {
      return res.status(400).json({
        success: false,
        message: `Return window expired. Requests must be submitted within ${returnWindowDays} days of delivery`,
        data: null,
      });
    }

    // Check for existing active return request for this order & product
    const existingRequest = await ReturnRequest.findOne({
      order: orderId,
      product: productId,
      status: { $nin: ["rejected", "refunded", "exchanged", "completed"] }, // active statuses
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: "An active request already exists for this item",
        data: null,
      });
    }

    // Validate exchange logic & Price Calc
    let originalPrice = (orderItem.price || orderItem.sellingPrice || 0) * (quantity || 1);
    let exchangePrice = undefined;
    let priceDifference = undefined;
    let settlementType = undefined;
    let refundAmount = undefined;
    let paymentStatus = "not_required";

    if (type === "exchange") {
      if (!requestedExchangeVariantId) {
        return res.status(400).json({
          success: false,
          message: "Exchange variant must be selected for exchange requests",
          data: null,
        });
      }

      const reqVariant = await Variant.findById(requestedExchangeVariantId);
      if (!reqVariant || reqVariant.product.toString() !== productId) {
        return res.status(400).json({
          success: false,
          message: "Selected exchange variant is invalid or does not belong to this product",
          data: null,
        });
      }

      if (reqVariant.status !== "Active" || reqVariant.stock <= 0) {
        return res.status(400).json({
          success: false,
          message: "Selected exchange variant is out of stock or inactive",
          data: null,
        });
      }

      exchangePrice = (reqVariant.price || 0) * (quantity || 1);
      priceDifference = exchangePrice - originalPrice;

      if (priceDifference > 0) {
        settlementType = "additional_payment";
        if (paymentMethod === "razorpay") {
          if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({
              success: false,
              message: "Razorpay payment details are missing for extra amount",
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
              message: "Invalid payment verification signature",
              data: null,
            });
          }

          paymentStatus = "paid";
        } else {
          paymentStatus = "pending"; // COD - collect on delivery
        }
      } else if (priceDifference < 0) {
        settlementType = "refund";
        refundAmount = Math.abs(priceDifference);
      } else {
        settlementType = "no_difference";
      }
    } else if (type === "return") {
      settlementType = "refund";
      refundAmount = originalPrice;
    }

    const origVariantId = (typeof orderItem.variant === 'object' ? orderItem.variant?._id : orderItem.variant) || variantId || undefined;

    // Create request with initial states
    const returnRequest = new ReturnRequest({
      order: orderId,
      product: productId,
      originalVariant: origVariantId,
      user: userId,
      type,
      reason,
      additionalDetails,
      images: images || [],
      requestedExchangeVariant: type === "exchange" ? requestedExchangeVariantId : undefined,
      originalPrice,
      exchangePrice,
      priceDifference,
      settlementType,
      refundAmount,
      paymentMethod: settlementType === "additional_payment" ? paymentMethod : undefined,
      paymentStatus,
      razorpayOrderId: paymentMethod === "razorpay" ? razorpayOrderId : undefined,
      razorpayPaymentId: paymentMethod === "razorpay" ? razorpayPaymentId : undefined,
      razorpaySignature: paymentMethod === "razorpay" ? razorpaySignature : undefined,
      qcStatus: "pending",
      refundStatus: refundAmount && refundAmount > 0 ? "initiated" : "not_required",
    });

    // Automatically generate audit timeline event
    let eventDesc = `Customer submitted request. Reason: ${reason}`;
    if (type === "exchange") {
      if (settlementType === "additional_payment") {
        eventDesc += ` | Extra ₹${priceDifference} paid via ${paymentMethod.toUpperCase()} (${paymentStatus === "paid" ? "Online Paid" : "Collect on Delivery"})`;
      } else if (settlementType === "refund") {
        eventDesc += ` | Price Difference Refund of ₹${refundAmount} due to customer`;
      }
    }

    addTimelineEvent(
      returnRequest,
      type === "exchange" ? "Exchange Requested" : "Return Requested",
      eventDesc,
      "Customer",
      { reason, type, settlementType, priceDifference, paymentMethod, paymentStatus }
    );

    await returnRequest.save();

    // Send user notification for return/exchange request
    createNotification({
      userId,
      type: "returns",
      title: type === "exchange" ? "Exchange Requested" : "Return Requested",
      message: `Your ${type} request for order #${order.orderId || "item"} has been submitted and is under review.`,
      link: `/account/orders/${order._id}`,
      linkText: "View Request",
      iconType: "return",
      color: "text-amber-600 bg-amber-50 border-amber-100",
      entityId: returnRequest._id.toString(),
    });

    return res.status(201).json({
      success: true,
      message: "Request submitted successfully",
      data: formatAndFilterNotes(returnRequest.toObject(), true),
    });
  } catch (error) {
    console.error("Create Return Request Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit request",
      data: null,
    });
  }
};

// GET MY RETURN REQUESTS
export const getMyReturnRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    const requests = await ReturnRequest.find({ user: userId })
      .populate("product", "title images brand")
      .populate("originalVariant", "attributes")
      .populate("requestedExchangeVariant", "attributes")
      .sort({ createdAt: -1 })
      .lean();

    // Ensure customer-facing filtering (strip internal operational admin notes)
    const sanitizedRequests = formatAndFilterNotes(requests, true);

    return res.status(200).json({
      success: true,
      message: "Requests fetched successfully",
      data: sanitizedRequests,
    });
  } catch (error) {
    console.error("Get My Return Requests Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch requests",
      data: null,
    });
  }
};

// GET ALL RETURN REQUESTS (ADMIN)
export const getAllReturnRequestsAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      qcStatus,
      refundStatus,
      type,
      settlementType,
      startDate,
      endDate,
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (qcStatus) query.qcStatus = qcStatus;
    if (refundStatus) query.refundStatus = refundStatus;
    if (type) query.type = type;
    if (settlementType) query.settlementType = settlementType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [requests, total] = await Promise.all([
      ReturnRequest.find(query)
        .populate("user", "username email mobileNo gender")
        .populate("order", "orderId createdAt paymentMethod paymentStatus status")
        .populate("product", "title brand")
        .populate({
          path: "originalVariant",
          select: "mainImage attributes sku",
          populate: [
            { path: "attributes.attribute" },
            { path: "attributes.option" }
          ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ReturnRequest.countDocuments(query),
    ]);

    // Calculate stats
    const statsAggr = await ReturnRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    const stats = {
      pending: 0,
      approved: 0,
      packed: 0,
      shipped: 0,
      rejected: 0,
      pickup_scheduled: 0,
      picked_up: 0,
      received: 0,
      refunded: 0,
      exchanged: 0,
      total: total
    };
    statsAggr.forEach(s => {
      if (Object.prototype.hasOwnProperty.call(stats, s._id)) {
        stats[s._id] = s.count;
      }
    });

    return res.status(200).json({
      success: true,
      message: "Requests fetched successfully",
      data: {
        requests: formatAndFilterNotes(requests, false), // False = Admin sees all confidential notes
        stats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Get All Return Requests Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch requests",
      data: null,
    });
  }
};

// GET RETURN REQUEST BY ID (ADMIN)
export const getReturnRequestByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ReturnRequest.findById(id)
      .populate(RETURN_REQUEST_POPULATE_CONFIG)
      .lean();

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
        data: null,
      });
    }

    // Fallback for older orders that missed pincode in schema
    if (request.order && request.order.shippingAddress && !request.order.shippingAddress.pincode) {
      const userAddress = await Address.findOne({ userId: request.user?._id, isDefault: true }) || await Address.findOne({ userId: request.user?._id });
      if (userAddress) {
        request.order.shippingAddress.pincode = userAddress.pincode;
        if (!request.order.shippingAddress.state) request.order.shippingAddress.state = userAddress.state;
        if (!request.order.shippingAddress.country) request.order.shippingAddress.country = userAddress.country;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Return request fetched successfully",
      data: formatAndFilterNotes(request, false),
    });
  } catch (error) {
    console.error("Get Return Request Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch request",
      data: null,
    });
  }
};

// UPDATE RETURN REQUEST STATUS (ADMIN)
export const updateReturnRequestStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      qcStatus,
      qcReason,
      refundStatus,
      refundAmount,
      refundMethod,
      refundTransactionId,
      refundFailureReason,
      note,
      adminNotes,
      category,
      visibleToCustomer
    } = req.body;

    const request = await ReturnRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
        data: null,
      });
    }

    // Evaluate proposed targets against current document state
    const targetStatus = status !== undefined ? status : request.status;
    const targetQcStatus = qcStatus !== undefined ? qcStatus : request.qcStatus;
    const targetRefundStatus = refundStatus !== undefined ? refundStatus : request.refundStatus;

    // 1. Validate QC transition rules
    const qcValidation = validateQcTransition(request.status, targetStatus, targetQcStatus);
    if (!qcValidation.isValid) {
      return res.status(400).json({ success: false, message: qcValidation.message, data: null });
    }

    // 2. Validate Refund transition rules
    const refundValidation = validateRefundTransition(request.refundStatus, targetRefundStatus, targetQcStatus, request.type);
    if (!refundValidation.isValid) {
      return res.status(400).json({ success: false, message: refundValidation.message, data: null });
    }

    // 3. Validate overall Return Request status transition rules
    const statusValidation = validateReturnStatusTransition(request.status, targetStatus, targetQcStatus, request.type);
    if (!statusValidation.isValid) {
      return res.status(400).json({ success: false, message: statusValidation.message, data: null });
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
        request,
        note,
        adminName,
        category || "admin",
        visibleToCustomer !== false && visibleToCustomer !== "false"
      );
    } else if (adminNotes && Array.isArray(adminNotes)) {
      mergeAdminNotesSafe(request, adminNotes, "Admin");
    }

    // Handle Quality Check (QC) mutations & timeline generation
    if (qcStatus && qcStatus !== request.qcStatus) {
      request.qcStatus = qcStatus;
      if (qcReason !== undefined) request.qcReason = qcReason;

      const eventType = qcStatus === "passed" ? "QC Passed" : qcStatus === "failed" ? "QC Failed" : "QC Status Updated";
      const desc = qcStatus === "failed"
        ? `Quality inspection failed. Reason: ${qcReason || "Not specified"}`
        : `Quality inspection completed successfully: ${qcStatus.toUpperCase()}`;

      addTimelineEvent(request, eventType, desc, "Warehouse", { qcStatus, qcReason: qcReason || request.qcReason });
    } else if (qcReason !== undefined && qcReason !== request.qcReason) {
      request.qcReason = qcReason;
    }

    // Handle Refund status mutations & timeline generation
    if (refundStatus && refundStatus !== request.refundStatus) {
      request.refundStatus = refundStatus;
      if (refundStatus === "completed" && !request.refundProcessedAt) {
        request.refundProcessedAt = new Date();
      }

      let eventType = "Refund Updated";
      if (refundStatus === "initiated") eventType = "Refund Initiated";
      else if (refundStatus === "processing") eventType = "Refund Processing";
      else if (refundStatus === "completed") eventType = "Refund Completed";
      else if (refundStatus === "failed") eventType = "Refund Failed";

      let desc = `Refund status advanced to ${refundStatus.toUpperCase()}.`;
      if (refundStatus === "failed" && (refundFailureReason || request.refundFailureReason)) {
        desc += ` Failure Reason: ${refundFailureReason || request.refundFailureReason}`;
      } else if (refundStatus === "completed") {
        desc += ` Settled via ${refundMethod || request.refundMethod || "original mode"}.`;
      }

      addTimelineEvent(request, eventType, desc, "Finance", {
        refundStatus,
        refundAmount: refundAmount || request.refundAmount,
        refundMethod: refundMethod || request.refundMethod,
        refundTransactionId: refundTransactionId || request.refundTransactionId
      });
    }

    if (refundAmount !== undefined) request.refundAmount = refundAmount;
    if (refundMethod !== undefined) request.refundMethod = refundMethod;
    if (refundTransactionId !== undefined) request.refundTransactionId = refundTransactionId;
    if (refundFailureReason !== undefined) request.refundFailureReason = refundFailureReason;

    const previousStatus = request.status;
    const previousRefundStatus = request.refundStatus;

    // Handle Return Status mutations & timeline generation
    if (status && status !== previousStatus) {
      // Stock update rules if completed / exchanged
      if ((status === "exchanged" || status === "completed") && previousStatus !== "exchanged" && previousStatus !== "completed") {
        const Variant = (await import("../models/variant.js")).default;
        const qty = Number(request.quantity) || 1;

        if (request.type === "exchange") {
          // 1. Decrement replacement variant stock (dispatched to customer)
          if (request.requestedExchangeVariant) {
            await Variant.findByIdAndUpdate(request.requestedExchangeVariant, {
              $inc: { stock: -qty },
            });
          }
          // 2. Increment returning original variant stock (returned back to warehouse)
          if (request.originalVariant) {
            await Variant.findByIdAndUpdate(request.originalVariant, {
              $inc: { stock: qty },
            });
          }
        } else if (request.type === "return") {
          // Increment returned item stock back into warehouse inventory
          if (request.originalVariant) {
            await Variant.findByIdAndUpdate(request.originalVariant, {
              $inc: { stock: qty },
            });
          }
        }
      }

      const isExchangeRequest = request.type === "exchange";
      const eventMap = isExchangeRequest ? {
        approved: ["Exchange Approved", "Exchange request verified and replacement product reserved.", "Admin"],
        rejected: ["Exchange Rejected", "Exchange request reviewed and declined by admin.", "Admin"],
        pickup_replace: ["Pickup & Replace", "Courier en route with replacement product for simultaneous doorstep exchange.", "Logistics"],
        completed: ["Exchange Completed", "Replacement product successfully handed over and exchange completed.", "Courier"],
        // Legacy aliases
        packed: ["Packed", "Replacement product packed and verified at facility.", "Warehouse"],
        shipped: ["Shipped", "Replacement product dispatched via logistics carrier.", "Warehouse"],
        pickup_scheduled: ["Pickup & Replace", "Courier en route with replacement product for simultaneous doorstep exchange.", "Logistics"],
        picked_up: ["Pickup & Replace", "Doorstep pickup and replacement initiated.", "Courier"],
        received: ["Received at Facility", "Returned item logged at facility.", "Warehouse"],
        exchanged: ["Exchange Completed", "Replacement product successfully handed over and exchange completed.", "Courier"]
      } : {
        approved: ["Return Approved", "Request reviewed and approved by admin.", "Admin"],
        rejected: ["Return Rejected", "Request reviewed and declined by admin.", "Admin"],
        pickup: ["Pickup", "Courier assigned for item collection from customer address.", "Logistics"],
        completed: ["Return Completed", "Return fulfilled, item received and return closed.", "Finance"],
        // Legacy aliases
        pickup_scheduled: ["Pickup", "Logistics courier scheduled for collection.", "Warehouse"],
        picked_up: ["Pickup", "Item picked up by courier from customer location.", "Warehouse"],
        received: ["Pickup", "Returned product received and logged at warehouse.", "Warehouse"],
        refunded: ["Return Completed", "Return closed and refund finalized.", "Finance"],
        exchanged: ["Return Completed", "Return request completed.", "Warehouse"]
      };

      const [evType, evDesc, perfBy] = eventMap[status] || [`Status Changed to ${status}`, `Status updated to ${status}.`, "Admin"];
      addTimelineEvent(request, evType, evDesc, perfBy, { oldStatus: previousStatus, newStatus: status });

      request.status = status;
    }

    await request.save();

    // Send user notification if status changed
    if (status && status !== previousStatus) {
      const displayStatus = status === "pickup_replace" 
        ? "Pickup & Replace" 
        : status === "completed" 
          ? (request.type === "exchange" ? "Exchange Completed" : "Return Completed")
          : status.replace(/_/g, " ");

      createNotification({
        userId: request.user,
        type: "returns",
        title: `${request.type === "exchange" ? "Exchange" : "Return"}: ${displayStatus.toUpperCase()}`,
        message: `Your ${request.type} request status has been updated to ${displayStatus}.`,
        link: request.order ? `/account/orders/${request.order._id || request.order}` : "/account/orders",
        linkText: "View Request",
        iconType: "return",
        color: status === "approved" || status === "completed" || status === "refunded" || status === "exchanged" 
          ? "text-emerald-600 bg-emerald-50 border-emerald-100" 
          : status === "rejected" 
            ? "text-red-600 bg-red-50 border-red-100" 
            : "text-amber-600 bg-amber-50 border-amber-100",
        entityId: request._id.toString(),
      });
    }

    // Automatically synchronize Order's paymentStatus when refund is finalized
    if ((request.refundStatus === "completed" || request.status === "refunded" || request.status === "completed") && request.order && request.type === "return") {
      await Order.findByIdAndUpdate(request.order, { paymentStatus: "refunded" });
    }

    // Reload fully populated data
    const populatedRequest = await ReturnRequest.findById(id)
      .populate(RETURN_REQUEST_POPULATE_CONFIG)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Request updated successfully",
      data: formatAndFilterNotes(populatedRequest, false),
    });
  } catch (error) {
    console.error("Update Return Request Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update request",
      data: null,
    });
  }
};

// 1-CLICK AUTOMATED RAZORPAY REFUND (Admin)
export const processRazorpayRefundAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ReturnRequest.findById(id).populate("order");
    if (!request) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    const order = request.order;
    const paymentId = order?.razorpayPaymentId || request.razorpayPaymentId;
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "No Razorpay payment ID found on this order to refund against.",
      });
    }

    const refundAmount = Number(request.refundAmount || request.originalPrice || 0);
    if (refundAmount <= 0) {
      return res.status(400).json({ success: false, message: "Refund amount must be greater than 0" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(refundAmount * 100),
      notes: {
        returnRequestId: request._id.toString(),
        orderId: order.orderId || order._id.toString(),
      },
    });

    request.refundStatus = "completed";
    request.refundMethod = "RAZORPAY";
    request.refundTransactionId = refund.id;
    request.refundProcessedAt = new Date();

    addTimelineEvent(
      request,
      "Refund Completed",
      `₹${refundAmount.toLocaleString("en-IN")} refunded automatically via Razorpay (Refund ID: ${refund.id}).`,
      "Finance",
      { refundId: refund.id, amount: refundAmount, gateway: "Razorpay" }
    );

    await request.save();

    // Synchronize order payment status
    if (order && request.type === "return") {
      await Order.findByIdAndUpdate(order._id, { paymentStatus: "refunded" });
    }

    const populatedRequest = await ReturnRequest.findById(id)
      .populate(RETURN_REQUEST_POPULATE_CONFIG)
      .lean();

    return res.status(200).json({
      success: true,
      message: `₹${refundAmount.toLocaleString("en-IN")} refunded successfully via Razorpay!`,
      data: formatAndFilterNotes(populatedRequest, false),
    });
  } catch (error) {
    console.error("Razorpay Refund Error:", error);
    return res.status(500).json({
      success: false,
      message: error.error?.description || error.message || "Failed to process Razorpay refund",
    });
  }
};
