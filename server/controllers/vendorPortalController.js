import mongoose from "mongoose";
import Product from "../models/product.js";
import Variant from "../models/variant.js";
import Department from "../models/department.js";
import Category from "../models/category.js";
import Brand from "../models/brand.js";
import Attribute from "../models/attribute.js";
import AttributeOption from "../models/attributeOption.js";
import Vendor from "../models/vendor.js";
import Order from "../models/order.js";
import ReturnRequest from "../models/returnRequest.js";
import Ticket from "../models/ticket.js";
import ProductReview from "../models/productReview.js";
import VendorPayout from "../models/vendorPayout.js";
import { getNextSequence } from "../utils/counterHelper.js";
import { RETURN_REQUEST_POPULATE_CONFIG, ORDER_POPULATE_CONFIG } from "../utils/populateHelper.js";

/**
 * 1. GET VENDOR DASHBOARD STATS
 * Scoped strictly to authenticated vendor: req.vendor._id
 */
export const getVendorDashboardStats = async (req, res) => {
  try {
    const vendorId = req.vendor._id;

    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      stockAggregate,
      lowStockCount,
      outOfStockCount,
      recentProducts,
    ] = await Promise.all([
      Product.countDocuments({ vendorId }),
      Product.countDocuments({ vendorId, status: "Active" }),
      Product.countDocuments({ vendorId, status: "Inactive" }),
      Variant.aggregate([
        { $match: { vendorId: new mongoose.Types.ObjectId(vendorId) } },
        {
          $group: {
            _id: null,
            totalStock: { $sum: "$stock" },
            totalVariants: { $sum: 1 },
          },
        },
      ]),
      Variant.countDocuments({ vendorId, stock: { $gt: 0, $lte: 10 } }),
      Variant.countDocuments({ vendorId, stock: { $lte: 0 } }),
      Product.find({ vendorId })
        .populate("category", "name")
        .populate("department", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const totalStock = stockAggregate[0]?.totalStock || 0;
    const totalVariants = stockAggregate[0]?.totalVariants || 0;

    // Fetch vendor product IDs for strict scoping
    const vendorProducts = await Product.find({ vendorId }).select("_id title images price category").lean();
    const vendorProductIds = vendorProducts.map((p) => p._id);

    // Fetch vendor variants to accurately map product base prices
    const vendorVariants = await Variant.find({ product: { $in: vendorProductIds }, vendorId }).select("product price mrp").lean();
    const productPriceMap = {};
    vendorVariants.forEach((v) => {
      const pId = v.product.toString();
      if (!productPriceMap[pId] || (v.price && v.price < productPriceMap[pId])) {
        productPriceMap[pId] = v.price;
      }
    });

    // Scoped orders query (only orders containing this vendor's items)
    const orderQuery = {
      $or: [
        { "items.vendor": new mongoose.Types.ObjectId(vendorId) },
        { "items.product": { $in: vendorProductIds } },
      ],
    };

    const vendorOrders = await Order.find(orderQuery)
      .populate("user", "name email username")
      .sort({ createdAt: -1 })
      .lean();

    // Order fulfillment status breakdown for this vendor
    const orderStats = {
      pending: 0,
      processing: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    let totalRevenue = 0;
    const uniqueBuyers = new Set();
    const productSalesMap = {};
    const validVendorOrders = [];

    vendorOrders.forEach((ord) => {
      // Filter items to ONLY this vendor's items
      const vendorItems = (ord.items || []).filter((item) => {
        return (
          item.vendor?.toString() === vendorId.toString() ||
          vendorProductIds.some((pId) => pId.toString() === item.product?.toString())
        );
      });

      if (vendorItems.length === 0) return;
      validVendorOrders.push(ord);

      if (ord.user?._id) uniqueBuyers.add(ord.user._id.toString());

      // Determine vendor fulfillment status for this order
      let fulfillmentStatus = "pending";
      if (vendorItems.every((it) => it.status === "delivered")) {
        fulfillmentStatus = "delivered";
      } else if (vendorItems.every((it) => it.status === "shipped" || it.status === "delivered")) {
        fulfillmentStatus = "shipped";
      } else if (vendorItems.every((it) => ["packed", "shipped", "delivered"].includes(it.status))) {
        fulfillmentStatus = "packed";
      } else if (vendorItems.some((it) => ["processing", "packed", "shipped"].includes(it.status))) {
        fulfillmentStatus = "processing";
      } else if (vendorItems.every((it) => it.status === "cancelled")) {
        fulfillmentStatus = "cancelled";
      }

      if (orderStats[fulfillmentStatus] !== undefined) {
        orderStats[fulfillmentStatus]++;
      }

      // Calculate revenue strictly from this vendor's items
      vendorItems.forEach((item) => {
        const itemTotal = (item.sellingPrice || item.price || 0) * (item.quantity || 1);
        if (ord.status !== "cancelled" && item.status !== "cancelled") {
          totalRevenue += itemTotal;
        }
        const pId = item.product?.toString();
        if (pId) {
          productSalesMap[pId] = (productSalesMap[pId] || 0) + (item.quantity || 1);
        }
      });
    });

    // Populated vendor products for category mapping
    const populatedVendorProducts = await Product.find({ vendorId })
      .populate("category", "name")
      .select("_id title images price category")
      .lean();

    const catRevenueMap = {};
    let totalCatRevenue = 0;
    validVendorOrders.forEach((ord) => {
      if (ord.status !== "cancelled") {
        ord.items?.forEach((item) => {
          const isItemVendor =
            item.vendor?.toString() === vendorId.toString() ||
            vendorProductIds.some((pId) => pId.toString() === item.product?.toString());

          if (isItemVendor && item.status !== "cancelled") {
            const matchProd = populatedVendorProducts.find(
              (p) => p._id.toString() === item.product?.toString()
            );
            if (matchProd) {
              const catName = matchProd.category?.name || "Other";
              const itemRev = (item.sellingPrice || item.price || 0) * (item.quantity || 1);
              catRevenueMap[catName] = (catRevenueMap[catName] || 0) + itemRev;
              totalCatRevenue += itemRev;
            }
          }
        });
      }
    });

    const salesByCategory = Object.keys(catRevenueMap)
      .map((cat) => ({
        category: cat,
        revenue: catRevenueMap[cat],
        percentage: totalCatRevenue > 0 ? Math.round((catRevenueMap[cat] / totalCatRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Build recent orders (strictly sanitized for this vendor)
    const recentOrders = validVendorOrders
      .slice(0, 5)
      .map((ord) => {
        const vendorItems = (ord.items || []).filter(
          (it) =>
            it.vendor?.toString() === vendorId.toString() ||
            vendorProductIds.some((pId) => pId.toString() === it.product?.toString())
        );
        if (vendorItems.length === 0) return null;

        const orderSubtotal = vendorItems.reduce(
          (sum, it) => sum + (it.sellingPrice || it.price || 0) * (it.quantity || 1),
          0
        );

        let fulfillmentStatus = "pending";
        if (vendorItems.every((it) => it.status === "delivered")) {
          fulfillmentStatus = "delivered";
        } else if (vendorItems.every((it) => it.status === "shipped" || it.status === "delivered")) {
          fulfillmentStatus = "shipped";
        } else if (vendorItems.every((it) => ["packed", "shipped", "delivered"].includes(it.status))) {
          fulfillmentStatus = "packed";
        } else if (vendorItems.some((it) => ["processing", "packed", "shipped"].includes(it.status))) {
          fulfillmentStatus = "processing";
        } else if (vendorItems.every((it) => it.status === "cancelled")) {
          fulfillmentStatus = "cancelled";
        }

        return {
          _id: ord._id,
          orderId: ord.orderId || ord.orderNumber || ord._id.toString().slice(-8).toUpperCase(),
          orderNumber: ord.orderNumber || ord.orderId || ord._id.toString().slice(-8).toUpperCase(),
          user: {
            username: ord.user?.name || ord.user?.username || ord.shippingAddress?.fullName || ord.shippingAddress?.name || "Customer",
            name: ord.user?.name || ord.shippingAddress?.fullName || "Customer",
          },
          createdAt: ord.createdAt,
          status: fulfillmentStatus,
          fulfillmentStatus,
          total: orderSubtotal,
          totalAmount: orderSubtotal,
          itemCount: vendorItems.length,
        };
      })
      .filter(Boolean);

    // Top selling products for this vendor only
    const topProducts = vendorProducts
      .map((p) => {
        const sold = productSalesMap[p._id.toString()] || 0;
        const pImg = p.images?.[0] || null;
        const price = productPriceMap[p._id.toString()] || p.price || 0;
        return {
          _id: p._id,
          title: p.title,
          image: pImg,
          images: pImg ? [{ url: typeof pImg === "string" ? pImg : pImg.url }] : [],
          soldCount: sold,
          totalSold: sold,
          price,
          totalRevenue: sold * price,
        };
      })
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);

    // Revenue chart & Analytics chart (weekly distribution of this vendor's sales)
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const revenueChart = [];
    const analyticsChart = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const dayStr = d.toISOString().split("T")[0];

      let dayRev = 0;
      let dayOrdersCount = 0;
      const dayCustomersSet = new Set();

      validVendorOrders.forEach((ord) => {
        const ordDateStr = new Date(ord.createdAt).toISOString().split("T")[0];
        if (ordDateStr === dayStr) {
          const vendorItems = (ord.items || []).filter(
            (item) =>
              item.vendor?.toString() === vendorId.toString() ||
              vendorProductIds.some((pId) => pId.toString() === item.product?.toString())
          );
          if (vendorItems.length > 0) {
            dayOrdersCount++;
            if (ord.user?._id) dayCustomersSet.add(ord.user._id.toString());
            if (ord.status !== "cancelled") {
              vendorItems.forEach((item) => {
                if (item.status !== "cancelled") {
                  dayRev += (item.sellingPrice || item.price || 0) * (item.quantity || 1);
                }
              });
            }
          }
        }
      });

      revenueChart.push({
        name: dayName,
        label: dayName,
        date: dayStr,
        revenue: dayRev,
      });

      analyticsChart.push({
        name: dayName,
        label: dayName,
        date: dayStr,
        revenue: dayRev,
        orders: dayOrdersCount,
        customers: dayCustomersSet.size,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vendor dashboard statistics fetched successfully",
      data: {
        counts: {
          totalProducts,
          totalOrders: validVendorOrders.length,
          totalUsers: uniqueBuyers.size,
          totalCategories: salesByCategory.length,
        },
        revenue: {
          total: totalRevenue,
          growth: totalRevenue > 0 ? 12.5 : 0,
        },
        orders: orderStats,
        revenueChart,
        analyticsChart,
        salesByCategory,
        topProducts,
        recentOrders,
        stats: {
          totalProducts,
          activeProducts,
          inactiveProducts,
          totalStock,
          totalVariants,
          lowStockCount,
          outOfStockCount,
        },
        store: {
          vendorId: req.vendor.vendorId,
          storeName: req.vendor.vendorProfile?.storeName || req.vendor.username,
          storeDescription: req.vendor.vendorProfile?.storeDescription || "",
          email: req.vendor.email,
          phone: req.vendor.vendorProfile?.phone || req.vendor.mobileNo || "",
          vendorStatus: req.vendor.vendorStatus,
          address: req.vendor.vendorProfile?.storeAddress || {},
        },
        recentProducts,
      },
    });
  } catch (error) {
    console.error("[Vendor Dashboard Stats] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching vendor dashboard statistics",
    });
  }
};

/**
 * 2. GET VENDOR STORE PROFILE
 */
export const getVendorStore = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id).select("-password").lean();
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        vendorId: vendor.vendorId,
        username: vendor.username,
        email: vendor.email,
        mobileNo: vendor.mobileNo,
        vendorStatus: vendor.vendorStatus,
        vendorProfile: vendor.vendorProfile || {},
      },
    });
  } catch (error) {
    console.error("[Get Vendor Store] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching store details",
    });
  }
};

