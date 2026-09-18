import mongoose from "mongoose";
import Product from "../models/product.js";
import Department from "../models/department.js";
import Category from "../models/category.js";
import Brand from "../models/brand.js";
import Attribute from "../models/attribute.js";
import AttributeOption from "../models/attributeOption.js";
import ProductReview from "../models/productReview.js";
import Variant from "../models/variant.js";
import { v2 as cloudinary } from "cloudinary";
import { getNextSequence } from "../utils/counterHelper.js";

// GET ALL VARIANT GROUPS (Paginated at the group level)
export const getAllVariantGroups = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sort = "newest",
      department,
      departments,
      category,
      categories,
      brand,
      brands,
      minPrice,
      maxPrice,
      colors,
      status,
    } = req.query;

    const pipeline = [];
    const matchStage1 = {};

    if (status) matchStage1.status = status;

    if (department && mongoose.isValidObjectId(department)) {
      matchStage1.department = new mongoose.Types.ObjectId(department);
    }
    if (category && mongoose.isValidObjectId(category)) {
      matchStage1.category = new mongoose.Types.ObjectId(category);
    }
    if (brand && mongoose.isValidObjectId(brand)) {
      matchStage1.brand = new mongoose.Types.ObjectId(brand);
    }

    pipeline.push({ $match: matchStage1 });

    pipeline.push(
      { $lookup: { from: "departments", localField: "department", foreignField: "_id", as: "departmentDoc" } },
      { $unwind: { path: "$departmentDoc", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "categoryDoc" } },
      { $unwind: { path: "$categoryDoc", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "brands", localField: "brand", foreignField: "_id", as: "brandDoc" } },
      { $unwind: { path: "$brandDoc", preserveNullAndEmptyArrays: true } }
    );

    const matchStage2 = {};
    if (departments) {
      const deptList = departments.split(",").map(d => d.trim()).filter(Boolean);
      matchStage2["departmentDoc.name"] = {
        $in: deptList.flatMap(d => [
          new RegExp(`^${d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i"),
          ...(d.toLowerCase() === "beauty" ? [new RegExp("beauty", "i")] : [])
        ])
      };
    }
    if (categories) {
      const catList = categories.split(",").map(c => c.trim()).filter(Boolean);
      matchStage2["categoryDoc.name"] = {
        $in: catList.flatMap(c => [
          new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i"),
          new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i")
        ])
      };
    }
    if (brands) matchStage2["brandDoc.name"] = { $in: brands.split(",").map(b => b.trim()) };
    
    if (Object.keys(matchStage2).length > 0) pipeline.push({ $match: matchStage2 });

    pipeline.push({
      $lookup: { from: "variants", localField: "_id", foreignField: "product", as: "variants" }
    });

    let colorOptionIds = [];
    if (colors) {
      const colorNames = colors.split(',').map(s => s.trim());
      const colorAttrs = await Attribute.find({ name: { $regex: /^(color|color \/ shade|shade)$/i } }).lean();
      const colorAttrIds = colorAttrs.map(a => a._id);
      if (colorAttrIds.length > 0) {
        const opts = await AttributeOption.find({
          attribute: { $in: colorAttrIds },
          $or: [
            { storedValue: { $in: colorNames } },
            { displayName: { $in: colorNames } }
          ]
        }).lean();
        colorOptionIds = opts.map(o => o._id);
      } else {
        colorOptionIds = [new mongoose.Types.ObjectId()]; 
      }
    }

    const postLookupMatch = {};
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim().replace(/\s+/g, "[-\\s]*"), "i");
      postLookupMatch.$or = [
        { title: searchRegex },
        { shortDescription: searchRegex },
        { slug: searchRegex },
        { "variants.sku": searchRegex }
      ];
    }

    const variantElemMatch = {};
    if (minPrice !== undefined || maxPrice !== undefined) {
      variantElemMatch.price = {};
      if (minPrice !== undefined) variantElemMatch.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) variantElemMatch.price.$lte = Number(maxPrice);
    }
    if (colors) {
      variantElemMatch["attributes.option"] = { $in: colorOptionIds };
    }

    if (Object.keys(variantElemMatch).length > 0) {
      postLookupMatch.variants = { $elemMatch: variantElemMatch };
    }

    if (Object.keys(postLookupMatch).length > 0) {
      pipeline.push({ $match: postLookupMatch });
    }

    // Sort products first
    const sortStage = {};
    if (sort === "newest") sortStage.createdAt = -1;
    else if (sort === "ratingDesc") { sortStage.ratingAverage = -1; sortStage.ratingCount = -1; }
    else sortStage.createdAt = -1;
    pipeline.push({ $sort: sortStage });

    // Format population shape
    pipeline.push({
      $addFields: {
        department: {
          $cond: { if: "$departmentDoc._id", then: { _id: "$departmentDoc._id", name: "$departmentDoc.name" }, else: "$department" }
        },
        category: {
          $cond: { if: "$categoryDoc._id", then: { _id: "$categoryDoc._id", name: "$categoryDoc.name" }, else: "$category" }
        },
        brand: {
          $cond: { if: "$brandDoc._id", then: { _id: "$brandDoc._id", name: "$brandDoc.name" }, else: "$brand" }
        }
      }
    });

    pipeline.push({
      $project: { departmentDoc: 0, categoryDoc: 0, brandDoc: 0, sortPrice: 0 }
    });

    // Execute pipeline to get ALL matching products (since we need to group variants accurately across pages)
    // Note: For massive catalogs, this should be done purely via a complex Mongo $unwind and $group aggregation.
    // For now, in-memory grouping of filtered products provides 100% accuracy matching the frontend behavior.
    const allMatchingProducts = await Product.aggregate(pipeline);

    if (allMatchingProducts.length > 0) {
      await Product.populate(allMatchingProducts, [
        { path: "variants.attributes.attribute", model: "Attribute", select: "name fieldType" },
        { path: "variants.attributes.option", model: "AttributeOption", select: "displayName storedValue" }
      ]);
    }

    const groupMap = {};
    const groupOrder = [];

    allMatchingProducts.forEach(product => {
      if (!product.variants || product.variants.length === 0) return;
      
      let primaryAttrId = null;
      const firstVariant = product.variants[0];
      if (firstVariant && firstVariant.attributes) {
        const colorAttr = firstVariant.attributes.find(
          a => a.attribute && ((a.attribute.name && /^(color|color \/ shade|shade)$/i.test(a.attribute.name)) || a.attribute.fieldType === 'color')
        );
        if (colorAttr && colorAttr.attribute) {
          primaryAttrId = colorAttr.attribute._id;
        } else if (firstVariant.attributes[0] && firstVariant.attributes[0].attribute) {
          primaryAttrId = firstVariant.attributes[0].attribute._id;
        }
      }

      product.variants.forEach(variant => {
        let primaryOption = null;
        let secondaryOptionsList = [];

        if (variant.attributes) {
          variant.attributes.forEach(attr => {
            if (attr.attribute && attr.attribute._id.toString() === (primaryAttrId ? primaryAttrId.toString() : null)) {
              primaryOption = attr.option;
            } else if (attr.option && attr.option.displayName) {
              secondaryOptionsList.push(attr.option.displayName);
            }
          });
        }

        const primaryOptionId = primaryOption ? primaryOption._id.toString() : 'default';
        const primaryOptionName = primaryOption ? primaryOption.displayName : 'Standard';
        
        const groupId = `${product._id}-${primaryOptionId}`;

        if (!groupMap[groupId]) {
          groupMap[groupId] = {
            id: groupId,
            productId: product._id,
            productDisplayId: product.productId,
            productTitle: product.title,
            productImage: variant.mainImage?.url || null,
            primaryOptionId: primaryOptionId,
            primaryOptionName: primaryOptionName,
            secondaryOptions: new Set(),
            prices: [],
            stock: 0,
            gstRates: new Set(),
            ratingAverage: product.ratingAverage || 0,
            ratingCount: product.ratingCount || 0
          };
          groupOrder.push(groupId);
        }

        const group = groupMap[groupId];
        secondaryOptionsList.forEach(opt => group.secondaryOptions.add(opt));
        if (variant.price) group.prices.push(Number(variant.price));
        if (variant.stock) group.stock += Number(variant.stock);
        if (variant.gstRate) group.gstRates.add(Number(variant.gstRate));
      });
    });

    const allVariantGroups = groupOrder.map(id => {
      const g = groupMap[id];
      const validPrices = g.prices.filter(p => !isNaN(p) && p > 0);
      return {
        ...g,
        secondaryOptions: Array.from(g.secondaryOptions),
        minPrice: validPrices.length > 0 ? Math.min(...validPrices) : 0,
        maxPrice: validPrices.length > 0 ? Math.max(...validPrices) : 0,
        gstRates: Array.from(g.gstRates).sort((a, b) => a - b),
        prices: undefined // clean up memory
      };
    });

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;
    
    const paginatedGroups = allVariantGroups.slice(skip, skip + limitNum);
    const total = allVariantGroups.length;

    return res.status(200).json({
      success: true,
      message: "Variant groups fetched successfully",
      data: {
        variantGroups: paginatedGroups,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("[Get All Variant Groups Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch variant groups",
      data: null,
    });
  }
};

// GET ALL PRODUCTS (with pagination, search, sort, filter)
export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sort = "newest", // New param
      sortBy, // Old param
      sortOrder, // Old param
      department, // Old param
      departments, // New param (comma-separated names)
      category, // Old param
      categories, // New param
      brand, // Old param
      brands, // New param
      minPrice,
      maxPrice,
      colors, // New param (comma-separated names)
      status,
    } = req.query;

    const pipeline = [];
    const matchStage1 = {};

    if (status) matchStage1.status = status;

    // Backward compatibility for ObjectIds
    if (department && mongoose.isValidObjectId(department)) {
      matchStage1.department = new mongoose.Types.ObjectId(department);
    }
    if (category && mongoose.isValidObjectId(category)) {
      matchStage1.category = new mongoose.Types.ObjectId(category);
    }
    if (brand && mongoose.isValidObjectId(brand)) {
      matchStage1.brand = new mongoose.Types.ObjectId(brand);
    }

    pipeline.push({ $match: matchStage1 });

    // Lookup refs to populate and filter by names
    pipeline.push(
      { $lookup: { from: "departments", localField: "department", foreignField: "_id", as: "departmentDoc" } },
      { $unwind: { path: "$departmentDoc", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "categoryDoc" } },
      { $unwind: { path: "$categoryDoc", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "brands", localField: "brand", foreignField: "_id", as: "brandDoc" } },
      { $unwind: { path: "$brandDoc", preserveNullAndEmptyArrays: true } }
    );

    // Name-based filters
    const matchStage2 = {};
    if (departments) {
      const deptList = departments.split(",").map(d => d.trim()).filter(Boolean);
      matchStage2["departmentDoc.name"] = {
        $in: deptList.flatMap(d => [
          new RegExp(`^${d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i"),
          ...(d.toLowerCase() === "beauty" ? [new RegExp("beauty", "i")] : [])
        ])
      };
    }
    if (categories) {
      const catList = categories.split(",").map(c => c.trim()).filter(Boolean);
      matchStage2["categoryDoc.name"] = {
        $in: catList.flatMap(c => [
          new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i"),
          new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i")
        ])
      };
    }
    if (brands) {
      matchStage2["brandDoc.name"] = { $in: brands.split(",").map(b => b.trim()) };
    }
    
    if (Object.keys(matchStage2).length > 0) {
      pipeline.push({ $match: matchStage2 });
    }

    // Lookup variants for pricing, search, colors
    pipeline.push({
      $lookup: { from: "variants", localField: "_id", foreignField: "product", as: "variants" }
    });

    // Color attributes metadata
    let colorOptionIds = [];
    if (colors) {
      const colorNames = colors.split(',').map(s => s.trim());
      const colorAttr = await Attribute.findOne({ name: { $regex: /^(color|color \/ shade|shade)$/i } }).lean();
      if (colorAttr) {
        const opts = await AttributeOption.find({
          attribute: colorAttr._id,
          $or: [
            { storedValue: { $in: colorNames } },
            { displayName: { $in: colorNames } }
          ]
        }).lean();
        colorOptionIds = opts.map(o => o._id);
      } else {
        colorOptionIds = [new mongoose.Types.ObjectId()]; 
      }
    }

    const postLookupMatch = {};

    // Search text & SKU
    if (search.trim()) {
      // Replace spaces with a pattern that matches spaces, hyphens, or no space
      const searchRegex = new RegExp(search.trim().replace(/\s+/g, "[-\\s]*"), "i");
      postLookupMatch.$or = [
        { title: searchRegex },
        { shortDescription: searchRegex },
        { slug: searchRegex },
        { "variants.sku": searchRegex }
      ];
    }

    // Variant nested filters
    const variantElemMatch = {};
    if (minPrice !== undefined || maxPrice !== undefined) {
      variantElemMatch.price = {};
      if (minPrice !== undefined) variantElemMatch.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) variantElemMatch.price.$lte = Number(maxPrice);
    }
    if (colors) {
      variantElemMatch["attributes.option"] = { $in: colorOptionIds };
    }

    if (Object.keys(variantElemMatch).length > 0) {
      postLookupMatch.variants = { $elemMatch: variantElemMatch };
    }

    if (Object.keys(postLookupMatch).length > 0) {
      pipeline.push({ $match: postLookupMatch });
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    // Price sorting support
    const sortStage = {};
    if (sort === "priceAsc") {
      pipeline.push({
        $addFields: {
          sortPrice: {
            $cond: {
              if: { $gt: [{ $size: "$variants" }, 0] },
              then: { $min: "$variants.price" },
              else: Infinity
            }
          }
        }
      });
      sortStage.sortPrice = 1;
    } else if (sort === "priceDesc") {
      pipeline.push({
        $addFields: {
          sortPrice: {
            $cond: {
              if: { $gt: [{ $size: "$variants" }, 0] },
              then: { $max: "$variants.price" },
              else: -1
            }
          }
        }
      });
      sortStage.sortPrice = -1;
    } else if (sort === "ratingDesc") {
      sortStage.ratingAverage = -1;
      sortStage.ratingCount = -1;
    } else if (sort === "newest") {
      sortStage.createdAt = -1;
    } else if (sort === "random") {
      // Handled as $sample stage later
    } else if (sortBy) {
      sortStage[sortBy] = sortOrder === "asc" ? 1 : -1;
    } else {
      sortStage.createdAt = -1;
    }

    if (sort === "random") {
      pipeline.push({ $sample: { size: limitNum } });
    } else if (Object.keys(sortStage).length > 0) {
      pipeline.push({ $sort: sortStage });
    }

    // Format population shape
    pipeline.push({
      $addFields: {
        department: {
          $cond: { if: "$departmentDoc._id", then: { _id: "$departmentDoc._id", name: "$departmentDoc.name" }, else: "$department" }
        },
        category: {
          $cond: { if: "$categoryDoc._id", then: { _id: "$categoryDoc._id", name: "$categoryDoc.name" }, else: "$category" }
        },
        brand: {
          $cond: { if: "$brandDoc._id", then: { _id: "$brandDoc._id", name: "$brandDoc.name" }, else: "$brand" }
        }
      }
    });

    pipeline.push({
      $project: { departmentDoc: 0, categoryDoc: 0, brandDoc: 0, sortPrice: 0 }
    });

    // Execute with facet for pagination

    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limitNum }]
      }
    });

    const result = await Product.aggregate(pipeline);
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;
    const products = result[0].data;

    // Populate variant attributes safely on returned docs
    if (products.length > 0) {
      await Product.populate(products, [
        { path: "attributes.attribute", model: "Attribute", select: "name fieldType" },
        { path: "variants.attributes.attribute", model: "Attribute", select: "name fieldType" },
        { path: "variants.attributes.option", model: "AttributeOption", select: "displayName storedValue" }
      ]);
    }

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("[Get All Products Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      data: null,
    });
  }
};

