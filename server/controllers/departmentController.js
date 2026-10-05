import Department from "../models/department.js";
import Category from "../models/category.js";
import Product from "../models/product.js";

// Get All Departments (with Search, Filter, Sort, Pagination)
export const getDepartments = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, sort } = req.query;

    // Build query
    const query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (status) {
      query.status = status;
    }

    // Build sort options
    let sortOptions = { createdAt: 1 };
    if (sort) {
      const [field, order] = sort.split(':');
      if (field && order) {
        sortOptions[field] = order === 'asc' ? 1 : -1;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const departments = await Department.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Department.countDocuments(query);

    res.status(200).json({
      success: true,
      count: departments.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      departments,
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments.",
    });
  }
};

// Get Single Department
export const getDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    res.status(200).json({
      success: true,
      department,
    });
  } catch (error) {
    console.error("Error fetching department:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch department.",
    });
  }
};

// Create Department
export const createDepartment = async (req, res) => {
  try {
    const { name, slug, status, description, iconName } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Department name and slug are required.",
      });
    }

    const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existingDepartment = await Department.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${escapedName}$`, "i") } },
        { slug: slug.trim().toLowerCase() }
      ]
    });

    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        message: `Already present: Department "${existingDepartment.name}" already exists.`,
      });
    }

    const department = await Department.create({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      status: status || "Active",
      description,
      iconName,
    });

    res.status(201).json({
      success: true,
      message: "Department created successfully.",
      department,
    });
  } catch (error) {
    console.error("Error creating department:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Already present: A department with this name or slug already exists.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to create department.",
    });
  }
};

// Update Department
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, status, description, iconName } = req.body;

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    if (name || slug) {
      const query = { _id: { $ne: id }, $or: [] };
      if (name) {
        const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        query.$or.push({ name: { $regex: new RegExp(`^${escapedName}$`, "i") } });
      }
      if (slug) query.$or.push({ slug: slug.trim().toLowerCase() });
      
      if (query.$or.length > 0) {
        const existingDepartment = await Department.findOne(query);
        if (existingDepartment) {
          return res.status(409).json({
            success: false,
            message: `Already present: Department "${existingDepartment.name}" already exists.`,
          });
        }
      }
    }

    if (name) department.name = name.trim();
    if (slug) department.slug = slug.trim().toLowerCase();
    if (status) department.status = status;
    if (description !== undefined) department.description = description;
    if (iconName !== undefined) department.iconName = iconName;

    await department.save();

    res.status(200).json({
      success: true,
      message: "Department updated successfully.",
      department,
    });
  } catch (error) {
    console.error("Error updating department:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Already present: A department with this name or slug already exists.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to update department.",
    });
  }
};

// Delete Department
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }

    // Validation 1: Check Categories (using the new departmentIds array)
    const categoryCount = await Category.countDocuments({ departmentIds: id });
    if (categoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete: Department contains Categories.",
      });
    }

    // Validation 2: Check Products
    const productCount = await Product.countDocuments({ department: id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete: Products are linked to this Department.",
      });
    }

    // Hard delete since it has no dependencies
    await Department.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Department deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete department.",
    });
  }
};