/**
 * 3. UPDATE VENDOR STORE & ADDRESS
 */
export const updateVendorStore = async (req, res) => {
  try {
    const {
      storeName,
      storeDescription,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      pincode,
    } = req.body;

    const vendor = await Vendor.findById(req.vendor._id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor account not found",
      });
    }

    if (!vendor.vendorProfile) {
      vendor.vendorProfile = {};
    }

    if (storeName !== undefined) vendor.vendorProfile.storeName = storeName.trim();
    if (storeDescription !== undefined) vendor.vendorProfile.storeDescription = storeDescription.trim();
    if (phone !== undefined) {
      vendor.vendorProfile.phone = phone.trim();
      vendor.mobileNo = phone.trim();
    }

    if (!vendor.vendorProfile.storeAddress) {
      vendor.vendorProfile.storeAddress = {};
    }

    if (addressLine1 !== undefined) vendor.vendorProfile.storeAddress.addressLine1 = addressLine1.trim();
    if (addressLine2 !== undefined) vendor.vendorProfile.storeAddress.addressLine2 = addressLine2.trim();
    if (city !== undefined) vendor.vendorProfile.storeAddress.city = city.trim();
    if (state !== undefined) vendor.vendorProfile.storeAddress.state = state.trim();
    if (country !== undefined) vendor.vendorProfile.storeAddress.country = country.trim() || "India";
    if (pincode !== undefined) vendor.vendorProfile.storeAddress.pincode = pincode.trim();

    await vendor.save();

    return res.status(200).json({
      success: true,
      message: "Store details updated successfully",
      data: {
        vendorId: vendor.vendorId,
        vendorProfile: vendor.vendorProfile,
      },
    });
  } catch (error) {
    console.error("[Update Vendor Store] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating store profile",
    });
  }
};

/**
 * 4. GET MASTER CATALOG (Read-Only for Vendor)
 * Returns approved Departments, Categories, Brands, Attributes, and Options
 */
export const getVendorMasterCatalog = async (req, res) => {
  try {
    const [departments, rawCategories, brands, attributes, attributeOptions] =
      await Promise.all([
        Department.find({ status: "Active" }).select("name slug description").lean(),
        Category.find({ status: "Active" }).populate("departmentIds", "name").lean(),
        Brand.find({ status: "Active" }).select("name slug logo").lean(),
        Attribute.find({ status: "Active" }).select("name fieldType isRequired").lean(),
        AttributeOption.find({ status: "active" }).select("attribute displayName storedValue").lean(),
      ]);

    const categories = rawCategories.map((c) => ({
      ...c,
      department: c.departmentIds?.[0] || null,
    }));

    return res.status(200).json({
      success: true,
      message: "Master catalog fetched successfully",
      data: {
        departments,
        categories,
        brands,
        attributes,
        attributeOptions,
      },
    });
  } catch (error) {
    console.error("[Get Master Catalog] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching master catalog",
    });
  }
};

/**
 * 5. GET VENDOR'S PRODUCTS (Filtered strictly to req.vendor._id)
 */
export const getVendorProducts = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "all",
      category,
      department,
      brand,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Strict ownership filter
    const query = { vendorId };

    if (status && status !== "all" && status !== "") {
      query.status = status;
    }

    if (category && mongoose.isValidObjectId(category)) {
      query.category = category;
    }

    if (department && mongoose.isValidObjectId(department)) {
      query.department = department;
    }

    if (brand && mongoose.isValidObjectId(brand)) {
      query.brand = brand;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { slug: searchRegex },
        { productId: searchRegex },
      ];
    }

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate("department", "name")
        .populate("category", "name")
        .populate("brand", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query),
    ]);

    // Attach variant summary (total stock, min price, max price, variant count)
    const productIds = products.map((p) => p._id);
    const variants = await Variant.find({
      product: { $in: productIds },
      vendorId,
    }).lean();

    const variantsByProduct = {};
    variants.forEach((v) => {
      const pid = v.product.toString();
      if (!variantsByProduct[pid]) variantsByProduct[pid] = [];
      variantsByProduct[pid].push(v);
    });

    const enrichedProducts = products.map((p) => {
      const pVariants = variantsByProduct[p._id.toString()] || [];
      const totalStock = pVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
      const prices = pVariants.map((v) => v.price).filter((pr) => typeof pr === "number");
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;

      // Extract main image from first variant
      const firstImage =
        pVariants.find((v) => v.mainImage?.url)?.mainImage?.url || null;

      return {
        ...p,
        variantCount: pVariants.length,
        totalStock,
        minPrice,
        maxPrice,
        thumbnail: firstImage,
        variants: pVariants,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        products: enrichedProducts,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("[Get Vendor Products] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching vendor products",
    });
  }
};

/**
 * 6. GET SINGLE VENDOR PRODUCT BY ID (Ownership strictly enforced)
 */
export const getVendorProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor._id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findOne({ _id: id, vendorId })
      .populate("department", "name")
      .populate("category", "name")
      .populate("brand", "name")
      .populate("attributes.attribute", "name fieldType")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or access denied",
      });
    }

    const variants = await Variant.find({ product: id, vendorId })
      .populate("attributes.attribute", "name fieldType")
      .populate("attributes.option", "displayName storedValue")
      .lean();

    product.variants = variants;

    return res.status(200).json({
      success: true,
      data: {
        product,
        variants,
        ...product,
      },
    });
  } catch (error) {
    console.error("[Get Vendor Product By ID] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching product",
    });
  }
};

