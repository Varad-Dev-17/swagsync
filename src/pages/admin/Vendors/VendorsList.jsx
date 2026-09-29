import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store,
  Search,
  Eye,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Building,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../api/axiosConfig";

const StatusBadge = ({ status }) => {
  const normStatus = (status || "PENDING").toUpperCase();

  switch (normStatus) {
    case "APPROVED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Approved
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock size={12} className="text-amber-500" />
          Pending
        </span>
      );
    case "SUSPENDED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle size={12} className="text-rose-500" />
          Suspended
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
          <XCircle size={12} className="text-slate-400" />
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          {status}
        </span>
      );
  }
};

const VendorsList = () => {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
  });

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVendors, setTotalVendors] = useState(0);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
      };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get("/admin/vendors", { params });
      if (res.data.success) {
        setVendors(res.data.vendors || []);
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalVendors(res.data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Error fetching vendors:", err);
      toast.error(err.response?.data?.message || "Failed to load vendors list");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Reset page when filters change
  const handleStatusFilterChange = (filter) => {
    setStatusFilter(filter);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#4648d4]/10 text-[#4648d4] flex items-center justify-center font-bold">
              <Store size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Vendors Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Review vendor applications, verify business credentials, and manage seller statuses.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchVendors}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
          title="Refresh List"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin text-[#4648d4]" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => handleStatusFilterChange("all")}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs ${
            statusFilter === "all" ? "border-[#4648d4] ring-2 ring-[#4648d4]/10" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Vendors</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.total}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">All registered vendors</span>
        </div>

        <div
          onClick={() => handleStatusFilterChange("pending")}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs ${
            statusFilter === "pending" ? "border-amber-400 ring-2 ring-amber-400/20" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          </div>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{stats.pending}</span>
          <span className="text-[11px] text-amber-600 mt-0.5 block">Awaiting admin review</span>
        </div>

        <div
          onClick={() => handleStatusFilterChange("approved")}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs ${
            statusFilter === "approved" ? "border-emerald-400 ring-2 ring-emerald-400/20" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Approved</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{stats.approved}</span>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">Active selling portals</span>
        </div>

        <div
          onClick={() => handleStatusFilterChange("suspended")}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs ${
            statusFilter === "suspended" ? "border-rose-400 ring-2 ring-rose-400/20" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">Suspended</span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">{stats.suspended}</span>
          <span className="text-[11px] text-rose-600 mt-0.5 block">Temporarily restricted</span>
        </div>

        <div
          onClick={() => handleStatusFilterChange("rejected")}
          className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer shadow-2xs col-span-2 lg:col-span-1 ${
            statusFilter === "rejected" ? "border-slate-400 ring-2 ring-slate-400/20" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Rejected</span>
          <span className="text-2xl font-black text-slate-700 mt-1 block">{stats.rejected}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Declined applications</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex-1 flex flex-col">
        {/* Controls: Search and Filter Tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
              { id: "suspended", label: "Suspended" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleStatusFilterChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? "bg-[#4648d4] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search vendor, store, email..."
              className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:border-[#4648d4] focus:ring-2 focus:ring-[#4648d4]/10 transition-all outline-hidden text-slate-800"
            />
          </div>
        </div>

        {/* Vendors Table */}
        <div className="overflow-x-auto flex-1 flex flex-col">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Vendor Name</th>
                <th className="py-3.5 px-4">Store Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Registration Date</th>
                <th className="py-3.5 px-4">Status</th>
                {/* Per Requirement 9: Action column contains ONLY View */}
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#4648d4] border-t-transparent rounded-full animate-spin" />
                      <span>Loading vendors...</span>
                    </div>
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="max-w-xs mx-auto text-slate-400">
                      <Store size={44} className="mx-auto text-slate-300 mb-3" />
                      <p className="font-bold text-slate-700 text-sm">No vendors found</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {search
                          ? "No vendor matches your search criteria."
                          : "No vendors registered in this status."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => {
                  const fullName = vendor.vendorProfile?.fullName || vendor.username || "—";
                  const storeName = vendor.vendorProfile?.storeName || "—";
                  const phone = vendor.vendorProfile?.phone || vendor.mobileNo || "—";
                  const email = vendor.email;
                  const regDate = formatDate(vendor.createdAt);
                  const status = vendor.vendorStatus || "PENDING";

                  return (
                    <tr
                      key={vendor._id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/admin/vendors/${vendor._id}`)}
                    >
                      {/* 1. Vendor Name */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-[#4648d4] font-bold flex items-center justify-center shrink-0 text-xs">
                            {fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold block text-slate-900 group-hover:text-[#4648d4] transition-colors">
                              {fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {vendor.vendorId || vendor._id.slice(-6)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Store Name */}
                      <td className="py-3.5 px-4 text-slate-800 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building size={13} className="text-slate-400" />
                          <span>{storeName}</span>
                        </div>
                      </td>

                      {/* 3. Email */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Mail size={13} className="text-slate-400" />
                          <span>{email}</span>
                        </div>
                      </td>

                      {/* 4. Phone */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Phone size={13} className="text-slate-400" />
                          <span>{phone}</span>
                        </div>
                      </td>

                      {/* 5. Registration Date */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{regDate}</span>
                        </div>
                      </td>

                      {/* 6. Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={status} />
                      </td>

                      {/* 7. Action: ONLY View (Per Requirement 9) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/vendors/${vendor._id}`);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#4648d4] bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 mt-auto">
          <div>
            Showing <strong className="text-slate-800">{vendors.length}</strong> of{" "}
            <strong className="text-slate-800">{totalVendors}</strong> vendors
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-slate-700 px-2">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorsList;