// GET SINGLE PRODUCT BY ID (with reviews)
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate("department", "name")
      .populate("category", "name")
      .populate("brand", "name")
      .populate("attributes.attribute", "name fieldType")
      .populate("attributes.attribute", "name fieldType");

    if (!product) {
      console.log("[Get Product By Id] Product is null for ID:", id);
      return res.status(404).json({
        success: false,
        message: "Product not found",
        data: null,
      });
    }

    console.log("Product found:", product);

    const reviews = await ProductReview.find({ product: id })
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .lean();

    const responsePayload = { product, reviews };
    console.log("[Get Product By Id] Final JSON to frontend:", JSON.stringify(responsePayload, null, 2));

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: responsePayload,
    });
  } catch (error) {
    console.error("[Get Product By Id Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      data: null,
    });
  }
};

// GET SINGLE PRODUCT BY SLUG (Public typically, but good to have)
export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug })
      .populate("department", "name")
      .populate("category", "name")
      .populate("brand", "name")
      .populate("attributes.attribute", "name fieldType")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        data: null,
      });
    }

    const variants = await Variant.find({ product: product._id, status: "Active" })
      .populate("attributes.attribute", "name fieldType")
      .populate("attributes.option", "displayName storedValue")
      .lean();
      
    product.variants = variants;

    const reviews = await ProductReview.find({ product: product._id })
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: { product, reviews },
    });
  } catch (error) {
    console.error("[Get Product By Slug Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      data: null,
    });
  }
};

