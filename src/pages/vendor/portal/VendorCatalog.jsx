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

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const res = await api.get("/vendor/portal/catalog");
      if (res.data.success) {
        setCatalog(res.data.data);
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
      ),
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
      ),
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
        return (
          <div className="flex flex-wrap gap-1.5 max-w-md py-1">
            {opts.slice(0, 5).map((opt) => (
              <span
                key={opt._id}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
              >
                {opt.displayName || opt.storedValue}
              </span>
            ))}
            {opts.length > 5 && (
              <span className="text-[11px] text-[#fe4a03] font-bold self-center">
                +{opts.length - 5} more
              </span>
            )}
          </div>
        );
      },
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
          onClick={() => {
            const opts = optionsByAttrId[row._id?.toString()] || [];
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
      ),
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
      {/* Tab switcher buttons matching Admin Catalog layout */}
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
                {activeTab === "departments" && "Master departments and store availability"}
                {activeTab === "categories" && "Department-mapped product categories"}
                {activeTab === "brands" && "Certified vendor and retail brands"}
                {activeTab === "attributes" && "Global variant attributes and selectable option values"}
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
                  {inspectModal.entityType}: <span className="font-bold text-[#fe4a03]">{inspectModal.entityName}</span>
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
                        <span className="font-bold text-slate-900 text-xs">{opt.displayName || opt.storedValue}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">val: {opt.storedValue}</span>
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