/**
 * 7. CREATE PRODUCT (Assigns authenticated vendorId)
 */
export const createVendorProduct = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const {
      title,
      slug,
      shortDescription,
      longDescription,
      department,
      category,
      brand,
      attributes = [],
      status = "Active",
      returnPolicy,
      variants = [],
    } = req.body;

    if (
      !title?.trim() ||
      !shortDescription?.trim() ||
      !longDescription?.trim() ||
      !department ||
      !category ||
      !brand
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required product fields.",
      });
    }

    // Auto-generate unique slug
    const rawSlug = (slug || title).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    let uniqueSlug = rawSlug || `prod-${Date.now()}`;
    let counter = 1;
    while (await Product.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${rawSlug}-${counter}`;
      counter++;
    }

    // Validate references in master catalog
    const [deptDoc, catDoc, brandDoc] = await Promise.all([
      Department.findOne({ _id: department, status: "Active" }),
      Category.findOne({ _id: category, status: "Active" }),
      Brand.findOne({ _id: brand, status: "Active" }),
    ]);

    if (!deptDoc) return res.status(400).json({ success: false, message: "Invalid or inactive department" });
    if (!catDoc) return res.status(400).json({ success: false, message: "Invalid or inactive category" });
    if (!brandDoc) return res.status(400).json({ success: false, message: "Invalid or inactive brand" });

    // Generate productId sequence
    let productId = `PROD-${Date.now().toString().slice(-6)}`;
    try {
      const seq = await getNextSequence("productId");
      productId = `PROD-${seq}`;
    } catch (err) {
      console.warn("Could not generate sequential productId:", err);
    }

    const newProduct = await Product.create({
      productId,
      vendorId, // 🔐 OWNERSHIP ENFORCED
      title: title.trim(),
      slug: uniqueSlug,
      shortDescription: shortDescription.trim(),
      longDescription: longDescription.trim(),
      department,
      category,
      brand,
      attributes: Array.isArray(attributes) ? attributes : [],
      status: status || "Active",
      returnPolicy: {
        returnable: returnPolicy?.returnable ?? true,
        exchangeable: returnPolicy?.exchangeable ?? true,
        returnDays: returnPolicy?.returnDays !== undefined ? parseInt(returnPolicy.returnDays, 10) : 7,
      },
    });

    // If variants were provided during creation, insert them
    if (Array.isArray(variants) && variants.length > 0) {
      const variantsToInsert = variants.map((v, idx) => ({
        ...v,
        product: newProduct._id,
        vendorId, // 🔐 OWNERSHIP ENFORCED
        sku: v.sku?.trim() || `${productId}-VAR-${idx + 1}`,
        price: Number(v.price) || 0,
        mrp: Number(v.mrp) || Number(v.price) || 0,
        stock: Number(v.stock) || 0,
        gstRate: [0, 5, 12, 18, 28].includes(Number(v.gstRate)) ? Number(v.gstRate) : 5,
        status: v.status || "Active",
      }));

      await Variant.insertMany(variantsToInsert);
    }

    const populated = await Product.findById(newProduct._id)
      .populate("department", "name")
      .populate("category", "name")
      .populate("brand", "name");

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: populated,
    });
  } catch (error) {
    console.error("[Create Vendor Product] Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error creating product",
    });
  }
};

/**
 * 8. UPDATE VENDOR PRODUCT (Ownership strictly verified)
 */
export const updateVendorProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor._id;

    const product = await Product.findOne({ _id: id, vendorId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or you do not have permission to edit it.",
      });
    }

    const {
      title,
      slug,
      shortDescription,
      longDescription,
      department,
      category,
      brand,
      attributes,
      status,
      returnPolicy,
    } = req.body;

    if (title !== undefined) product.title = title.trim();
    if (shortDescription !== undefined) product.shortDescription = shortDescription.trim();
    if (longDescription !== undefined) product.longDescription = longDescription.trim();
    if (status !== undefined) product.status = status;

    if (slug?.trim() && slug.trim().toLowerCase() !== product.slug) {
      const baseSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (await Product.findOne({ slug: uniqueSlug, _id: { $ne: id } })) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      product.slug = uniqueSlug;
    }

    if (department && department !== product.department?.toString()) {
      const dept = await Department.findOne({ _id: department, status: "Active" });
      if (dept) product.department = department;
    }

    if (category && category !== product.category?.toString()) {
      const cat = await Category.findOne({ _id: category, status: "Active" });
      if (cat) product.category = category;
    }

    if (brand && brand !== product.brand?.toString()) {
      const b = await Brand.findOne({ _id: brand, status: "Active" });
      if (b) product.brand = brand;
    }

    if (Array.isArray(attributes)) {
      product.attributes = attributes;
    }

    if (returnPolicy) {
      product.returnPolicy = {
        returnable: returnPolicy.returnable ?? product.returnPolicy?.returnable ?? true,
        exchangeable: returnPolicy.exchangeable ?? product.returnPolicy?.exchangeable ?? true,
        returnDays:
          returnPolicy.returnDays !== undefined
            ? parseInt(returnPolicy.returnDays, 10)
            : product.returnPolicy?.returnDays || 7,
      };
    }

    await product.save();

    const updated = await Product.findById(product._id)
      .populate("department", "name")
      .populate("category", "name")
      .populate("brand", "name");

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("[Update Vendor Product] Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error updating product",
    });
  }
};

/**
 * 9. DELETE VENDOR PRODUCT (Ownership strictly verified)
 */
export const deleteVendorProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor._id;

    const product = await Product.findOne({ _id: id, vendorId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or you do not have permission to delete it.",
      });
    }

    // Delete product and its variants
    await Promise.all([
      Product.deleteOne({ _id: id, vendorId }),
      Variant.deleteMany({ product: id, vendorId }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Product and associated variants deleted successfully",
    });
  } catch (error) {
    console.error("[Delete Vendor Product] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error deleting product",
    });
  }
};

/**
 * 10. GET VARIANTS FOR A VENDOR PRODUCT
 */
export const getVendorProductVariants = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor._id;

    const product = await Product.findOne({ _id: id, vendorId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or access denied.",
      });
    }

    const variants = await Variant.find({ product: id, vendorId })
      .populate("attributes.attribute", "name fieldType")
      .populate("attributes.option", "displayName storedValue")
      .lean();

    return res.status(200).json({
      success: true,
      data: variants,
    });
  } catch (error) {
    console.error("[Get Product Variants] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching variants",
    });
  }
};

/**
 * 11. UPDATE VARIANTS FOR A VENDOR PRODUCT (Replaces/Synchronizes variants with vendorId attached)
 */
export const updateVendorProductVariants = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor._id;
    const { variants } = req.body;

    const product = await Product.findOne({ _id: id, vendorId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or access denied.",
      });
    }

    if (!Array.isArray(variants)) {
      return res.status(400).json({
        success: false,
        message: "Variants payload must be an array",
      });
    }

    // Delete existing variants for this product belonging to vendor
    await Variant.deleteMany({ product: id, vendorId });

    const variantsToInsert = variants.map((v, idx) => {
      const copy = { ...v, product: id, vendorId };
      delete copy._id; // create clean documents
      copy.sku = copy.sku?.trim() || `${product.productId || "PROD"}-VAR-${idx + 1}`;
      copy.price = Number(copy.price) || 0;
      copy.mrp = Number(copy.mrp) || Number(copy.price) || 0;
      copy.stock = Math.max(0, parseInt(copy.stock, 10) || 0);
      copy.gstRate = [0, 5, 12, 18, 28].includes(Number(copy.gstRate)) ? Number(copy.gstRate) : 5;
      copy.status = copy.status || "Active";
      return copy;
    });

    const inserted = await Variant.insertMany(variantsToInsert);

    return res.status(200).json({
      success: true,
      message: "Variants updated successfully",
      data: inserted,
    });
  } catch (error) {
    console.error("[Update Product Variants] Error:", error);
    const errMessage = error?.message?.includes("E11000")
      ? "Duplicate SKU detected. Each variant must possess a unique SKU."
      : error.message || "Failed to update variants";
    return res.status(400).json({
      success: false,
      message: errMessage,
    });
  }
};

/**
 * 12. GET VENDOR INVENTORY
 * Lists all variants belonging to authenticated vendor with live stock status and KPIs
 */
export const getVendorInventory = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { filter = "all", search = "", page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Strict ownership match
    const match = { vendorId };

    if (filter === "low-stock") {
      match.stock = { $gt: 0, $lte: 10 };
    } else if (filter === "out-of-stock") {
      match.stock = { $lte: 0 };
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      match.$or = [{ sku: regex }];
    }

    const [variants, totalCount, statsAgg] = await Promise.all([
      Variant.find(match)
        .populate({
          path: "product",
          select: "title productId department category brand status",
          populate: [
            { path: "department", select: "name" },
            { path: "category", select: "name" },
            { path: "brand", select: "name" },
          ],
        })
        .populate("attributes.attribute", "name fieldType")
        .populate("attributes.option", "displayName storedValue")
        .sort({ stock: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Variant.countDocuments(match),
      Variant.aggregate([
        { $match: { vendorId: new mongoose.Types.ObjectId(vendorId) } },
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            totalUnits: { $sum: "$stock" },
            lowStockItems: {
              $sum: { $cond: [{ $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", 10] }] }, 1, 0] },
            },
            outOfStockItems: {
              $sum: { $cond: [{ $lte: ["$stock", 0] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const stats = statsAgg[0] || {
      totalItems: 0,
      totalUnits: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        inventory: variants,
        stats,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("[Get Vendor Inventory] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching vendor inventory",
    });
  }
};

/**
 * 13. QUICK UPDATE VENDOR VARIANT STOCK
 */
export const updateVendorVariantStock = async (req, res) => {
  try {
    const { variantId } = req.params;
    const vendorId = req.vendor._id;
    const { stock, status } = req.body;

    const variant = await Variant.findOne({ _id: variantId, vendorId });
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found or access denied",
      });
    }

    if (stock !== undefined) {
      variant.stock = Math.max(0, parseInt(stock, 10) || 0);
    }

    if (status && ["Active", "Inactive"].includes(status)) {
      variant.status = status;
    }

    await variant.save();

    return res.status(200).json({
      success: true,
      message: "Inventory stock updated successfully",
      data: {
        variantId: variant._id,
        sku: variant.sku,
        stock: variant.stock,
        status: variant.status,
      },
    });
  } catch (error) {
    console.error("[Update Variant Stock] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating variant stock",
    });
  }
};

// ==========================================
// PHASE 4: VENDOR OPERATIONS
// ==========================================

/**
 * 14. GET VENDOR ORDERS
 * Returns only orders containing items belonging to this vendor
 */
export const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "all",
      paymentMethod = "",
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const vendorProducts = await Product.find({ vendorId }).select("_id").lean();
    const vendorProdIdSet = new Set(vendorProducts.map((p) => p._id.toString()));

    const orderMatchQuery = {
      $or: [
        { "items.vendor": vendorId },
        { "items.product": { $in: Array.from(vendorProdIdSet) } },
      ],
    };

    if (search && search.trim()) {
      const q = search.trim();
      orderMatchQuery.$and = [
        {
          $or: [
            { orderId: { $regex: q, $options: "i" } },
            { "shippingAddress.name": { $regex: q, $options: "i" } },
            { "shippingAddress.phone": { $regex: q, $options: "i" } },
            { "shippingAddress.city": { $regex: q, $options: "i" } },
            { "shippingAddress.email": { $regex: q, $options: "i" } },
          ],
        },
      ];
    }

    if (paymentMethod && paymentMethod.trim()) {
      orderMatchQuery.paymentMethod = paymentMethod.trim();
    }

    if (startDate || endDate) {
      orderMatchQuery.createdAt = {};
      if (startDate) orderMatchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) orderMatchQuery.createdAt.$lte = new Date(endDate);
    }

    const allMatchingOrders = await Order.find(orderMatchQuery)
      .populate("items.product", "title slug brand images vendorId")
      .populate({
        path: "items.variant",
        select: "mainImage attributes sku price mrp",
        populate: [
          { path: "attributes.attribute", select: "name" },
          { path: "attributes.option", select: "displayName" },
        ],
      })
      .populate("user", "name username email mobileNo")
      .sort({ createdAt: -1 })
      .lean();

    const allProcessedOrders = allMatchingOrders
      .map((order) => {
        const vendorItems = (order.items || []).filter((item) => {
          const itemVendorId = item.vendor?.toString();
          const prodVendorId = item.product?.vendorId?.toString();
          return (
            itemVendorId === vendorId.toString() ||
            prodVendorId === vendorId.toString() ||
            vendorProdIdSet.has(item.product?._id?.toString() || item.product?.toString())
          );
        });

        // Strictly ignore orders that don't contain any items belonging to this vendor
        if (vendorItems.length === 0) return null;

        const vendorSubtotal = vendorItems.reduce(
          (acc, it) => acc + (it.sellingPrice || it.price || 0) * (it.quantity || 1),
          0
        );
        const vendorTotalQuantity = vendorItems.reduce((acc, it) => acc + (it.quantity || 1), 0);

        let fulfillmentStatus = "pending";
        if (vendorItems.every((it) => it.status === "delivered")) {
          fulfillmentStatus = "delivered";
        } else if (vendorItems.every((it) => it.status === "shipped" || it.status === "delivered")) {
          fulfillmentStatus = "shipped";
        } else if (vendorItems.every((it) => ["packed", "shipped", "delivered"].includes(it.status))) {
          fulfillmentStatus = "packed";
        } else if (vendorItems.some((it) => ["processing", "packed", "shipped"].includes(it.status))) {
          fulfillmentStatus = "processing";
        } else if (vendorItems.every((it) => it.status === "cancelled")) {
          fulfillmentStatus = "cancelled";
        }

        const customerName =
          order.shippingAddress?.name ||
          order.shippingAddress?.fullName ||
          order.user?.name ||
          order.user?.username ||
          "Customer";

        return {
          _id: order._id,
          orderId: order.orderId || order._id.toString().slice(-8).toUpperCase(),
          createdAt: order.createdAt,
          paymentMethod: order.paymentMethod || "cod",
          paymentStatus: order.paymentStatus || "pending",
          shippingAddress: order.shippingAddress,
          customerName,
          customerPhone: order.shippingAddress?.phone || order.user?.mobileNo || "",
          vendorItems,
          items: vendorItems,
          user: {
            username: customerName,
            name: customerName,
            email: order.shippingAddress?.email || order.user?.email || "",
            mobileNo: order.shippingAddress?.phone || order.user?.mobileNo || "",
          },
          vendorSubtotal,
          totalAmount: vendorSubtotal,
          subtotal: vendorSubtotal,
          vendorTotalQuantity,
          fulfillmentStatus,
          status: fulfillmentStatus,
        };
      })
      .filter(Boolean);

    const stats = {
      total: allProcessedOrders.length,
      pending: allProcessedOrders.filter((o) => o.fulfillmentStatus === "pending").length,
      processing: allProcessedOrders.filter((o) => o.fulfillmentStatus === "processing").length,
      packed: allProcessedOrders.filter((o) => o.fulfillmentStatus === "packed").length,
      shipped: allProcessedOrders.filter((o) => o.fulfillmentStatus === "shipped").length,
      on_the_way: allProcessedOrders.filter((o) => o.fulfillmentStatus === "on_the_way").length,
      delivered: allProcessedOrders.filter((o) => o.fulfillmentStatus === "delivered").length,
      cancelled: allProcessedOrders.filter((o) => o.fulfillmentStatus === "cancelled").length,
    };

    let filteredOrders = allProcessedOrders;
    if (status && status !== "all") {
      filteredOrders = filteredOrders.filter((o) => o.fulfillmentStatus === status || o.status === status);
    }

    const totalOrders = filteredOrders.length;
    const paginatedOrders = filteredOrders.slice(skip, skip + limitNum);

    return res.status(200).json({
      success: true,
      data: {
        orders: paginatedOrders,
        stats,
        pagination: {
          total: totalOrders,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(totalOrders / limitNum) || 1,
          totalPages: Math.ceil(totalOrders / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    console.error("[Get Vendor Orders] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching vendor orders",
    });
  }
};

/**
 * 15. GET SINGLE VENDOR ORDER BY ID
 */
export const getVendorOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor._id;

    const order = await Order.findById(id)
      .populate({
        path: "items.product",
        select: "title slug brand images price vendorId returnPolicy",
        populate: { path: "brand", select: "name" },
      })
      .populate({
        path: "items.variant",
        select: "mainImage galleryImages attributes sku price mrp stock",
        populate: [
          { path: "attributes.attribute", select: "name" },
          { path: "attributes.option", select: "displayName" },
        ],
      })
      .populate("user", "name username email mobileNo gender")
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const vendorProducts = await Product.find({ vendorId }).select("_id").lean();
    const vendorProdIds = vendorProducts.map((p) => p._id.toString());

    const vendorItems = (order.items || []).filter((item) => {
      const itemVendorId = item.vendor?.toString();
      const prodVendorId = item.product?.vendorId?.toString();
      return (
        itemVendorId === vendorId.toString() ||
        prodVendorId === vendorId.toString() ||
        vendorProdIds.includes(item.product?._id?.toString() || item.product?.toString())
      );
    });

    if (vendorItems.length === 0) {
      return res.status(403).json({ success: false, message: "Access denied. Order does not contain your products." });
    }

    const vendorSubtotal = vendorItems.reduce(
      (acc, it) => acc + (it.sellingPrice || it.price || 0) * (it.quantity || 1),
      0
    );

    const vendorTotalMRP = vendorItems.reduce(
      (acc, it) => acc + (it.mrp || it.sellingPrice || it.price || 0) * (it.quantity || 1),
      0
    );

    const vendorTaxAmount = vendorItems.reduce(
      (acc, it) => acc + (it.gstAmount || 0),
      0
    );

    // Fetch any return/exchange requests for this order strictly involving this vendor's products
    const vendorItemProdIds = vendorItems.map((it) => it.product?._id || it.product);
    const returnRequests = await ReturnRequest.find({
      order: id,
      $or: [{ vendor: vendorId }, { product: { $in: vendorItemProdIds } }],
    })
      .populate("product", "title slug brand images price")
      .populate({
        path: "originalVariant",
        select: "mainImage attributes sku price",
        populate: [
          { path: "attributes.attribute", select: "name" },
          { path: "attributes.option", select: "displayName" },
        ],
      })
      .populate({
        path: "requestedExchangeVariant",
        select: "mainImage attributes sku price",
        populate: [
          { path: "attributes.attribute", select: "name" },
          { path: "attributes.option", select: "displayName" },
        ],
      })
      .lean();

    const customerName =
      order.shippingAddress?.name ||
      order.shippingAddress?.fullName ||
      order.user?.name ||
      order.user?.username ||
      "Customer";

    const vendorStoreName = req.vendor.vendorProfile?.storeName || req.vendor.username || "Vendor";

    return res.status(200).json({
      success: true,
      data: {
        ...order,
        customerName,
        user: {
          ...order.user,
          username: customerName,
          name: customerName,
        },
        vendorItems,
        items: vendorItems,
        vendorSubtotal,
        subtotal: vendorSubtotal,
        totalAmount: vendorSubtotal,
        totalMRP: vendorTotalMRP,
        taxAmount: vendorTaxAmount,
        discountAmount: 0,
        timeline: (order.timeline || []).filter(
          (t) =>
            t.performedBy === vendorStoreName ||
            t.createdBy === "Vendor" ||
            t.createdBy === "Customer" ||
            t.type === "STATUS_UPDATE" ||
            t.type === "ORDER_PLACED"
        ),
        adminNotes: (order.adminNotes || []).filter((n) => n.createdBy === vendorStoreName),
        returnRequests,
      },
    });
  } catch (error) {
    console.error("[Get Vendor Order By ID] Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching order details" });
  }
};

/**
 * 15B. UPDATE VENDOR ORDER STATUS / NOTE
 */
export const updateVendorOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor._id;
    const { status, note, notes, trackingNumber, courier } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const vendorStoreName = req.vendor.vendorProfile?.storeName || req.vendor.username || "Vendor";

    if (status) {
      const allowedVendorStatuses = ["packed", "shipped"];
      if (!allowedVendorStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Vendors can only update status to 'Packed' or 'Shipped'. 'Out for Delivery' and 'Delivered' are managed by Admin after shipment.",
        });
      }

      // Update vendor items in this order to the new status
      order.items.forEach((item) => {
        if (item.vendor?.toString() === vendorId.toString()) {
          item.status = status;
          if (trackingNumber) item.trackingNumber = trackingNumber.trim();
          if (courier) item.courier = courier.trim();
        }
      });

      // Update overall order status if all items match
      if (order.items.every((it) => it.status === status)) {
        order.status = status;
      } else if (order.items.some((it) => ["shipped", "packed", "processing"].includes(it.status))) {
        if (order.status === "pending") order.status = "processing";
      }

      order.timeline.push({
        eventId: `TL-VEND-STATUS-${Date.now()}`,
        type: "STATUS_UPDATE",
        description: `Vendor [${vendorStoreName}] updated order status to ${status.toUpperCase()}${trackingNumber ? ` (Carrier: ${courier || "Standard"}, Tracking: ${trackingNumber})` : ""}`,
        performedBy: vendorStoreName,
        createdBy: "Vendor",
        timestamp: new Date(),
      });
    }

    const noteText = note || notes;
    if (noteText) {
      if (!Array.isArray(order.adminNotes)) {
        order.adminNotes = [];
      }
      order.adminNotes.push({
        note: typeof noteText === "string" ? noteText : noteText.note,
        createdBy: vendorStoreName,
        createdAt: new Date(),
        visibleToCustomer: false,
      });
    }

    await order.save();

    // Re-fetch populated order to return
    return getVendorOrderById(req, res);
  } catch (error) {
    console.error("[Update Vendor Order Status] Error:", error);
    return res.status(500).json({ success: false, message: "Server error updating order status" });
  }
};

/**
 * 16. UPDATE VENDOR ORDER ITEM FULFILLMENT
 * Vendor workflow: Prepare (processing) -> Pack (packed) -> Ship / Handover (shipped with courier & tracking)
 */
export const updateVendorOrderItemFulfillment = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const vendorId = req.vendor._id;
    const { status, trackingNumber, courier } = req.body;

    const order = await Order.findById(id).populate("items.product", "title vendorId");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Order item not found" });
    }

    const itemVendorId = item.vendor?.toString();
    const prodVendorId = item.product?.vendorId?.toString();
    if (itemVendorId !== vendorId.toString() && prodVendorId !== vendorId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied. Item does not belong to your store." });
    }

    const validStatuses = ["packed", "shipped"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Vendors can only update fulfillment status to 'packed' or 'shipped'. 'Out for Delivery' and 'Delivered' are managed by Admin.",
      });
    }

    const oldStatus = item.status || "pending";
    if (status) item.status = status;
    if (trackingNumber !== undefined) item.trackingNumber = trackingNumber.trim();
    if (courier !== undefined) item.courier = courier.trim();

    const vendorStoreName = req.vendor.vendorProfile?.storeName || req.vendor.username || "Vendor";
    order.timeline.push({
      eventId: `TL-VEND-${Date.now()}`,
      type: "VENDOR_FULFILLMENT",
      description: `[${vendorStoreName}] updated "${item.product?.title || "Item"}" from ${oldStatus.toUpperCase()} to ${(status || oldStatus).toUpperCase()}${trackingNumber ? ` (Carrier: ${courier || "Standard"}, Tracking: ${trackingNumber})` : ""}`,
      performedBy: vendorStoreName,
      createdBy: "Vendor",
      timestamp: new Date(),
    });

    // Sync overall order status if applicable
    if (order.items.every((it) => it.status === "delivered")) {
      order.status = "delivered";
      order.deliveredAt = new Date();
    } else if (order.items.every((it) => it.status === "shipped" || it.status === "delivered")) {
      order.status = "shipped";
    } else if (order.items.every((it) => ["packed", "shipped", "delivered"].includes(it.status))) {
      order.status = "packed";
    } else if (order.items.some((it) => ["processing", "packed", "shipped"].includes(it.status))) {
      if (order.status === "pending") order.status = "processing";
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Fulfillment status updated to ${status}`,
      data: {
        itemId: item._id,
        status: item.status,
        trackingNumber: item.trackingNumber,
        courier: item.courier,
        orderStatus: order.status,
      },
    });
  } catch (error) {
    console.error("[Update Vendor Order Fulfillment] Error:", error);
    return res.status(500).json({ success: false, message: "Server error updating fulfillment status" });
  }
};

