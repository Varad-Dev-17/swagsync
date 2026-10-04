import { useState, useEffect, useMemo } from "react";
import api from "../../../api/axiosConfig";
import toast from "react-hot-toast";
import {
  Layers,
  LayoutGrid,
  Tag,
  Sliders,
  Search,
  Eye,
  Info,
  ExternalLink,
  Sparkles,
  Boxes,
  CheckCircle2,
  FolderTree,
  ChevronRight,
  X,
  Pencil,
  Trash2,
  Plus,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import DataTable from "../../../components/admin/ui/DataTable";
import StatusBadge from "../../../components/admin/ui/StatusBadge";
import PageLoader from "../../../components/common/PageLoader";
import Pagination from "../../../components/admin/ui/Pagination";

const VendorCatalog = () => {
  const [catalog, setCatalog] = useState({
    departments: [],
    categories: [],
    brands: [],
    attributes: [],
    attributeOptions: [],
  });
  const [currentVendorId, setCurrentVendorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("categories"); // "departments" | "categories" | "brands" | "attributes"
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal inspection state
  const [inspectModal, setInspectModal] = useState({
    open: false,
    title: "",
    entityType: "",
    entityName: "",
    data: null,
  });

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    type: "", // "categories" | "brands" | "attributes"
    id: null,
    name: "",
    isDeleting: false,
  });

  // Expanded attributes accordion state
  const [expandedAttributeIds, setExpandedAttributeIds] = useState(new Set());

  const toggleExpandAttribute = (attrId) => {
    setExpandedAttributeIds((prev) => {
      const next = new Set(prev);
      if (next.has(attrId)) {
        next.delete(attrId);
      } else {
        next.add(attrId);
      }
      return next;
    });
  };

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const res = await api.get("/vendor/portal/catalog");
      if (res.data.success) {
        setCatalog(res.data.data);
        setCurrentVendorId(res.data.data.currentVendorId || null);
      }
    } catch (error) {
      console.error("Fetch catalog error:", error);
      toast.error(error.response?.data?.message || "Failed to load master catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const isOwned = (row) => {
    if (!row || !row.vendorId || !currentVendorId) return false;
    const rowVendorId = typeof row.vendorId === "object" ? row.vendorId._id || row.vendorId : row.vendorId;
    return String(rowVendorId) === String(currentVendorId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.id || !deleteModal.type) return;
    try {
      setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
      const res = await api.delete(`/vendor/portal/${deleteModal.type}/${deleteModal.id}`);
      if (res.data.success) {
        toast.success(res.data.message || "Item deleted successfully");
        setDeleteModal({ open: false, type: "", id: null, name: "", isDeleting: false });
        fetchCatalog();
      }
    } catch (error) {
      console.error("Delete catalog item error:", error);
      toast.error(error.response?.data?.message || "Failed to delete item");
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const tabs = [
    { id: "departments", name: "Departments", icon: Layers, count: catalog.departments?.length || 0 },
    { id: "categories", name: "Categories", icon: LayoutGrid, count: catalog.categories?.length || 0 },
    { id: "brands", name: "Brands", icon: Tag, count: catalog.brands?.length || 0 },
    { id: "attributes", name: "Attributes", icon: Sliders, count: catalog.attributes?.length || 0 },
  ];

  // Options grouped by attribute ID
  const optionsByAttrId = useMemo(() => {
    const map = {};
    (catalog.attributeOptions || []).forEach((opt) => {
      const attrId = opt.attribute?._id?.toString() || opt.attribute?.toString() || opt.attribute;
      if (!map[attrId]) map[attrId] = [];
      map[attrId].push(opt);
    });
    return map;
  }, [catalog.attributeOptions]);

  // Filtered data per tab
  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (activeTab === "departments") {
      if (!q) return catalog.departments || [];
      return (catalog.departments || []).filter(
        (d) => d.name?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)
      );
    }
    if (activeTab === "categories") {
      if (!q) return catalog.categories || [];
      return (catalog.categories || []).filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.department?.name?.toLowerCase().includes(q) ||
          c.slug?.toLowerCase().includes(q)
      );
    }
    if (activeTab === "brands") {
      if (!q) return catalog.brands || [];
      return (catalog.brands || []).filter(
        (b) => b.name?.toLowerCase().includes(q) || b.slug?.toLowerCase().includes(q)
      );
    }
    if (activeTab === "attributes") {
      if (!q) return catalog.attributes || [];
      return (catalog.attributes || []).filter(
        (a) => a.name?.toLowerCase().includes(q) || a.fieldType?.toLowerCase().includes(q)
      );
    }
    return [];
  }, [activeTab, catalog, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  if (loading) {
    return <PageLoader />;
  }

  // Define Columns for each tab
  const departmentColumns = [
    {
      header: "Sr. No.",
      align: "center",
      headerAlign: "center",
      render: (_, index) => (
        <span className="font-bold text-[#fe4a03] text-xs">
          {String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, "0")}
        </span>
      ),
    },
    {
      header: "Department",
      accessor: "name",
      align: "left",
      headerAlign: "left",
      render: (row) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 text-[#fe4a03] flex items-center justify-center shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">{row.name}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Description",
      accessor: "description",
      align: "left",
      headerAlign: "left",
      render: (row) => (
        <span className="text-slate-600 text-xs line-clamp-1 max-w-md">
          {row.description || "Marketplace department for primary taxonomy classification."}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      align: "center",
      headerAlign: "center",
      render: (row) => <StatusBadge status={row.status || "Active"} />,
    },
    {
      header: "Actions",
      align: "center",
      headerAlign: "center",
      render: (row) => (
        <button
          onClick={() =>
            setInspectModal({
              open: true,
              title: "Department Details",
              entityType: "Department",
              entityName: row.name,
              data: row,
            })
          }
          className="p-1.5 text-slate-400 hover:text-[#fe4a03] border border-slate-200 hover:border-[#fe4a03]/30 hover:bg-orange-50 rounded-lg transition-all cursor-pointer"
          title="View Details"
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  const categoryColumns = [
    {
      header: "Sr. No.",
      align: "center",
      headerAlign: "center",
      render: (_, index) => (
        <span className="font-bold text-[#fe4a03] text-xs">
          {String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, "0")}
        </span>
      ),
    },
    {
      header: "Category",
      accessor: "name",
      align: "left",
      headerAlign: "left",
      render: (row) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 text-[#fe4a03] flex items-center justify-center shrink-0">
            <LayoutGrid size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">{row.name}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Department",
      align: "center",
      headerAlign: "center",
      render: (row) => {
        const deptName = row.department?.name || "General";
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-[#fe4a03] border border-orange-200">
            {deptName}
          </span>
        );
      },
    },
    {
      header: "Source",
      align: "center",
      headerAlign: "center",
      render: (row) =>
        isOwned(row) ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Your Category
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
            System
          </span>
        ),
    },
    {
      header: "Status",
      accessor: "status",
      align: "center",
      headerAlign: "center",
      render: (row) => <StatusBadge status={row.status || "Active"} />,
    },
    {
      header: "Actions",
      align: "center",
      headerAlign: "center",
      render: (row) => {
        const owned = isOwned(row);
        return (
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() =>
                setInspectModal({
                  open: true,
                  title: "Category Details",
                  entityType: "Category",
                  entityName: row.name,
                  data: row,
                })
              }
              className="p-1.5 text-slate-400 hover:text-[#fe4a03] border border-slate-200 hover:border-[#fe4a03]/30 hover:bg-orange-50 rounded-lg transition-all cursor-pointer"
              title="View Details"
            >
              <Eye size={15} />
            </button>
            <Link
              to={`/vendor/portal/catalog/categories/edit/${row._id}`}
              className="p-1.5 text-slate-400 hover:text-blue-600 border border-slate-200 hover:border-blue-200 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
              title="Edit Category"
            >
              <Pencil size={15} />
            </Link>
            {owned && (
              <button
                onClick={() =>
                  setDeleteModal({
                    open: true,
                    type: "categories",
                    id: row._id,
                    name: row.name,
                    isDeleting: false,
                  })
                }
                className="p-1.5 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                title="Delete Category"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const brandColumns = [
    {
      header: "Sr. No.",
      align: "center",
      headerAlign: "center",
      render: (_, index) => (
        <span className="font-bold text-[#fe4a03] text-xs">
          {String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, "0")}
        </span>
      ),
    },
    {
      header: "Brand",
      accessor: "name",
      align: "left",
      headerAlign: "left",
      render: (row) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 text-[#fe4a03] flex items-center justify-center shrink-0">
            <Tag size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">{row.name}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Source",
      align: "center",
      headerAlign: "center",
      render: (row) =>
        isOwned(row) ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Your Brand
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
            System
          </span>
        ),
    },
    {
      header: "Status",
      accessor: "status",
      align: "center",
      headerAlign: "center",
      render: (row) => <StatusBadge status={row.status || "Active"} />,
    },
    {
      header: "Actions",
      align: "center",
      headerAlign: "center",
      render: (row) => {
        const owned = isOwned(row);
        return (
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() =>
                setInspectModal({
                  open: true,
                  title: "Brand Details",
                  entityType: "Brand",
                  entityName: row.name,
                  data: row,
                })
              }
              className="p-1.5 text-slate-400 hover:text-[#fe4a03] border border-slate-200 hover:border-[#fe4a03]/30 hover:bg-orange-50 rounded-lg transition-all cursor-pointer"
              title="View Details"
            >
              <Eye size={15} />
            </button>
            <Link
              to={`/vendor/portal/catalog/brands/edit/${row._id}`}
              className="p-1.5 text-slate-400 hover:text-blue-600 border border-slate-200 hover:border-blue-200 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
              title="Edit Brand"
            >
              <Pencil size={15} />
            </Link>
            {owned && (
              <button
                onClick={() =>
                  setDeleteModal({
                    open: true,
                    type: "brands",
                    id: row._id,
                    name: row.name,
                    isDeleting: false,
                  })
                }
                className="p-1.5 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                title="Delete Brand"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const attributeColumns = [
    {
      header: "Sr. No.",
      align: "center",
      headerAlign: "center",
      render: (_, index) => (
        <span className="font-bold text-[#fe4a03] text-xs">
          {String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, "0")}
        </span>
      ),
    },
    {
      header: "Attribute Name",
      accessor: "name",
      align: "left",
      headerAlign: "left",
      render: (row) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 text-[#fe4a03] flex items-center justify-center shrink-0">
            <Sliders size={18} />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">{row.name}</p>
            <p className="text-xs text-slate-400 font-medium">Field Type: {row.fieldType || "Select"}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Available Options",
      align: "left",
      headerAlign: "left",
      render: (row) => {
        const opts = optionsByAttrId[row._id?.toString()] || [];
        if (opts.length === 0) {
          return <span className="text-slate-400 text-xs italic">No preset options</span>;
        }

        const isExpanded = expandedAttributeIds.has(row._id?.toString());
        const displayOpts = isExpanded ? opts : opts.slice(0, 5);
        const hasMore = opts.length > 5;
        const moreCount = opts.length - 5;

        return (
          <div className="py-1">
            <div className="flex flex-wrap items-center gap-1.5 max-w-lg transition-all duration-200">
              {displayOpts.map((opt) => (
                <span
                  key={opt._id}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {row.fieldType === "color" && opt.storedValue && (
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0 shadow-xs"
                      style={{ backgroundColor: opt.storedValue }}
                    />
                  )}
                  <span>{opt.displayName || opt.storedValue}</span>
                </span>
              ))}

              {hasMore && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpandAttribute(row._id?.toString());
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-[#fe4a03] font-bold hover:underline cursor-pointer bg-[#fe4a03]/5 hover:bg-[#fe4a03]/10 px-2 py-0.5 rounded-md border border-[#fe4a03]/20 transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={12} />
                      <span>Show less</span>
                    </>
                  ) : (
                    <>
                      <span>+{moreCount} more</span>
                      <ChevronDown size={12} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: "Source",
      align: "center",
      headerAlign: "center",
      render: (row) =>
        isOwned(row) ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Your Attribute
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
            System
          </span>
        ),
    },
    {
      header: "Status",
      accessor: "status",
      align: "center",
      headerAlign: "center",
      render: (row) => <StatusBadge status={row.status || "Active"} />,
    },
    {
      header: "Actions",
      align: "center",
      headerAlign: "center",
      render: (row) => {
        const opts = optionsByAttrId[row._id?.toString()] || [];
        const owned = isOwned(row);
        return (
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => {
                setInspectModal({
                  open: true,
                  title: "Attribute Options",
                  entityType: "Attribute",
                  entityName: row.name,
                  data: { ...row, options: opts },
                });
              }}
              className="p-1.5 text-slate-400 hover:text-[#fe4a03] border border-slate-200 hover:border-[#fe4a03]/30 hover:bg-orange-50 rounded-lg transition-all cursor-pointer"
              title="View Options"
            >
              <Eye size={15} />
            </button>
            <Link
              to={`/vendor/portal/catalog/attributes/edit/${row._id}`}
              className="p-1.5 text-slate-400 hover:text-blue-600 border border-slate-200 hover:border-blue-200 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
              title="Edit Attribute"
            >
              <Pencil size={15} />
            </Link>
            {owned && (
              <button
                onClick={() =>
                  setDeleteModal({
                    open: true,
                    type: "attributes",
                    id: row._id,
                    name: row.name,
                    isDeleting: false,
                  })
                }
                className="p-1.5 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                title="Delete Attribute"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const currentColumns =
    activeTab === "departments"
      ? departmentColumns
      : activeTab === "categories"
      ? categoryColumns
      : activeTab === "brands"
      ? brandColumns
      : attributeColumns;

  return (
    <div className="flex-1 overflow-x-hidden flex flex-col bg-[#f8f9fc] min-h-screen">
      {/* Tab switcher buttons */}
      <div className="px-6 sm:px-8 pt-6 pb-6 w-full max-w-7xl mx-auto">
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearch("");
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-[13px] transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#fe4a03] text-white shadow-md shadow-[#fe4a03]/20"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                {tab.name}
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-6 sm:px-8 pb-8 w-full max-w-7xl mx-auto space-y-4">
        {/* Search & Actions Toolbar */}
        <div className="bg-white rounded-2xl p-4 px-6 shadow-2xs border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#fe4a03] border border-orange-100 flex items-center justify-center shrink-0">
              {activeTab === "departments" && <Layers size={20} />}
              {activeTab === "categories" && <LayoutGrid size={20} />}
              {activeTab === "brands" && <Tag size={20} />}
              {activeTab === "attributes" && <Sliders size={20} />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight capitalize">
                {activeTab}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {activeTab === "departments" && "Master marketplace departments (Read-only taxonomy)"}
                {activeTab === "categories" && "Department-mapped product categories (Manage your created categories)"}
                {activeTab === "brands" && "Certified vendor and retail brands (Manage your created brands)"}
                {activeTab === "attributes" && "Global variant attributes (Manage your created attributes and options)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-[13px] focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03] transition-all font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs"
              />
            </div>

            {activeTab === "categories" && (
              <Link
                to="/vendor/portal/catalog/categories/add"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#fe4a03] hover:bg-[#e03f00] text-white text-xs sm:text-[13px] font-bold shadow-md shadow-[#fe4a03]/20 transition-all shrink-0 cursor-pointer"
              >
                <Plus size={16} />
                <span>Add Category</span>
              </Link>
            )}

            {activeTab === "brands" && (
              <Link
                to="/vendor/portal/catalog/brands/add"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#fe4a03] hover:bg-[#e03f00] text-white text-xs sm:text-[13px] font-bold shadow-md shadow-[#fe4a03]/20 transition-all shrink-0 cursor-pointer"
              >
                <Plus size={16} />
                <span>Add Brand</span>
              </Link>
            )}

            {activeTab === "attributes" && (
              <Link
                to="/vendor/portal/catalog/attributes/add"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#fe4a03] hover:bg-[#e03f00] text-white text-xs sm:text-[13px] font-bold shadow-md shadow-[#fe4a03]/20 transition-all shrink-0 cursor-pointer"
              >
                <Plus size={16} />
                <span>Add Attribute</span>
              </Link>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 overflow-hidden">
          <DataTable
            columns={currentColumns}
            data={paginatedData}
            isLoading={false}
            emptyMessage={`No ${activeTab} found matching your search query.`}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredData.length / itemsPerPage) || 1}
            onPageChange={setCurrentPage}
            totalItems={filteredData.length}
            itemsPerPage={itemsPerPage}
            itemLabel={activeTab}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() =>
            !deleteModal.isDeleting &&
            setDeleteModal({ open: false, type: "", id: null, name: "", isDeleting: false })
          }
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                Delete{" "}
                {deleteModal.type === "categories"
                  ? "Category"
                  : deleteModal.type === "brands"
                  ? "Brand"
                  : "Attribute"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Are you sure you want to delete{" "}
                <span className="font-bold text-slate-900">"{deleteModal.name}"</span>?
              </p>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-start gap-2 text-left">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>Product Dependency Rule:</strong> You can only delete this if no products or
                  variants are currently using it. If any product is assigned to it, deletion will be blocked.
                </span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                disabled={deleteModal.isDeleting}
                onClick={() =>
                  setDeleteModal({ open: false, type: "", id: null, name: "", isDeleting: false })
                }
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={deleteModal.isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleteModal.isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Delete Permanently"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Modal */}
      {inspectModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setInspectModal({ ...inspectModal, open: false })}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">{inspectModal.title}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {inspectModal.entityType}:{" "}
                  <span className="font-bold text-[#fe4a03]">{inspectModal.entityName}</span>
                </p>
              </div>
              <button
                onClick={() => setInspectModal({ ...inspectModal, open: false })}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <p className="text-[11px] text-slate-500 font-semibold uppercase">Ownership</p>
                <p className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">
                  {isOwned(inspectModal.data) ? (
                    <span className="text-emerald-700">Added by You (Your Catalog Item)</span>
                  ) : (
                    <span className="text-slate-600">Master / System Item (Read-only)</span>
                  )}
                </p>
              </div>

              {inspectModal.entityType === "Attribute" && inspectModal.data?.options && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Available Options ({inspectModal.data.options.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {inspectModal.data.options.map((opt) => (
                      <div
                        key={opt._id}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col"
                      >
                        <span className="font-bold text-slate-900 text-xs">
                          {opt.displayName || opt.storedValue}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                          val: {opt.storedValue}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {inspectModal.entityType === "Category" && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <p className="text-[11px] text-slate-500 font-semibold uppercase">Department</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {inspectModal.data?.department?.name || "General"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <p className="text-[11px] text-slate-500 font-semibold uppercase">Slug</p>
                    <p className="font-mono text-slate-700 text-xs mt-0.5">
                      {inspectModal.data?.slug || "N/A"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <p className="text-[11px] text-slate-500 font-semibold uppercase">Status</p>
                    <div className="mt-1">
                      <StatusBadge status={inspectModal.data?.status || "Active"} />
                    </div>
                  </div>
                </div>
              )}

              {inspectModal.entityType === "Department" && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <p className="text-[11px] text-slate-500 font-semibold uppercase">Description</p>
                    <p className="text-slate-800 text-xs mt-0.5">
                      {inspectModal.data?.description || "Marketplace department taxonomy."}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <p className="text-[11px] text-slate-500 font-semibold uppercase">Status</p>
                    <div className="mt-1">
                      <StatusBadge status={inspectModal.data?.status || "Active"} />
                    </div>
                  </div>
                </div>
              )}

              {inspectModal.entityType === "Brand" && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <p className="text-[11px] text-slate-500 font-semibold uppercase">Slug</p>
                    <p className="font-mono text-slate-700 text-xs mt-0.5">
                      {inspectModal.data?.slug || "N/A"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <p className="text-[11px] text-slate-500 font-semibold uppercase">Status</p>
                    <div className="mt-1">
                      <StatusBadge status={inspectModal.data?.status || "Active"} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setInspectModal({ ...inspectModal, open: false })}
                className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorCatalog;
