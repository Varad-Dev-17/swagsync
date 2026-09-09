import "../models/user.js";
import "../models/product.js";
import "../models/variant.js";
import "../models/brand.js";
import "../models/category.js";
import "../models/attribute.js";
import "../models/attributeOption.js";
import "../models/order.js";
import "../models/address.js";

/**
 * Centralized populate configurations for Order queries to reduce duplicated code across controllers.
 */
export const ORDER_POPULATE_CONFIG = [
  { path: "user", select: "username email mobileNo gender" },
  {
    path: "items.product",
    select: "title brand slug images price returnPolicy",
    populate: { path: "brand", select: "name" }
  },
  {
    path: "items.variant",
    select: "mainImage attributes sku price stock mrp gstRate",
    populate: [
      { path: "attributes.attribute" },
      { path: "attributes.option" }
    ]
  }
];

/**
 * Centralized populate configurations for ReturnRequest queries.
 */
export const RETURN_REQUEST_POPULATE_CONFIG = [
  { path: "user", select: "username email mobileNo gender" },
  {
    path: "order",
    select: "orderId createdAt paymentMethod paymentStatus status items shippingAddress totalAmount subtotal discountAmount shippingAmount taxAmount coupon deliveredAt trackingNumber timeline",
    populate: [
      {
        path: "items.product",
        select: "title brand slug images price",
        populate: { path: "brand", select: "name" }
      },
      {
        path: "items.variant",
        select: "mainImage attributes sku price",
        populate: [
          { path: "attributes.attribute" },
          { path: "attributes.option" }
        ]
      }
    ]
  },
  {
    path: "product",
    select: "title brand slug images price returnPolicy",
    populate: { path: "brand", select: "name" }
  },
  {
    path: "originalVariant",
    select: "mainImage attributes sku price",
    populate: [
      { path: "attributes.attribute" },
      { path: "attributes.option" }
    ]
  },
  {
    path: "requestedExchangeVariant",
    select: "mainImage attributes sku price stock status",
    populate: [
      { path: "attributes.attribute" },
      { path: "attributes.option" }
    ]
  }
];

/**
 * Recursively normalize adminNotes legacy strings to arrays, and strip internal confidential
 * notes where visibleToCustomer === false for customer-facing public endpoint payloads.
 * 
 * @param {Object} data - Plain Javascript document or array of documents from lean() or toObject()
 * @param {Boolean} isCustomerFacing - If true, filter out visibleToCustomer === false entries
 * @returns {Object} Cleaned document data
 */
export const formatAndFilterNotes = (data, isCustomerFacing = false) => {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map(item => formatAndFilterNotes(item, isCustomerFacing));
  }

  // Helper to format an individual array of notes
  const processNotesArray = (notes) => {
    if (typeof notes === "string" && notes.trim() !== "") {
      const formatted = [{
        note: notes,
        createdBy: "Admin",
        category: "admin",
        visibleToCustomer: true,
        createdAt: data.updatedAt || data.createdAt || new Date()
      }];
      return isCustomerFacing ? formatted.filter(n => n.visibleToCustomer) : formatted;
    }
    if (Array.isArray(notes)) {
      return isCustomerFacing
        ? notes.filter(n => n.visibleToCustomer !== false && n.visibleToCustomer !== "false")
        : notes;
    }
    return [];
  };

  // Process root adminNotes
  if (Object.prototype.hasOwnProperty.call(data, "adminNotes") || typeof data === "object") {
    data.adminNotes = processNotesArray(data.adminNotes);
  }

  // Ensure timeline array is present
  if (typeof data === "object" && !Array.isArray(data.timeline)) {
    data.timeline = [];
  }

  // If order document is attached inside a return request
  if (data.order && typeof data.order === "object") {
    data.order.adminNotes = processNotesArray(data.order.adminNotes);
    if (!Array.isArray(data.order.timeline)) data.order.timeline = [];
  }

  // If returnRequests are attached inside an order document
  if (Array.isArray(data.returnRequests)) {
    data.returnRequests = data.returnRequests.map(req => {
      req.adminNotes = processNotesArray(req.adminNotes);
      if (!Array.isArray(req.timeline)) req.timeline = [];
      return req;
    });
  }

  return data;
};