/**
 * 17. GET VENDOR RETURN REQUESTS
 */
export const getVendorReturnRequests = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "all",
      type = "all",
      settlementType = "",
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const vendorProducts = await Product.find({ vendorId }).select("_id").lean();
    const vendorProdIds = vendorProducts.map((p) => p._id);

    const baseQuery = {
      $or: [
        { vendor: vendorId },
        { product: { $in: vendorProdIds } },
      ],
    };

    if (status && status !== "all") {
      baseQuery.status = status;
    }
    if (type && type !== "all") {
      baseQuery.type = type;
    }
    if (settlementType && settlementType.trim()) {
      baseQuery.settlementType = settlementType.trim();
    }
    if (startDate || endDate) {
      baseQuery.createdAt = {};
      if (startDate) baseQuery.createdAt.$gte = new Date(startDate);
      if (endDate) baseQuery.createdAt.$lte = new Date(endDate);
    }

    if (search && search.trim()) {
      const q = search.trim();
      baseQuery.$and = [
        {
          $or: [
            { reason: { $regex: q, $options: "i" } },
            { comments: { $regex: q, $options: "i" } },
          ],
        },
      ];
    }

    const allVendorReturns = await ReturnRequest.find({
      $or: [
        { vendor: vendorId },
        { product: { $in: vendorProdIds } },
      ],
    }).select("status type").lean();

    const stats = {
      total: allVendorReturns.length,
      pending: allVendorReturns.filter((r) => r.status === "pending" || r.status === "requested").length,
      approved: allVendorReturns.filter((r) =>
        ["approved", "pickup", "pickup_replace", "replace_and_exchange", "pickup_scheduled", "picked_up", "received"].includes(r.status)
      ).length,
      rejected: allVendorReturns.filter((r) => r.status === "rejected").length,
      completed: allVendorReturns.filter((r) =>
        ["completed", "refunded", "exchanged"].includes(r.status)
      ).length,
    };

    const [rawRequests, total] = await Promise.all([
      ReturnRequest.find(baseQuery)
        .populate("product", "title slug brand images vendorId")
        .populate({
          path: "originalVariant",
          select: "mainImage attributes sku price",
          populate: [
            { path: "attributes.attribute", select: "name" },
            { path: "attributes.option", select: "displayName" },
          ],
        })
        .populate({
          path: "requestedExchangeVariant",
          select: "mainImage attributes sku price",
          populate: [
            { path: "attributes.attribute", select: "name" },
            { path: "attributes.option", select: "displayName" },
          ],
        })
        .populate("user", "name username email mobileNo")
        .populate("order", "orderId createdAt totalAmount paymentMethod")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ReturnRequest.countDocuments(baseQuery),
    ]);

    const formattedRequests = rawRequests.map((r) => {
      const customerName = r.user?.name || r.user?.username || "Customer";
      return {
        ...r,
        user: {
          username: customerName,
          name: customerName,
          email: r.user?.email || "",
          mobileNo: r.user?.mobileNo || "",
        },
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        requests: formattedRequests,
        returns: formattedRequests,
        returnRequests: formattedRequests,
        stats,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    console.error("[Get Vendor Returns] Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching return requests" });
  }
};