// ADD PRODUCT
export const addProduct = async (req, res) => {
  try {
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

    // Validate required fields
    if (
      !title?.trim() ||
      !slug?.trim() ||
      !shortDescription?.trim() ||
      !longDescription?.trim() ||
      !department ||
      !category ||
      !brand
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
        data: null,
      });
    }

    // Auto-generate unique slug if collision occurs
    const baseSlug = slug.trim().toLowerCase();
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await Product.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Validate references
    const [departmentDoc, categoryDoc, brandDoc] = await Promise.all([
      Department.findOne({ _id: department, status: "Active" }),
      Category.findOne({ _id: category, status: "Active" }),
      Brand.findOne({ _id: brand, status: "Active" }),
    ]);

    if (!departmentDoc) return res.status(400).json({ success: false, message: "Invalid or inactive department" });
    if (!categoryDoc) return res.status(400).json({ success: false, message: "Invalid or inactive category" });
    if (!brandDoc) return res.status(400).json({ success: false, message: "Invalid or inactive brand" });

    // Validate attributes if provided
    let validatedAttributes = [];
    if (attributes && Array.isArray(attributes) && attributes.length > 0) {
      for (const attr of attributes) {
        if (!attr.attribute || !attr.values || !Array.isArray(attr.values)) {
          return res.status(400).json({
            success: false,
            message: "Each attribute must have an attribute ID and values array",
          });
        }

        const attributeDoc = await Attribute.findOne({ _id: attr.attribute, status: "Active" });
        if (!attributeDoc) {
          return res.status(400).json({
            success: false,
            message: `Invalid or inactive attribute: ${attr.attribute}`,
          });
        }

        // If it's a select/color type, validate against AttributeOption
        if (["select", "color", "multiselect"].includes(attributeDoc.fieldType)) {

          const validOptions = await AttributeOption.find({
            attribute: attr.attribute,
            storedValue: { $in: attr.values },
            status: "active",
          });

          console.log("--- Attribute Validation ---");
          console.log(`Attribute Name: ${attributeDoc.name}`);
          console.log(`Submitted Values:`, attr.values);
          console.log(`Valid Stored Values found:`, validOptions.map(o => o.storedValue));
          console.log(`Validation Result: ${validOptions.length === attr.values.length ? 'PASS' : 'FAIL'}`);
          console.log("----------------------------");

          if (validOptions.length !== attr.values.length) {
            return res.status(400).json({
              success: false,
              message: `Some attribute values are invalid for attribute: ${attributeDoc.name}`,
            });
          }
        }

        validatedAttributes.push({
          attribute: attr.attribute,
          values: attr.values,
        });
      }
    }

    let productIdSequence = "";
    try {
      const seq = await getNextSequence('productId');
      productIdSequence = `PROD-${seq}`;
    } catch (err) {
      console.error("Failed to generate productId", err);
    }

    const product = await Product.create({
      productId: productIdSequence,
      title: title.trim(),
      slug: uniqueSlug,
      shortDescription: shortDescription.trim(),
      longDescription: longDescription.trim(),
      department,
      category,
      brand,
      attributes: validatedAttributes,
      status: status || "Inactive",
      returnPolicy: {
        returnable: returnPolicy?.returnable ?? true,
        exchangeable: returnPolicy?.exchangeable ?? true,
        returnDays: returnPolicy?.returnDays !== undefined ? Math.max(0, parseInt(returnPolicy.returnDays) || 0) : 7,
      },
    });

    const populatedProduct = await Product.findById(product._id)
      .populate("department", "name")
      .populate("category", "name")
      .populate("brand", "name");

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: populatedProduct,
    });
  } catch (error) {
    console.error("[Add Product Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      data: null,
    });
  }
};

// UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
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

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        data: null,
      });
    }

    // Validate and ensure Slug uniqueness if changed
    if (slug?.trim()) {
      const baseSlug = slug.trim().toLowerCase();
      if (baseSlug !== product.slug) {
        let uniqueSlug = baseSlug;
        let counter = 1;
        while (await Product.findOne({ slug: uniqueSlug, _id: { $ne: id } })) {
          uniqueSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        product.slug = uniqueSlug;
      }
    }

    // Validations for Department, Category, Brand
    if (department) {
      const departmentDoc = await Department.findOne({ _id: department, status: "Active" });
      if (!departmentDoc) return res.status(400).json({ success: false, message: "Invalid or inactive department" });
      product.department = department;
    }

    if (category) {
      const categoryDoc = await Category.findOne({ _id: category, status: "Active" });
      if (!categoryDoc) return res.status(400).json({ success: false, message: "Invalid or inactive category" });
      product.category = category;
    }

    if (brand) {
      const brandDoc = await Brand.findOne({ _id: brand, status: "Active" });
      if (!brandDoc) return res.status(400).json({ success: false, message: "Invalid or inactive brand" });
      product.brand = brand;
    }

    // Delete orphaned images logic removed from parent update since images moved to variants

    // Validate and update attributes
    if (attributes && Array.isArray(attributes)) {
      let validatedAttributes = [];
      for (const attr of attributes) {
        if (!attr.attribute || !attr.values || !Array.isArray(attr.values)) {
          return res.status(400).json({ success: false, message: "Each attribute must have an attribute ID and values array" });
        }

        const attributeDoc = await Attribute.findOne({ _id: attr.attribute, status: "Active" });
        if (!attributeDoc) {
          return res.status(400).json({ success: false, message: `Invalid or inactive attribute: ${attr.attribute}` });
        }

        if (["select", "color", "multiselect"].includes(attributeDoc.fieldType)) {
          const validOptions = await AttributeOption.find({
            attribute: attr.attribute,
            storedValue: { $in: attr.values },
            status: "active",
          });

          console.log("--- Attribute Validation ---");
          console.log(`Attribute Name: ${attributeDoc.name}`);
          console.log(`Submitted Values:`, attr.values);
          console.log(`Valid Stored Values found:`, validOptions.map(o => o.storedValue));
          console.log(`Validation Result: ${validOptions.length === attr.values.length ? 'PASS' : 'FAIL'}`);
          console.log("----------------------------");

          if (validOptions.length !== attr.values.length) {
            return res.status(400).json({
              success: false,
              message: `Some attribute values are invalid for attribute: ${attributeDoc.name}`,
            });
          }
        }
        validatedAttributes.push({ attribute: attr.attribute, values: attr.values });
      }
      product.attributes = validatedAttributes;
    }

    // Update other fields
    if (title !== undefined) product.title = title.trim();
    if (shortDescription !== undefined) product.shortDescription = shortDescription.trim();
    if (longDescription !== undefined) product.longDescription = longDescription.trim();
    if (status) product.status = status;
    
    if (returnPolicy) {
      if (!product.returnPolicy) product.returnPolicy = {};
      if (returnPolicy.returnable !== undefined) product.returnPolicy.returnable = returnPolicy.returnable;
      if (returnPolicy.exchangeable !== undefined) product.returnPolicy.exchangeable = returnPolicy.exchangeable;
      if (returnPolicy.returnDays !== undefined) product.returnPolicy.returnDays = Math.max(0, parseInt(returnPolicy.returnDays) || 0);
    }

    await product.save();

    const populatedProduct = await Product.findById(id)
      .populate("department", "name")
      .populate("category", "name")
      .populate("brand", "name")
      .populate("attributes.attribute", "name fieldType");

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: populatedProduct,
    });
  } catch (error) {
    console.error("[Update Product Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      data: null,
    });
  }
};

