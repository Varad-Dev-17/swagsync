import Department from "../models/department.js";
import Category from "../models/category.js";
import Product from "../models/product.js";
import Attribute from "../models/attribute.js";
import AttributeMapping from "../models/attributeMapping.js";

const attachColorMetadata = async (categories) => {
  if (!categories || categories.length === 0) return [];
  const colorAttrs = await Attribute.find({
    name: { $regex: /^(color|color \/ shade|shade)$/i }
  }).select("_id");
  const colorAttrIds = colorAttrs.map(a => a._id);

  const catIds = categories.map(c => c._id);
  const colorMappings = await AttributeMapping.find({
    category: { $in: catIds },
    attribute: { $in: colorAttrIds }
  }).select("category");

  const colorCatIdSet = new Set(colorMappings.map(m => m.category.toString()));

  return categories.map(c => {
    const doc = c.toObject ? c.toObject() : { ...c };
    doc.hasColors = colorCatIdSet.has(c._id.toString());
    return doc;
  });
};

// GET ALL CATEGORIES (with search, sort, filter, pagination)
export const getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, department, departmentId, sort } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } }
      ];
    }
    if (status) query.status = status;
    // Filter by departmentId inside the array
    const deptId = department || departmentId;
    if (deptId) query.departmentIds = deptId;

    let sortOptions = { createdAt: 1 };
    if (sort) {
      const [field, order] = sort.split(":");
      if (field && order) sortOptions[field] = order === "asc" ? 1 : -1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const categories = await Category.find(query)
      .populate("departmentIds", "name")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Category.countDocuments(query);
    const categoriesWithMeta = await attachColorMetadata(categories);

    res.status(200).json({
      success: true,
      count: categories.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      categories: categoriesWithMeta,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories.",
    });
  }
};

// GET SINGLE CATEGORY
export const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate("departmentIds", "name");

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const [categoryWithMeta] = await attachColorMetadata([category]);

    res.status(200).json({
      success: true,
      category: categoryWithMeta,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category.",
    });
  }
};

// GET CATEGORIES BY DEPARTMENT
export const getCategoriesByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const categories = await Category.find({
      departmentIds: departmentId,
      status: "Active",
    }).sort({ createdAt: 1 });

    const categoriesWithMeta = await attachColorMetadata(categories);

    res.status(200).json({
      success: true,
      count: categories.length,
      categories: categoriesWithMeta,
    });
  } catch (error) {
    console.error("Error fetching categories by department:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories.",
    });
  }
};

// CREATE CATEGORY
export const createCategory = async (req, res) => {
  try {
    const { departmentIds, name, slug, status, image } = req.body;

    if (!departmentIds || departmentIds.length === 0 || !name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Department, name, and slug are required.",
      });
    }

    const departmentsExist = await Department.find({ _id: { $in: departmentIds } });
    if (departmentsExist.length !== departmentIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more departments not found.",
      });
    }

    // Check uniqueness (case-insensitive name and slug)
    const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await Category.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${escapedName}$`, "i") } },
        { slug: slug.trim().toLowerCase() }
      ],
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Already present: Category "${existing.name}" already exists.`,
      });
    }

    const category = await Category.create({
      departmentIds,
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      status: status || "Active",
      image: image || undefined,
      vendorId: req.vendor?._id || null,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Already present: A category with this name or slug already exists.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to create category.",
    });
  }
};

// UPDATE CATEGORY
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentIds, name, slug, status, image } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // Vendor permission:
    // If category was NOT created by this vendor (existing/system or another vendor):
    // Vendor cannot rename, modify slug, or remove existing departments, but CAN add new departments.
    if (req.vendor && String(category.vendorId || '') !== String(req.vendor._id)) {
      if (name && name.trim() !== category.name) {
        return res.status(400).json({
          success: false,
          message: "Cannot modify the name of an existing category.",
        });
      }
      if (slug && slug.trim().toLowerCase() !== category.slug) {
        return res.status(400).json({
          success: false,
          message: "Cannot modify the slug of an existing category.",
        });
      }

      if (departmentIds) {
        const existingDeptIds = (category.departmentIds || []).map((d) => d.toString());
        const incomingDeptIds = departmentIds.map((d) => d.toString());
        const removedDepts = existingDeptIds.filter((d) => !incomingDeptIds.includes(d));
        if (removedDepts.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Cannot remove existing departments from an existing category.",
          });
        }

        const newlyAdded = incomingDeptIds.filter((d) => !existingDeptIds.includes(d));
        if (newlyAdded.length > 0) {
          const departmentsExist = await Department.find({ _id: { $in: newlyAdded } });
          if (departmentsExist.length !== newlyAdded.length) {
            return res.status(404).json({
              success: false,
              message: "One or more departments not found.",
            });
          }
          category.departmentIds = Array.from(new Set([...existingDeptIds, ...newlyAdded]));
        }
      }

      await category.save();
      return res.status(200).json({
        success: true,
        message: "Category updated successfully.",
        category,
      });
    }

    if (departmentIds) {
      const departmentsExist = await Department.find({ _id: { $in: departmentIds } });
      if (departmentsExist.length !== departmentIds.length) {
        return res.status(404).json({
          success: false,
          message: "One or more departments not found.",
        });
      }
      category.departmentIds = departmentIds;
    }

    if (name || slug) {
      const query = { 
        _id: { $ne: id }, 
        $or: [] 
      };
      
      if (name) {
        const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        query.$or.push({ name: { $regex: new RegExp(`^${escapedName}$`, "i") } });
      }
      if (slug) query.$or.push({ slug: slug.trim().toLowerCase() });

      if (query.$or.length > 0) {
        const existing = await Category.findOne(query);
        if (existing) {
          return res.status(409).json({
            success: false,
            message: `Already present: Category "${existing.name}" already exists.`,
          });
        }
      }
    }

    if (name) category.name = name.trim();
    if (slug) category.slug = slug.trim().toLowerCase();
    if (status) category.status = status;
    if (image !== undefined) category.image = image;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      category,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Already present: A category with this name or slug already exists.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to update category.",
    });
  }
};

// DELETE CATEGORY (Hard Delete with Relational Validation)
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // Vendor permission: Vendors can only delete their own categories
    if (req.vendor && String(category.vendorId || '') !== String(req.vendor._id)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only delete categories created by your vendor account.",
      });
    }

    // Validation 1: Check if any Products are linked
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${productCount} product(s) are currently associated with this Category.`,
      });
    }

    // Cascade delete Attribute Mappings
    await AttributeMapping.deleteMany({ category: id });

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete category.",
    });
  }
};