/**
 * 18. GET SINGLE RETURN REQUEST BY ID
 */
export const getVendorReturnRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor._id;

    const returnReq = await ReturnRequest.findById(id)
      .populate(RETURN_REQUEST_POPULATE_CONFIG)
      .lean();

    if (!returnReq) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    const vendorProducts = await Product.find({ vendorId }).select("_id").lean();
    const vendorProdIds = vendorProducts.map((p) => p._id.toString());

    const isOwner =
      returnReq.vendor?.toString() === vendorId.toString() ||
      returnReq.product?.vendorId?.toString() === vendorId.toString() ||
      vendorProdIds.includes(returnReq.product?._id?.toString() || returnReq.product?.toString());

    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Access denied to this return request" });
    }

    const customerName =
      returnReq.user?.name ||
      returnReq.user?.username ||
      returnReq.order?.shippingAddress?.name ||
      "Customer";

    // Strictly sanitize order data if present so other vendors' items/totals are never revealed
    if (returnReq.order && Array.isArray(returnReq.order.items)) {
      returnReq.order.items = returnReq.order.items.filter((it) => {
        const itemVendorId = it.vendor?.toString();
        const prodVendorId = it.product?.vendorId?.toString();
        return (
          itemVendorId === vendorId.toString() ||
          prodVendorId === vendorId.toString() ||
          vendorProdIds.includes(it.product?._id?.toString() || it.product?.toString())
        );
      });
      returnReq.order.totalAmount = returnReq.order.items.reduce(
        (acc, it) => acc + (it.sellingPrice || it.price || 0) * (it.quantity || 1),
        0
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        ...returnReq,
        customerName,
        user: {
          ...returnReq.user,
          username: customerName,
          name: customerName,
        },
      },
    });
  } catch (error) {
    console.error("[Get Vendor Return Request By ID] Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching return details" });
  }
};