// DELETE PRODUCT (Hard Delete with Image Cleanup, as 'Archived' status handles soft deleting in the UI)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        data: null,
      });
    }

    // Delete images from Cloudinary (from variants)
    const imagesToDelete = [];
    const variants = await Variant.find({ product: id });
    if (variants && variants.length > 0) {
      variants.forEach(variant => {
        if (variant.mainImage?.publicId) imagesToDelete.push(variant.mainImage.publicId);
        if (variant.galleryImages?.length > 0) {
          imagesToDelete.push(...variant.galleryImages.map(img => img.publicId));
        }
      });
    }

    if (imagesToDelete.length > 0) {
      try {
        await Promise.all(imagesToDelete.map(publicId => cloudinary.uploader.destroy(publicId)));
      } catch (cloudinaryErr) {
        console.error("Failed to delete product images from cloudinary", cloudinaryErr);
      }
    }

    await Product.findByIdAndDelete(id);
    
    // Also cleanup reviews and variants related to this product
    await ProductReview.deleteMany({ product: id });
    await Variant.deleteMany({ product: id });

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error("[Delete Product Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      data: null,
    });
  }
};

// GET RELATED PRODUCTS
export const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 8 } = req.query;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        data: null,
      });
    }

    const relatedProducts = await Product.find({
      _id: { $ne: id },
      status: "Active",
      $or: [
        { department: product.department },
        { category: product.category },
        { brand: product.brand },
      ],
    })
      .populate("department", "name")
      .populate("category", "name")
      .populate("brand", "name")
      .limit(Number(limit))
      .lean();

    return res.status(200).json({
      success: true,
      message: "Related products fetched successfully",
      data: relatedProducts,
    });
  } catch (error) {
    console.error("[Get Related Products Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch related products",
      data: null,
    });
  }
};

