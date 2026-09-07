import Brand from "../models/brand.js";
import Department from "../models/department.js";
import Product from "../models/product.js";

// GET All Brands (with pagination, search, filter)
export const getBrands = async (req, res) => {
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
    const deptId = department || departmentId;
    if (deptId) query.departmentIds = deptId;

    let sortOptions = { createdAt: 1 };
    if (sort) {
      const [field, order] = sort.split(":");
      if (field && order) sortOptions[field] = order === "asc" ? 1 : -1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const brands = await Brand.find(query)
      .populate("departmentIds", "name")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Brand.countDocuments(query);

    res.status(200).json({
      success: true,
      count: brands.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      brands,
    });
  } catch (error) {
    console.error("[Get Brands] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch brands.",
    });
  }
};

// GET Single Brand
export const getBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id).populate("departmentIds", "name");

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found.",
      });
    }

    res.status(200).json({
      success: true,
      brand,
    });
  } catch (error) {
    console.error("[Get Brand] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch brand.",
    });
  }
};

// GET Brands By Department
export const getBrandsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const brands = await Brand.find({
      departmentIds: departmentId,
      status: "Active",
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: brands.length,
      brands,
    });
  } catch (error) {
    console.error("[Get Brands By Department] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch brands.",
    });
  }
};

// POST Create Brand
export const createBrand = async (req, res) => {
  try {
    const { departmentIds, name, slug, status } = req.body;

    if (!departmentIds || departmentIds.length === 0 || !name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Department, brand name, and slug are required.",
      });
    }

    const departmentsExist = await Department.find({ _id: { $in: departmentIds } });
    if (departmentsExist.length !== departmentIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more departments not found.",
      });
    }

    // Check globally unique name or slug
    const existingBrand = await Brand.findOne({
      $or: [{ name: name.trim() }, { slug: slug.trim().toLowerCase() }],
    });

    if (existingBrand) {
      return res.status(409).json({
        success: false,
        message: "A brand with this name or slug already exists.",
      });
    }

    const brand = await Brand.create({
      departmentIds,
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      status: status || "Active",
    });

    res.status(201).json({
      success: true,
      message: "Brand created successfully.",
      brand,
    });
  } catch (error) {
    console.error("[Create Brand] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create brand.",
    });
  }
};

// PUT Update Brand
export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentIds, name, slug, status } = req.body;

    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found.",
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
      brand.departmentIds = departmentIds;
    }

    if (name || slug) {
      const query = { _id: { $ne: id }, $or: [] };
      if (name) query.$or.push({ name: name.trim() });
      if (slug) query.$or.push({ slug: slug.trim().toLowerCase() });

      if (query.$or.length > 0) {
        const existingBrand = await Brand.findOne(query);
        if (existingBrand) {
          return res.status(409).json({
            success: false,
            message: "A brand with this name or slug already exists.",
          });
        }
      }
    }

    if (name) brand.name = name.trim();
    if (slug) brand.slug = slug.trim().toLowerCase();
    if (status) brand.status = status;

    await brand.save();

    res.status(200).json({
      success: true,
      message: "Brand updated successfully.",
      brand,
    });
  } catch (error) {
    console.error("[Update Brand] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update brand.",
    });
  }
};

// DELETE Brand (Hard Delete with constraints)
export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found.",
      });
    }

    // Validation: Check if any Products use this Brand
    const productCount = await Product.countDocuments({ brand: id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete: Products depend on this Brand.",
      });
    }

    await Brand.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Brand deleted successfully.",
    });
  } catch (error) {
    console.error("[Delete Brand] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete brand.",
    });
  }
};