/**
 * 19. UPDATE VENDOR RETURN STATUS & QC
 */
export const updateVendorReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor._id;
    const { action, status, rejectionReason, qcStatus, qcReason, vendorNotes, note, notes } = req.body;

    const returnReq = await ReturnRequest.findById(id).populate("product", "vendorId title");
    if (!returnReq) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    const vendorProducts = await Product.find({ vendorId }).select("_id").lean();
    const vendorProdIds = vendorProducts.map((p) => p._id.toString());

    const isOwner =
      returnReq.vendor?.toString() === vendorId.toString() ||
      returnReq.product?.vendorId?.toString() === vendorId.toString() ||
      vendorProdIds.includes(returnReq.product?._id?.toString() || returnReq.product?.toString());
    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const vendorStoreName = req.vendor.vendorProfile?.storeName || req.vendor.username || "Vendor";
    const previousStatus = returnReq.status;

    if (action === "approve") {
      returnReq.status = "approved";
      returnReq.timeline.push({
        eventId: `TL-RET-${Date.now()}`,
        type: "VENDOR_APPROVED",
        description: `Vendor [${vendorStoreName}] approved the ${returnReq.type} request.`,
        performedBy: vendorStoreName,
        createdBy: "Vendor",
        timestamp: new Date(),
      });
    } else if (action === "reject") {
      returnReq.status = "rejected";
      if (rejectionReason) {
        returnReq.additionalDetails = (returnReq.additionalDetails || "") + `\n[Vendor Rejection: ${rejectionReason.trim()}]`;
      }
      returnReq.timeline.push({
        eventId: `TL-RET-${Date.now()}`,
        type: "VENDOR_REJECTED",
        description: `Vendor [${vendorStoreName}] rejected the ${returnReq.type} request. Reason: ${rejectionReason || "Customer request reason not accepted"}`,
        performedBy: vendorStoreName,
        createdBy: "Vendor",
        timestamp: new Date(),
      });
    } else if (action === "pickup_scheduled" || action === "schedule_pickup") {
      returnReq.status = "pickup_scheduled";
      returnReq.timeline.push({
        eventId: `TL-RET-${Date.now()}`,
        type: "PICKUP_SCHEDULED",
        description: `Vendor [${vendorStoreName}] scheduled courier pickup for the customer.`,
        performedBy: vendorStoreName,
        createdBy: "Vendor",
        timestamp: new Date(),
      });
    } else if (action === "received") {
      returnReq.status = "received";
      returnReq.timeline.push({
        eventId: `TL-RET-${Date.now()}`,
        type: "ITEM_RECEIVED",
        description: `Vendor [${vendorStoreName}] marked returned item as received at warehouse.`,
        performedBy: vendorStoreName,
        createdBy: "Vendor",
        timestamp: new Date(),
      });
    } else if (action === "replace_and_exchange" || action === "pickup_replace") {
      returnReq.status = "replace_and_exchange";
      returnReq.timeline.push({
        eventId: `TL-RET-${Date.now()}`,
        type: "REPLACE_AND_EXCHANGE",
        description: `Vendor [${vendorStoreName}] dispatched replacement for doorstep exchange.`,
        performedBy: vendorStoreName,
        createdBy: "Vendor",
        timestamp: new Date(),
      });
    } else if (action === "complete" || action === "completed") {
      returnReq.status = "completed";
      returnReq.timeline.push({
        eventId: `TL-RET-${Date.now()}`,
        type: "COMPLETED",
        description: `Vendor [${vendorStoreName}] marked the ${returnReq.type} request as completed.`,
        performedBy: vendorStoreName,
        createdBy: "Vendor",
        timestamp: new Date(),
      });
    } else if (action === "qc") {
      if (!["passed", "failed"].includes(qcStatus)) {
        return res.status(400).json({ success: false, message: "QC status must be 'passed' or 'failed'" });
      }
      returnReq.qcStatus = qcStatus;
      if (qcReason) returnReq.qcReason = qcReason.trim();

      if (qcStatus === "passed") {
        returnReq.status = "completed";
        if (returnReq.type === "return") {
          returnReq.refundStatus = "completed";
        }
      } else {
        returnReq.status = "rejected";
      }

      returnReq.timeline.push({
        eventId: `TL-RET-${Date.now()}`,
        type: "VENDOR_QC",
        description: `Vendor [${vendorStoreName}] completed QC Inspection: ${qcStatus.toUpperCase()}${qcReason ? ` - ${qcReason}` : ""}`,
        performedBy: vendorStoreName,
        createdBy: "Vendor",
        timestamp: new Date(),
      });
    } else if (status) {
      const validStatuses = [
        "pending",
        "requested",
        "approved",
        "rejected",
        "pickup_scheduled",
        "received",
        "replace_and_exchange",
        "pickup_replace",
        "completed",
        "refunded",
        "exchanged"
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
      }

      returnReq.status = status;
      const statusLabels = {
        approved: "Approved",
        rejected: "Rejected",
        pickup_scheduled: "Picked Up Schedule",
        received: "Recieved",
        replace_and_exchange: "Replace and Exchange",
        pickup_replace: "Replace and Exchange",
        completed: "Completed"
      };

      returnReq.timeline.push({
        eventId: `TL-RET-${Date.now()}`,
        type: "STATUS_UPDATE",
        description: `Vendor [${vendorStoreName}] updated request status to ${statusLabels[status] || status.toUpperCase()}`,
        performedBy: vendorStoreName,
        createdBy: "Vendor",
        timestamp: new Date(),
      });
    }

    // Stock adjustments and payment sync if completed
    if (
      (returnReq.status === "completed" || returnReq.status === "exchanged") &&
      previousStatus !== "completed" &&
      previousStatus !== "exchanged"
    ) {
      const qty = Number(returnReq.quantity) || 1;
      if (returnReq.type === "exchange") {
        if (returnReq.requestedExchangeVariant) {
          await Variant.findByIdAndUpdate(returnReq.requestedExchangeVariant, {
            $inc: { stock: -qty },
          });
        }
        if (returnReq.originalVariant) {
          await Variant.findByIdAndUpdate(returnReq.originalVariant, {
            $inc: { stock: qty },
          });
        }
      } else if (returnReq.type === "return") {
        if (returnReq.originalVariant) {
          await Variant.findByIdAndUpdate(returnReq.originalVariant, {
            $inc: { stock: qty },
          });
        }
        returnReq.refundStatus = "completed";
        if (returnReq.order) {
          await Order.findByIdAndUpdate(returnReq.order, { paymentStatus: "refunded" });
        }
      }
    }

    if (vendorNotes !== undefined) {
      returnReq.vendorNotes = vendorNotes.trim();
    }

    const noteText = note || notes;
    if (noteText) {
      if (!Array.isArray(returnReq.adminNotes)) {
        returnReq.adminNotes = [];
      }
      const noteContent = typeof noteText === "string" ? noteText : noteText.note;
      returnReq.adminNotes.push({
        note: noteContent,
        createdBy: vendorStoreName,
        createdAt: new Date(),
        visibleToCustomer: typeof noteText === "object" ? !!noteText.visibleToCustomer : false,
      });
    }

    await returnReq.save();

    // Re-fetch populated request to return identical structure
    return getVendorReturnRequestById(req, res);
  } catch (error) {
    console.error("[Update Vendor Return Status] Error:", error);
    return res.status(500).json({ success: false, message: "Server error processing return request" });
  }
};