// UPDATE PRODUCT VARIANTS (Replaces all variants for the product)
export const updateProductVariants = async (req, res) => {
  try {
    const { id } = req.params;
    const { variants } = req.body; // Expecting variants array instead of colors

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!Array.isArray(variants)) {
      return res.status(400).json({
        success: false,
        message: "Variants must be an array",
      });
    }

    const existingVariants = await Variant.find({ product: id });

    // Determine orphaned images by comparing old variants vs new variants
    const oldImageIds = [];
    if (existingVariants && existingVariants.length > 0) {
      existingVariants.forEach(variant => {
        if (variant.mainImage?.publicId) oldImageIds.push(variant.mainImage.publicId);
        if (variant.galleryImages?.length > 0) {
          oldImageIds.push(...variant.galleryImages.map(img => img.publicId));
        }
      });
    }

    const newImageIds = [];
    variants.forEach(variant => {
      if (variant.mainImage?.publicId) newImageIds.push(variant.mainImage.publicId);
      if (variant.galleryImages?.length > 0) {
        newImageIds.push(...variant.galleryImages.map(img => img.publicId));
      }
    });

    const deletedIds = oldImageIds.filter(imgId => !newImageIds.includes(imgId));

    if (deletedIds.length > 0) {
      try {
        await Promise.all(deletedIds.map(publicId => cloudinary.uploader.destroy(publicId)));
      } catch (cloudinaryErr) {
        console.error("Failed to delete orphaned images from cloudinary", cloudinaryErr);
      }
    }

    // Delete existing variants and insert new ones
    await Variant.deleteMany({ product: id });

    const variantsToInsert = variants.map(v => {
      const copy = { ...v, product: id };
      if (!copy._id || copy._id === '') {
        delete copy._id;
      }
      copy.gstRate = [0, 5, 12, 18, 28].includes(Number(copy.gstRate)) ? Number(copy.gstRate) : 5;
      if (copy.mainImage && !copy.mainImage.publicId) {
        copy.mainImage.publicId = 'default_public_id';
      }
      if (Array.isArray(copy.galleryImages)) {
        copy.galleryImages = copy.galleryImages.map(img => ({
          ...img,
          publicId: img.publicId || 'default_public_id'
        }));
      }
      return copy;
    });
    
    await Variant.insertMany(variantsToInsert);

    return res.status(200).json({
      success: true,
      message: "Variants updated successfully",
      data: variantsToInsert,
    });
  } catch (error) {
    console.error("[Update Variants Error]:", error);
    const errMessage = error?.message?.includes('E11000') 
      ? "Duplicate SKU error: Each variant row must have a unique SKU." 
      : (error.message || "Failed to update variants");
    return res.status(400).json({
      success: false,
      message: errMessage,
    });
  }
};

