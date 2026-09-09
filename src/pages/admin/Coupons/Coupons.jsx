import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { 
  Ticket, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Check, 
  Clock, 
  Tag, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Copy
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import PageCard from "../../../components/admin/ui/PageCard";
import DataTable from "../../../components/admin/ui/DataTable";
import Pagination from "../../../components/admin/ui/Pagination";
import ConfirmDialog from "../../../components/admin/ui/ConfirmDialog";
import CouponModal from "../../../components/admin/coupons/CouponModal";

const Coupons = () => {
  const { getAuthHeaders } = useAuth();

  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [couponToEdit, setCouponToEdit] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("/admin/coupons", {
        headers: getAuthHeaders(),
        params: {
          page: currentPage,
          limit,
          search: debouncedSearch,
          status: statusFilter !== "all" ? statusFilter : undefined,
          discountType: typeFilter !== "all" ? typeFilter : undefined,
        },
      });

      if (res.data.success) {
        setCoupons(res.data.data.coupons || []);
        setTotalPages(res.data.data.pagination.pages || 1);
        setTotalItems(res.data.data.pagination.total || 0);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load coupons", err);
      toast.error(err.response?.data?.message || "Failed to load coupons");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter, typeFilter, getAuthHeaders]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreateOrUpdate = async (formData) => {
    setIsSaving(true);
    try {
      if (couponToEdit) {
        const res = await axios.put(`/admin/coupons/${couponToEdit._id}`, formData, {
          headers: getAuthHeaders(),
        });
        if (res.data.success) {
          toast.success(res.data.message || "Coupon updated successfully");
          setIsModalOpen(false);
          setCouponToEdit(null);
          fetchCoupons();
        }
      } else {
        const res = await axios.post("/admin/coupons", formData, {
          headers: getAuthHeaders(),
        });
        if (res.data.success) {
          toast.success(res.data.message || "Coupon created successfully");
          setIsModalOpen(false);
          fetchCoupons();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (coupon) => {
    try {
      const res = await axios.patch(
        `/admin/coupons/${coupon._id}/toggle-status`,
        {},
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        fetchCoupons();
      }
    } catch (err) {
      toast.error("Failed to toggle status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!couponToDelete) return;
    setIsDeleting(true);
    try {
      const res = await axios.delete(`/admin/coupons/${couponToDelete._id}`, {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        toast.success("Coupon deleted successfully");
        setIsDeleteDialogOpen(false);
        setCouponToDelete(null);
        fetchCoupons();
      }
    } catch (err) {
      toast.error("Failed to delete coupon");
    } finally {
      setIsDeleting(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    toast.success(`Copied "${code}"`);
  };

  const columns = [
    {
      header: "COUPON CODE",
      align: "left",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm tracking-wider text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
            {row.code}
          </span>
          <button
            onClick={() => copyCode(row.code)}
            className="text-gray-400 hover:text-[#4648d4] p-1 transition-colors"
            title="Copy Code"
          >
            <Copy size={13} />
          </button>
        </div>
      ),
    },
    {
      header: "DISCOUNT",
      align: "center",
      render: (row) => (
        <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs">
          {row.discountType === "percentage"
            ? `${row.discountValue}% OFF`
            : `₹${row.discountValue} FLAT`}
        </span>
      ),
    },
    {
      header: "MIN SPEND",
      align: "center",
      render: (row) => (
        <span className="text-xs font-semibold text-gray-700">
          {row.minimumOrderAmount > 0 ? `₹${row.minimumOrderAmount}` : "None"}
        </span>
      ),
    },
    {
      header: "MAX DISCOUNT",
      align: "center",
      render: (row) => (
        <span className="text-xs text-gray-600">
          {row.maximumDiscount > 0 ? `₹${row.maximumDiscount}` : "No Limit"}
        </span>
      ),
    },
    {
      header: "USAGE",
      align: "center",
      render: (row) => (
        <span className="text-xs text-gray-600">
          <strong className="text-gray-900">{row.usedCount || 0}</strong>
          {row.usageLimit > 0 ? ` / ${row.usageLimit}` : " (Unlimited)"}
        </span>
      ),
    },
    {
      header: "VALID TILL",
      align: "center",
      render: (row) => {
        const isExpired = new Date(row.expiryDate) < new Date();
        return (
          <div className="flex items-center justify-center gap-1.5 text-xs">
            <span
              className={`font-medium ${
                isExpired ? "text-red-500 line-through" : "text-gray-700"
              }`}
            >
              {new Date(row.expiryDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            {isExpired && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-600">
                EXPIRED
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: "STATUS",
      align: "center",
      render: (row) => {
        const isExpired = new Date(row.expiryDate) < new Date();
        return (
          <button
            onClick={() => handleToggleStatus(row)}
            title="Click to toggle status"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              row.status === "active" && !isExpired
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                row.status === "active" && !isExpired ? "bg-emerald-600" : "bg-gray-400"
              }`}
            />
            <span className="capitalize">{row.status}</span>
          </button>
        );
      },
    },
    {
      header: "ACTIONS",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              setCouponToEdit(row);
              setIsModalOpen(true);
            }}
            className="p-1.5 text-gray-500 hover:text-[#4648d4] hover:bg-[#4648d4]/10 rounded-lg transition-colors cursor-pointer"
            title="Edit Coupon"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => {
              setCouponToDelete(row);
              setIsDeleteDialogOpen(true);
            }}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Coupon"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Coupons & Discounts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage promotional discount vouchers and seasonal coupon campaigns.
          </p>
        </div>

        <button
          onClick={() => {
            setCouponToEdit(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4648d4] hover:bg-[#3b3dbf] text-white font-bold text-sm shadow-md shadow-[#4648d4]/20 transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>Add Coupon</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Ticket size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Coupons
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Active Vouchers
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">{stats.active}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Expired Coupons
            </p>
            <h3 className="text-2xl font-bold text-red-500 mt-0.5">{stats.expired}</h3>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <PageCard>
        {/* Search & Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search coupon code or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#4648d4] focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#4648d4] cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#4648d4] cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed (₹)</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={coupons}
          isLoading={isLoading}
          emptyMessage="No coupons found matching your search."
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </PageCard>

      {/* Coupon Modal (Create / Edit) */}
      <CouponModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCouponToEdit(null);
        }}
        onSave={handleCreateOrUpdate}
        couponToEdit={couponToEdit}
        isLoading={isSaving}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setCouponToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Coupon"
        message={`Are you sure you want to delete coupon "${couponToDelete?.code}"? This cannot be undone.`}
        confirmText="Delete Coupon"
        isLoading={isDeleting}
        isDestructive={true}
      />
    </div>
  );
};

export default Coupons;