/**
 * 20. GET VENDOR TICKETS
 */
export const getVendorTickets = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { page = 1, limit = 10, search = "", status = "all" } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const vendorProducts = await Product.find({ vendorId }).select("_id").lean();
    const vendorProdIds = vendorProducts.map((p) => p._id);
    const vendorOrders = await Order.find({
      $or: [{ "items.vendor": vendorId }, { "items.product": { $in: vendorProdIds } }],
    }).select("orderId").lean();
    const vendorOrderIds = vendorOrders.map((o) => o.orderId).filter(Boolean);

    const query = {
      $or: [
        { vendor: vendorId },
        { orderId: { $in: vendorOrderIds } },
      ],
    };

    if (status && status !== "all") {
      query.status = status;
    }

    if (search && search.trim()) {
      query.$and = [
        {
          $or: [
            { ticketId: { $regex: search.trim(), $options: "i" } },
            { orderId: { $regex: search.trim(), $options: "i" } },
            { message: { $regex: search.trim(), $options: "i" } },
          ],
        },
      ];
    }

    const allTicketsForStats = await Ticket.find(query).select("status").lean();
    const stats = {
      total: allTicketsForStats.length,
      open: allTicketsForStats.filter((t) => t.status === "open").length,
      in_progress: allTicketsForStats.filter((t) => t.status === "in_progress").length,
      resolved: allTicketsForStats.filter((t) => t.status === "resolved").length,
      closed: allTicketsForStats.filter((t) => t.status === "closed").length,
    };

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate("user", "name username email mobileNo")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Ticket.countDocuments(query),
    ]);

    const formattedTickets = tickets.map((t) => {
      const customerName = t.user?.name || t.user?.username || "Customer";
      return {
        ...t,
        user: {
          username: customerName,
          name: customerName,
          email: t.user?.email || "",
          mobileNo: t.user?.mobileNo || "",
        },
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        tickets: formattedTickets,
        stats,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    console.error("[Get Vendor Tickets] Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching tickets" });
  }
};

const verifyVendorTicketOwnership = async (ticket, vendorId) => {
  if (ticket.vendor && ticket.vendor.toString() === vendorId.toString()) return true;
  if (ticket.orderId) {
    const vendorProducts = await Product.find({ vendorId }).select("_id").lean();
    const vendorProdIds = vendorProducts.map((p) => p._id);
    const order = await Order.findOne({
      orderId: ticket.orderId,
      $or: [{ "items.vendor": vendorId }, { "items.product": { $in: vendorProdIds } }],
    }).lean();
    if (order) return true;
  }
  return false;
};

/**
 * 21. GET SINGLE VENDOR TICKET BY ID
 */
export const getVendorTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor._id;

    const ticket = await Ticket.findById(id).populate("user", "name email mobileNo").lean();
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const isOwner = await verifyVendorTicketOwnership(ticket, vendorId);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Access denied to this ticket" });
    }

    return res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    console.error("[Get Vendor Ticket By ID] Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching ticket" });
  }
};

/**
 * 22. REPLY TO VENDOR TICKET
 */
export const replyToVendorTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor._id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Reply message cannot be empty" });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const isOwner = await verifyVendorTicketOwnership(ticket, vendorId);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Access denied to this ticket" });
    }

    const vendorStoreName = req.vendor.vendorProfile?.storeName || req.vendor.username || "Vendor Support";

    ticket.responses.push({
      sender: "vendor",
      senderName: vendorStoreName,
      senderId: vendorId,
      message: message.trim(),
      createdAt: new Date(),
    });

    if (ticket.status === "open") {
      ticket.status = "in_progress";
    }
    ticket.lastResponseAt = new Date();

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Reply sent successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("[Reply To Vendor Ticket] Error:", error);
    return res.status(500).json({ success: false, message: "Server error posting reply" });
  }
};

/**
 * 23. UPDATE VENDOR TICKET STATUS
 */
export const updateVendorTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor._id;
    const { status } = req.body;

    if (!["open", "in_progress", "resolved", "closed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid ticket status" });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const isOwner = await verifyVendorTicketOwnership(ticket, vendorId);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Access denied to this ticket" });
    }

    ticket.status = status;
    await ticket.save();

    return res.status(200).json({
      success: true,
      message: `Ticket marked as ${status}`,
      data: ticket,
    });
  } catch (error) {
    console.error("[Update Vendor Ticket Status] Error:", error);
    return res.status(500).json({ success: false, message: "Server error updating ticket status" });
  }
};

/**
 * 24. GET VENDOR REVIEWS
 */
export const getVendorReviews = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { page = 1, limit = 10, rating = "all", status = "all" } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const vendorProducts = await Product.find({ vendorId }).select("_id").lean();
    const vendorProdIds = vendorProducts.map((p) => p._id);

    const query = { product: { $in: vendorProdIds } };

    if (rating && rating !== "all") {
      query.rating = Number(rating);
    }
    if (status === "replied") {
      query["vendorReply.message"] = { $exists: true, $ne: "" };
    } else if (status === "unreplied") {
      query.$or = [
        { vendorReply: { $exists: false } },
        { "vendorReply.message": { $exists: false } },
        { "vendorReply.message": "" },
      ];
    }

    const [reviews, total, allReviewsForStats] = await Promise.all([
      ProductReview.find(query)
        .populate("product", "title slug images")
        .populate({
          path: "variant",
          select: "attributes sku mainImage",
          populate: [{ path: "attributes.attribute", select: "name" }, { path: "attributes.option", select: "displayName" }],
        })
        .populate("user", "name profileImage email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ProductReview.countDocuments(query),
      ProductReview.find({ product: { $in: vendorProdIds } }).select("rating").lean(),
    ]);

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;
    allReviewsForStats.forEach((r) => {
      ratingSum += r.rating || 0;
      if (ratingCounts[r.rating] !== undefined) ratingCounts[r.rating]++;
    });
    const avgRating = allReviewsForStats.length ? (ratingSum / allReviewsForStats.length).toFixed(1) : 0;

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        stats: {
          totalReviews: allReviewsForStats.length,
          avgRating: Number(avgRating),
          ratingCounts,
        },
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("[Get Vendor Reviews] Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching reviews" });
  }
};

/**
 * 25. REPLY TO VENDOR REVIEW
 */