// GET PRODUCT VARIANTS
export const getProductVariants = async (req, res) => {
  try {
    const { id } = req.params;
    const variants = await Variant.find({ product: id })
      .populate("attributes.attribute", "name fieldType")
      .populate("attributes.option", "displayName storedValue");
      
    return res.status(200).json({
      success: true,
      message: "Variants fetched successfully",
      data: variants,
    });
  } catch (error) {
    console.error("[Get Variants Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch variants",
    });
  }
};

// GET NEW ARRIVALS
export const getNewArrivals = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);

    // 1. Fetch random active products
    const rawProducts = await Product.aggregate([
      { $match: { status: "Active" } },
      { $sample: { size: limit } }
    ]);

    // 2. Populate brand name
    const populatedProducts = await Product.populate(rawProducts, [
      { path: "brand", select: "name" }
    ]);

    // 3. Get variants for pricing and images
    const productIds = populatedProducts.map(p => p._id);
    const variants = await Variant.find({ product: { $in: productIds }, status: "Active" }).lean();

    // 4. Format clean UI payload
    const formattedProducts = populatedProducts.map(product => {
      // Find the first active variant
      const variant = variants.find(v => v.product.toString() === product._id.toString());
      
      const images = [];
      let sellingPrice = 0;
      let originalPrice = 0;
      let discountPercentage = 0;

      if (variant) {
        if (variant.mainImage?.url) images.push(variant.mainImage);
        if (variant.galleryImages?.length > 0) {
          images.push(...variant.galleryImages);
        }
        sellingPrice = variant.price || 0;
        originalPrice = variant.mrp || 0;
        
        if (originalPrice > sellingPrice && originalPrice > 0) {
          discountPercentage = Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
        }
      }

      return {
        id: product._id,
        slug: product.slug,
        brand: product.brand?.name || "Unknown Brand",
        productName: product.title,
        price: sellingPrice,
        mrp: originalPrice,
        discountPercentage,
        rating: product.ratingAverage || null,
        ratingCount: product.ratingCount || 0,
        images
      };
    });

    return res.status(200).json({
      success: true,
      message: "New arrivals fetched successfully",
      data: formattedProducts
    });

  } catch (error) {
    console.error("[Get New Arrivals Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch new arrivals",
    });
  }
};
