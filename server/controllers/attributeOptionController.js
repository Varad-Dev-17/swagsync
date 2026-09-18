import mongoose from "mongoose";
import Attribute from "../models/attribute.js";
import AttributeOption from "../models/attributeOption.js";
import Category from "../models/category.js";
import Department from "../models/department.js";
import Product from "../models/product.js";
import Variant from "../models/variant.js";
import AttributeMapping from "../models/attributeMapping.js";

// GET All Attribute Options (supports optional department & category scoping)
export const getAttributeOptions = async (req, res) => {
  try {
    const { department, category } = req.query;

    const hasDeptFilter = department && department !== "all";
    const hasCatFilter = category && category !== "all";

    if (hasDeptFilter || hasCatFilter) {
      // Find color attributes
      const colorAttrs = await Attribute.find({
        name: { $regex: /^(color|color \/ shade|shade)$/i }
      }).lean();
      const colorAttrIds = colorAttrs.map(a => a._id);

      let catDoc = null;
      if (hasCatFilter) {
        const isCatId = mongoose.Types.ObjectId.isValid(category);
        catDoc = await Category.findOne({
          $or: [
            ...(isCatId ? [{ _id: category }] : []),
            { name: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") },
            { slug: category.toLowerCase().trim() }
          ]
        }).lean();
      }

      let deptDoc = null;
      if (hasDeptFilter) {
        const isDeptId = mongoose.Types.ObjectId.isValid(department);
        deptDoc = await Department.findOne({
          $or: [
            ...(isDeptId ? [{ _id: department }] : []),
            { name: new RegExp(`^${department.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") },
            ...(department.toLowerCase() === "beauty" ? [{ name: /beauty/i }] : [])
          ]
        }).lean();
      }

      // If category is specified, verify if this category supports colors
      if (catDoc) {
        const colorMapping = await AttributeMapping.findOne({
          category: catDoc._id,
          attribute: { $in: colorAttrIds }
        }).lean();

        // Also check if any variants of products in this category have color options
        const prodIds = await Product.find({ category: catDoc._id }).distinct("_id");
        const hasVariantColors = await Variant.exists({
          product: { $in: prodIds },
          "attributes.attribute": { $in: colorAttrIds }
        });

        if (!colorMapping && !hasVariantColors) {
          return res.status(200).json({
            success: true,
            count: 0,
            options: []
          });
        }

        // Find the variant options actually used by products in this category
        const variants = await Variant.find({
          product: { $in: prodIds },
          status: "Active"
        }).populate({
          path: "attributes.option",
          populate: { path: "attribute", select: "name fieldType" }
        }).lean();

        const optionsMap = new Map();
        variants.forEach(v => {
          (v.attributes || []).forEach(a => {
            const opt = a.option;
            if (opt && opt.attribute && /^(color|color \/ shade|shade)$/i.test(opt.attribute.name)) {
              optionsMap.set(opt._id.toString(), opt);
            }
          });
        });

        const options = Array.from(optionsMap.values());
        return res.status(200).json({
          success: true,
          count: options.length,
          options
        });
      }

      // If only department is specified
      if (deptDoc) {
        const prodIds = await Product.find({ department: deptDoc._id }).distinct("_id");
        const variants = await Variant.find({
          product: { $in: prodIds },
          status: "Active"
        }).populate({
          path: "attributes.option",
          populate: { path: "attribute", select: "name fieldType" }
        }).lean();

        const optionsMap = new Map();
        variants.forEach(v => {
          (v.attributes || []).forEach(a => {
            const opt = a.option;
            if (opt && opt.attribute && /^(color|color \/ shade|shade)$/i.test(opt.attribute.name)) {
              optionsMap.set(opt._id.toString(), opt);
            }
          });
        });

        const options = Array.from(optionsMap.values());
        return res.status(200).json({
          success: true,
          count: options.length,
          options
        });
      }
    }

    const options = await AttributeOption.find()
      .populate("attribute", "name fieldType")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: options.length,
      options,
    });
  } catch (error) {
    console.error("[Get Attribute Options] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attribute options.",
    });
  }
};

// GET Options By Attribute
export const getOptionsByAttribute = async (req, res) => {
  try {
    const { attributeId } = req.params;
    const { page = 1, limit = 10 } = req.query; // basic pagination

    const attribute = await Attribute.findById(attributeId);
    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found.",
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const options = await AttributeOption.find({ attribute: attributeId })
      .populate("attribute", "name fieldType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AttributeOption.countDocuments({ attribute: attributeId });

    res.status(200).json({
      success: true,
      count: options.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      attribute,
      options,
    });
  } catch (error) {
    console.error("[Get Options By Attribute] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch options by attribute.",
    });
  }
};

// POST Create Attribute Option
export const createAttributeOption = async (req, res) => {
  try {
    const { attribute, displayName, storedValue, hex, status } = req.body;

    if (!attribute || !displayName || !storedValue) {
      return res.status(400).json({
        success: false,
        message: "Attribute ID, displayName, and storedValue are required.",
      });
    }

    const existingAttribute = await Attribute.findById(attribute);
    if (!existingAttribute) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found.",
      });
    }

    // Enforce uniqueness of displayName within the attribute
    const existingOption = await AttributeOption.findOne({
      attribute,
      displayName: displayName.trim(),
    });

    if (existingOption) {
      return res.status(409).json({
        success: false,
        message: "An option with this display name already exists for this attribute.",
      });
    }

    const option = await AttributeOption.create({
      attribute,
      displayName: displayName.trim(),
      storedValue: storedValue.trim(),
      hex: hex ? hex.trim() : undefined,
      status: status || "active"
    });

    res.status(201).json({
      success: true,
      message: "Attribute option created successfully.",
      option,
    });
  } catch (error) {
    console.error("[Create Attribute Option] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create attribute option.",
    });
  }
};

// PUT Update Attribute Option
export const updateAttributeOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, storedValue, hex, status } = req.body;

    const option = await AttributeOption.findById(id);

    if (!option) {
      return res.status(404).json({
        success: false,
        message: "Attribute option not found.",
      });
    }

    if (displayName) {
      const existingOption = await AttributeOption.findOne({
        attribute: option.attribute,
        displayName: displayName.trim()
      });

      if (existingOption && existingOption._id.toString() !== id) {
        return res.status(409).json({
          success: false,
          message: "An option with this display name already exists for this attribute.",
        });
      }

      option.displayName = displayName.trim();
    }

    if (storedValue) option.storedValue = storedValue.trim();
    if (hex !== undefined) option.hex = hex.trim();
    if (status) option.status = status;

    await option.save();

    res.status(200).json({
      success: true,
      message: "Attribute option updated successfully.",
      option,
    });
  } catch (error) {
    console.error("[Update Attribute Option] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update attribute option.",
    });
  }
};

// DELETE Attribute Option (Hard Delete with constraints)
export const deleteAttributeOption = async (req, res) => {
  try {
    const { id } = req.params;

    const option = await AttributeOption.findById(id);

    if (!option) {
      return res.status(404).json({
        success: false,
        message: "Attribute option not found.",
      });
    }

    // Validation 1: Check if any ProductVariants depend on this Option
    // Example: { "attributes.optionId": id }
    // We will implement this constraint once the ProductVariant schema is finalized.

    await AttributeOption.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Attribute option deleted successfully.",
    });
  } catch (error) {
    console.error("[Delete Attribute Option] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete attribute option.",
    });
  }
};