export const replyToVendorReview = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor._id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Reply message cannot be empty" });
    }

    const review = await ProductReview.findById(id).populate("product", "vendorId");
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (review.product?.vendorId?.toString() !== vendorId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied. Product does not belong to your store." });
    }

    review.vendorReply = {
      message: message.trim(),
      repliedAt: new Date(),
      vendor: vendorId,
    };

    await review.save();

    return res.status(200).json({
      success: true,
      message: "Vendor response published",
      data: review,
    });
  } catch (error) {
    console.error("[Reply To Vendor Review] Error:", error);
    return res.status(500).json({ success: false, message: "Server error saving review response" });
  }
};

/**
 * 26. DELETE VENDOR REVIEW REPLY
 */
export const deleteVendorReviewReply = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.vendor._id;

    const review = await ProductReview.findById(id).populate("product", "vendorId");
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (review.product?.vendorId?.toString() !== vendorId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    review.vendorReply = undefined;
    await review.save();

    return res.status(200).json({
      success: true,
      message: "Vendor response removed",
      data: review,
    });
  } catch (error) {
    console.error("[Delete Vendor Review Reply] Error:", error);
    return res.status(500).json({ success: false, message: "Server error removing review reply" });
  }
};

/**
 * 27. GET VENDOR PAYMENTS & EARNINGS SUMMARY
 */
export const getVendorEarningsSummary = async (req, res) => {
  try {
    const vendorId = req.vendor._id;

    const vendorProducts = await Product.find({ vendorId }).select("_id").lean();
    const vendorProdIds = vendorProducts.map((p) => p._id);

    const orders = await Order.find({
      $or: [{ "items.vendor": vendorId }, { "items.product": { $in: vendorProdIds } }],
    }).lean();

    const commissionRate = req.vendor.commissionRate !== undefined ? req.vendor.commissionRate : 10;

    let grossSales = 0;
    let deliveredSales = 0;
    let totalItemsSold = 0;
    let deliveredItemsCount = 0;

    orders.forEach((order) => {
      const vendorItems = (order.items || []).filter((item) => {
        const itemVendorId = item.vendor?.toString();
        const prodVendorId = item.product?.toString();
        return itemVendorId === vendorId.toString() || vendorProdIds.some((pId) => pId.toString() === prodVendorId);
      });

      vendorItems.forEach((item) => {
        const lineTotal = (item.sellingPrice || 0) * (item.quantity || 1);
        if (order.status !== "cancelled" && item.status !== "cancelled") {
          grossSales += lineTotal;
          totalItemsSold += (item.quantity || 1);
          if (item.status === "delivered" || order.status === "delivered") {
            deliveredSales += lineTotal;
            deliveredItemsCount += (item.quantity || 1);
          }
        }
      });
    });

    const commissionAmount = Math.round((grossSales * (commissionRate / 100)) * 100) / 100;
    const netEarnings = Math.max(0, grossSales - commissionAmount);

    const payouts = await VendorPayout.find({ vendor: vendorId }).lean();
    const completedPayouts = payouts
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingPayouts = payouts
      .filter((p) => ["pending", "processing"].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0);

    const deliveredNetEarnings = Math.max(0, deliveredSales - (deliveredSales * (commissionRate / 100)));
    const availablePayout = Math.max(0, Math.round((deliveredNetEarnings - completedPayouts - pendingPayouts) * 100) / 100);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          grossSales,
          deliveredSales,
          commissionRate,
          commissionAmount,
          netEarnings,
          availablePayout,
          completedPayouts,
          pendingPayouts,
          totalItemsSold,
          deliveredItemsCount,
          currency: "INR",
        },
        bankDetails: req.vendor.vendorProfile?.bankDetails || {},
        storeName: req.vendor.vendorProfile?.storeName || req.vendor.username,
      },
    });
  } catch (error) {
    console.error("[Get Vendor Earnings] Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching earnings summary" });
  }
};

/**
 * 28. GET VENDOR TRANSACTIONS BREAKDOWN
 */
export const getVendorTransactions = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { page = 1, limit = 15 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const vendorProducts = await Product.find({ vendorId }).select("_id").lean();
    const vendorProdIds = vendorProducts.map((p) => p._id);

    const orders = await Order.find({
      $or: [{ "items.vendor": vendorId }, { "items.product": { $in: vendorProdIds } }],
    })
      .populate("items.product", "title slug")
      .populate("items.variant", "sku attributes")
      .sort({ createdAt: -1 })
      .lean();

    const commissionRate = req.vendor.commissionRate !== undefined ? req.vendor.commissionRate : 10;
    const transactions = [];

    orders.forEach((order) => {
      const vendorItems = (order.items || []).filter((item) => {
        const itemVendorId = item.vendor?.toString();
        const prodVendorId = item.product?._id ? item.product._id.toString() : item.product?.toString();
        return itemVendorId === vendorId.toString() || vendorProdIds.some((pId) => pId.toString() === prodVendorId);
      });

      vendorItems.forEach((item) => {
        const lineTotal = (item.sellingPrice || 0) * (item.quantity || 1);
        const commission = Math.round((lineTotal * (commissionRate / 100)) * 100) / 100;
        const netVendorShare = Math.max(0, lineTotal - commission);

        transactions.push({
          id: `${order.orderId}-${item._id}`,
          orderId: order.orderId,
          orderDate: order.createdAt,
          productTitle: item.product?.title || "Item",
          sku: item.variant?.sku || item.sku || "-",
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
          totalPrice: lineTotal,
          commissionRate,
          commissionAmount: commission,
          netEarnings: netVendorShare,
          itemStatus: item.status || "pending",
          orderStatus: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
        });
      });
    });

    const paginated = transactions.slice(skip, skip + limitNum);

    return res.status(200).json({
      success: true,
      data: {
        transactions: paginated,
        pagination: {
          total: transactions.length,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(transactions.length / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("[Get Vendor Transactions] Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching transactions" });
  }
};

/**
 * 29. GET VENDOR PAYOUT HISTORY
 */
export const getVendorPayoutHistory = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const payouts = await VendorPayout.find({ vendor: vendorId }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: payouts });
  } catch (error) {
    console.error("[Get Vendor Payout History] Error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching payout history" });
  }
};

/**
 * 30. REQUEST VENDOR PAYOUT
 */
export const requestVendorPayout = async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const { amount, payoutMethod = "bank_transfer", notes = "" } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 500) {
      return res.status(400).json({
        success: false,
        message: "Minimum withdrawal amount is ₹500",
      });
    }

    const bankDetails = req.vendor.vendorProfile?.bankDetails;
    if (!bankDetails || (!bankDetails.accountNumber && !bankDetails.upiId)) {
      return res.status(400).json({
        success: false,
        message: "Please configure your Bank Account or UPI details in Store Profile before requesting payouts.",
      });
    }

    const vendorProducts = await Product.find({ vendorId }).select("_id").lean();
    const vendorProdIds = vendorProducts.map((p) => p._id);

    const orders = await Order.find({
      $or: [{ "items.vendor": vendorId }, { "items.product": { $in: vendorProdIds } }],
    }).lean();

    const commissionRate = req.vendor.commissionRate !== undefined ? req.vendor.commissionRate : 10;
    let deliveredSales = 0;

    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const itemVendorId = item.vendor?.toString();
        const prodVendorId = item.product?.toString();
        const isVendorItem = itemVendorId === vendorId.toString() || vendorProdIds.some((pId) => pId.toString() === prodVendorId);

        if (isVendorItem && (item.status === "delivered" || order.status === "delivered")) {
          deliveredSales += (item.sellingPrice || 0) * (item.quantity || 1);
        }
      });
    });

    const netDelivered = deliveredSales - (deliveredSales * (commissionRate / 100));
    const previousPayouts = await VendorPayout.find({
      vendor: vendorId,
      status: { $in: ["completed", "pending", "processing"] },
    }).lean();
    const alreadyDrawn = previousPayouts.reduce((sum, p) => sum + p.amount, 0);
    const available = Math.max(0, netDelivered - alreadyDrawn);

    if (numAmount > available) {
      return res.status(400).json({
        success: false,
        message: `Requested amount (₹${numAmount}) exceeds your available payout balance (₹${available.toFixed(2)})`,
      });
    }

    const payoutId = `PAY-${Date.now().toString().slice(-6)}`;
    const payout = await VendorPayout.create({
      payoutId,
      vendor: vendorId,
      amount: numAmount,
      payoutMethod,
      bankDetails: {
        accountHolderName: bankDetails.accountHolderName,
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        upiId: bankDetails.upiId,
      },
      notes: notes.trim(),
      status: "pending",
      requestedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Payout request submitted successfully. Admin will process it shortly.",
      data: payout,
    });
  } catch (error) {
    console.error("[Request Vendor Payout] Error:", error);
    return res.status(500).json({ success: false, message: "Server error creating payout request" });
  }
};

