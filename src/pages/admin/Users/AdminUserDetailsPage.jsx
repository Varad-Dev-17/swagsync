import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, Shield, Ban, UserCheck, Trash2, 
  ShoppingBag, ShoppingCart, RotateCcw, Headphones, Star, MapPin, 
  User, Users, Mail, Phone, Calendar, CheckCircle2, 
  AlertCircle, ChevronRight, ExternalLink, Copy, Check,
  Package, ChevronDown, ChevronLeft, Search, FileText, MoreVertical, Edit2
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../api/axiosConfig";

const UserAvatar = ({ user, initial, size = "md" }) => {
  const [imgError, setImgError] = useState(false);
  const avatarUrl =
    user?.profileImage?.url ||
    (typeof user?.profileImage === "string" ? user.profileImage : null) ||
    user?.avatar;

  const sizeClasses = size === "xl"
    ? "w-20 h-20 text-2xl"
    : size === "lg" 
    ? "w-14 h-14 text-lg" 
    : "w-10 h-10 text-sm";

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={user?.username || "User avatar"}
        onError={() => setImgError(true)}
        className={`${sizeClasses} rounded-full object-cover border-2 border-white shadow-md shrink-0`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div className={`${sizeClasses} rounded-full bg-indigo-50 border border-indigo-200 text-[#4F46E5] font-bold flex items-center justify-center shrink-0 shadow-xs`}>
      {initial}
    </div>
  );
};

// Helper to extract product item image
const getItemImage = (item) => {
  return (
    item?.variant?.mainImage?.url ||
    (typeof item?.variant?.mainImage === "string" ? item?.variant?.mainImage : null) ||
    item?.product?.images?.[0]?.url ||
    (typeof item?.product?.images?.[0] === "string" ? item?.product?.images?.[0] : null) ||
    ""
  );
};

// Helper to extract variant attributes description (e.g. Size: L, Color: Black)
const getItemVariantText = (item) => {
  const parts = [];
  if (item?.variant?.attributes && Array.isArray(item.variant.attributes)) {
    item.variant.attributes.forEach((attr) => {
      const name = attr?.attribute?.name || attr?.name;
      const val = attr?.option?.value || attr?.value;
      if (name && val) parts.push(`${name}: ${val}`);
    });
  }
  if (parts.length === 0) {
    if (item?.variant?.size || item?.size) parts.push(`Size: ${item.variant?.size || item.size}`);
    if (item?.variant?.color || item?.color) parts.push(`Color: ${item.variant?.color || item.color}`);
  }
  parts.push(`Qty: ${item?.quantity || 1}`);
  return parts.join("  ");
};

// Helper to format Order ID like #ORD-68
const formatOrderId = (order) => {
  if (!order) return "";
  if (order.orderId) {
    return order.orderId.startsWith("#") ? order.orderId : `#${order.orderId}`;
  }
  return `#ORD-${order._id.slice(-4).toUpperCase()}`;
};

// Helper for status badge styling
const getStatusBadge = (status) => {
  const s = (status || "pending").toLowerCase();
  if (s === "delivered") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
        Delivered
      </span>
    );
  }
  if (s === "cancelled") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
        Cancelled
      </span>
    );
  }
  if (s === "returned") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
        Returned
      </span>
    );
  }
  if (s === "shipped") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
        Shipped
      </span>
    );
  }
  if (s === "processing" || s === "packed") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
        {s}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-[#4F46E5] border border-indigo-200">
      Pending
    </span>
  );
};

const AdminUserDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("orders");
  const [copiedId, setCopiedId] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  // Filters & State inside Orders tab
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderDateFilter, setOrderDateFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderCurrentPage, setOrderCurrentPage] = useState(1);
  const ordersPerPage = 8;

  const fetchUserDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users/${id}`);
      if (res.data.success) {
        setData(res.data);
        if (res.data.orders && res.data.orders.length > 0) {
          setSelectedOrderId(res.data.orders[0]._id);
        }
      } else {
        toast.error(res.data.message || "Failed to load user details");
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
      toast.error(err.response?.data?.message || "Failed to load user details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const handleToggleStatus = async () => {
    if (!data?.user) return;
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/users/${data.user._id}/toggle-status`);
      if (res.data.success) {
        const isBlocked = res.data.user.isBlocked;
        setData((prev) => ({
          ...prev,
          user: { ...prev.user, isBlocked },
        }));
        toast.success(`User ${isBlocked ? "blocked" : "unblocked"}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle status");
    } finally {
      setActionLoading(false);
      setShowActionsDropdown(false);
    }
  };

  const handleToggleAdmin = async () => {
    if (!data?.user) return;
    const isCurrentlyAdmin = data.user.isAdmin;
    const action = isCurrentlyAdmin ? "remove-admin" : "make-admin";
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/users/${action}/${data.user._id}`);
      if (res.data.success) {
        setData((prev) => ({
          ...prev,
          user: { ...prev.user, isAdmin: !isCurrentlyAdmin },
        }));
        toast.success(isCurrentlyAdmin ? "Admin privileges removed" : "User promoted to Admin");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    } finally {
      setActionLoading(false);
      setShowActionsDropdown(false);
    }
  };

  const handleDelete = async () => {
    if (!data?.user) return;
    if (!window.confirm(`Are you sure you want to delete user "${data.user.username}"? This action cannot be undone.`)) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/admin/users/${data.user._id}`);
      if (res.data.success) {
        toast.success("User deleted successfully");
        navigate("/admin/users");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
      setShowActionsDropdown(false);
    }
  };

  const { user, orders = [], returns = [], tickets = [], reviews = [], addresses = [], stats = {} } = data || {};
  const initial = user?.username?.charAt(0).toUpperCase() || "U";
  const defaultAddress = addresses?.find((a) => a.isDefault) || addresses?.[0];
  const userLocation = defaultAddress 
    ? `${defaultAddress.city || ""}${defaultAddress.state ? `, ${defaultAddress.state}` : ""}`.replace(/^,\s*/, "") 
    : "Dinanagar, Punjab";

  // Filtered orders with search, date filter, status filter
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Status Filter
      if (orderStatusFilter !== "all" && o.status?.toLowerCase() !== orderStatusFilter.toLowerCase()) {
        return false;
      }

      // 2. Date Filter
      if (orderDateFilter !== "all" && o.createdAt) {
        const orderDate = new Date(o.createdAt).getTime();
        const now = Date.now();
        if (orderDateFilter === "7days" && now - orderDate > 7 * 24 * 60 * 60 * 1000) return false;
        if (orderDateFilter === "30days" && now - orderDate > 30 * 24 * 60 * 60 * 1000) return false;
        if (orderDateFilter === "3months" && now - orderDate > 90 * 24 * 60 * 60 * 1000) return false;
        if (orderDateFilter === "1year" && now - orderDate > 365 * 24 * 60 * 60 * 1000) return false;
      }

      // 3. Search Query (order ID, product name)
      if (orderSearchQuery.trim()) {
        const query = orderSearchQuery.toLowerCase().trim();
        const idMatches = (o.orderId || o._id || "").toLowerCase().includes(query);
        const productMatches = (o.items || []).some((item) =>
          (item.product?.name || item.product?.title || "").toLowerCase().includes(query)
        );
        if (!idMatches && !productMatches) return false;
      }

      return true;
    });
  }, [orders, orderStatusFilter, orderDateFilter, orderSearchQuery]);

  // Paginated Orders (8 per page)
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
  const paginatedOrders = useMemo(() => {
    const start = (orderCurrentPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, orderCurrentPage, ordersPerPage]);

  // Selected Order for Preview in Right Column
  const selectedOrder = useMemo(() => {
    if (!orders || orders.length === 0) return null;
    const found = orders.find((o) => o._id === selectedOrderId);
    return found || orders[0];
  }, [orders, selectedOrderId]);

  // Active / Resolved counts for quick cards
  const resolvedReturnsCount = useMemo(() => {
    return returns.filter((r) => ["approved", "completed", "resolved", "refunded"].includes((r.status || "").toLowerCase())).length;
  }, [returns]);

  const resolvedTicketsCount = useMemo(() => {
    return tickets.filter((t) => ["resolved", "closed"].includes((t.status || "").toLowerCase())).length;
  }, [tickets]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-slate-50/50 py-10 px-4 sm:px-8 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm font-bold text-slate-600">Loading user profile & history...</p>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="w-full min-h-screen bg-slate-50/50 py-12 px-4 sm:px-8 flex flex-col items-center justify-center">
        <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">User Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">The requested user could not be found or has been deleted.</p>
        <button
          onClick={() => navigate("/admin/users")}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to User Management
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-6 px-4 sm:px-8 lg:px-10">
      <div className="w-full max-w-[1400px] mx-auto space-y-5">
        
        {/* 1. Breadcrumbs & Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
              <button onClick={() => navigate("/admin/users")} className="hover:text-[#4F46E5] transition-colors cursor-pointer">
                User Management
              </button>
              <ChevronRight size={12} className="text-slate-400" />
              <span className="text-slate-600 font-medium">User Details</span>
              <ChevronRight size={12} className="text-slate-400" />
              <span className="text-slate-400 font-mono text-[11px] truncate max-w-[140px]">{user._id}</span>
            </div>
            <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">User Details</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              View complete information, order history, tickets, returns, and more.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => navigate("/admin/users")}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-[#4F46E5] rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to User Management</span>
            </button>

            {/* Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#4F46E5] hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <span>Actions</span>
                <ChevronDown size={14} />
              </button>

              {showActionsDropdown && (
                <div 
                  className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30"
                  onMouseLeave={() => setShowActionsDropdown(false)}
                >
                  <button
                    onClick={handleToggleStatus}
                    className="w-full text-left px-4 py-2 text-xs font-bold flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {user.isBlocked ? (
                      <>
                        <UserCheck size={14} className="text-emerald-600 stroke-[2.2]" />
                        <span>Unblock User</span>
                      </>
                    ) : (
                      <>
                        <Ban size={14} className="text-amber-600 stroke-[2.2]" />
                        <span>Block User</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleToggleAdmin}
                    className="w-full text-left px-4 py-2 text-xs font-bold flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Shield size={14} className="text-purple-600 stroke-[2.2]" />
                    <span>{user.isAdmin ? "Remove Admin Privileges" : "Promote to Admin"}</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2 text-xs font-bold flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 size={14} className="stroke-[2.2]" />
                    <span>Delete User</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. User Hero Profile & KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-stretch">
          
          {/* Card 1: User Profile Card (4 cols on lg) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center gap-3.5">
            <UserAvatar user={user} initial={initial} size="lg" />
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[15px] font-bold text-slate-900 tracking-tight truncate">
                  {user.username || "Garima Gupta"}
                </h2>
                {user.isBlocked ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Blocked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Active
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-500 font-medium space-y-0.5">
                <div className="flex items-center gap-1.5 text-slate-600 truncate">
                  <Mail size={11} className="text-slate-400 shrink-0" />
                  <span className="truncate">{user.email || "garima.gupta@cybaemtech.com"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Phone size={11} className="text-slate-400 shrink-0" />
                  <span>{user.mobileNo || "+91 98765 43210"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-0.5 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={10} className="text-slate-400" />
                    Joined on {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "23 Sept 2026"}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={10} className="text-slate-400" />
                    {userLocation}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5 KPI Stat & Status Cards (8 cols on lg: 5 equal mini stat cards) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            
            {/* Total Orders */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-slate-500 leading-tight">Total Orders</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#3B82F6] flex items-center justify-center shrink-0">
                  <ShoppingCart size={13} />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-[15px] sm:text-base font-bold text-slate-900 tracking-tight leading-snug">
                  {stats.totalOrders ?? orders.length}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">All time placed</div>
              </div>
            </div>

            {/* Total Spent */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-slate-500 leading-tight">Total Spent</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShoppingBag size={13} />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-[14px] sm:text-[15px] font-bold text-slate-900 tracking-tight leading-snug truncate" title={`₹${(stats.totalSpent || orders.reduce((sum, o) => o.status !== "cancelled" ? sum + (o.totalAmount || 0) : sum, 0)).toLocaleString("en-IN")}`}>
                  ₹{(stats.totalSpent || orders.reduce((sum, o) => o.status !== "cancelled" ? sum + (o.totalAmount || 0) : sum, 0)).toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">Valid orders</div>
              </div>
            </div>

            {/* Total Returns */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-slate-500 leading-tight">Total Returns</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <RotateCcw size={13} />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-[15px] sm:text-base font-bold text-slate-900 tracking-tight leading-snug">
                  {stats.totalReturns ?? returns.length}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">Requested cases</div>
              </div>
            </div>

            {/* Support Tickets */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-slate-500 leading-tight">Support Tickets</span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Headphones size={13} />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-[15px] sm:text-base font-bold text-slate-900 tracking-tight leading-snug">
                  {stats.totalTickets ?? tickets.length}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">Support requests</div>
              </div>
            </div>

            {/* User Type */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-slate-500 leading-tight">User Type</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#4F46E5] flex items-center justify-center shrink-0">
                  <Users size={13} />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-[14px] sm:text-[15px] font-bold text-slate-900 tracking-tight leading-snug">
                  {user.isAdmin ? "Administrator" : "Customer"}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  {user.isAdmin ? "System manager" : "Registered user"}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* 3. Tab Navigation Bar (Matching Image 3) */}
        <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar pt-1">
          {[
            { id: "overview", label: "Overview", icon: User },
            { id: "orders", label: `Orders (${orders.length})`, icon: ShoppingCart },
            { id: "returns", label: `Returns & Refunds (${returns.length})`, icon: RotateCcw },
            { id: "tickets", label: `Support Tickets (${tickets.length})`, icon: Headphones },
            { id: "reviews", label: `Reviews (${reviews.length})`, icon: Star },
            { id: "addresses", label: `Saved Addresses (${addresses.length})`, icon: MapPin },
            { id: "account", label: "Account Info", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "border-[#4F46E5] text-[#4F46E5]"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon size={15} className={isActive ? "text-[#4F46E5]" : "text-slate-400"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 4. Tab Contents */}
        <div className="space-y-6">

          {/* ===================== TAB: ORDERS (IMAGE 3 EXACT LAYOUT) ===================== */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              
              {/* 2-Column Grid: Left (Order History Table) + Right (Selected Order & Shipping Address) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* Left Column: Order History Table (~68% on large screens) */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  
                  {/* Top Header & Filters Bar */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#4F46E5] flex items-center justify-center">
                        <ShoppingCart size={15} />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">Order History</h3>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {orders.length} total
                      </span>
                    </div>

                    {/* Filters: Search, Date Filter, Status Filter */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Search Input */}
                      <div className="relative min-w-[200px] sm:min-w-[220px]">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={orderSearchQuery}
                          onChange={(e) => {
                            setOrderSearchQuery(e.target.value);
                            setOrderCurrentPage(1);
                          }}
                          placeholder="Search by Order ID, product..."
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-[#4F46E5] transition-colors"
                        />
                      </div>

                      {/* Date Filter */}
                      <select
                        value={orderDateFilter}
                        onChange={(e) => {
                          setOrderDateFilter(e.target.value);
                          setOrderCurrentPage(1);
                        }}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-[#4F46E5] cursor-pointer"
                      >
                        <option value="all">All Dates</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="1year">Last 1 Year</option>
                      </select>

                      {/* Status Filter */}
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => {
                          setOrderStatusFilter(e.target.value);
                          setOrderCurrentPage(1);
                        }}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-[#4F46E5] cursor-pointer"
                      >
                        <option value="all">All Statuses</option>
                        <option value="delivered">Delivered</option>
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                        <option value="processing">Processing</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="returned">Returned</option>
                      </select>
                    </div>
                  </div>

                  {/* Orders Table */}
                  {filteredOrders.length === 0 ? (
                    <div className="py-14 text-center">
                      <ShoppingBag size={36} className="mx-auto text-slate-300 mb-2.5" />
                      <p className="text-sm font-bold text-slate-700">No orders found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {orders.length === 0 ? "This user has not placed any orders yet." : "No orders matching selected search or filters."}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3 text-center w-10">#</th>
                            <th className="px-4 py-3 text-left">Order ID</th>
                            <th className="px-4 py-3 text-left">Date</th>
                            <th className="px-4 py-3 text-left">Products</th>
                            <th className="px-4 py-3 text-right">Total</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center w-24">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {paginatedOrders.map((order, idx) => {
                            const actualIdx = (orderCurrentPage - 1) * ordersPerPage + idx + 1;
                            const isSelected = selectedOrder?._id === order._id;
                            const dateStr = order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                              : "—";

                            return (
                              <tr 
                                key={order._id}
                                onClick={() => setSelectedOrderId(order._id)}
                                className={`transition-colors cursor-pointer ${
                                  isSelected 
                                    ? "bg-indigo-50/40 border-l-3 border-l-[#4F46E5]" 
                                    : "hover:bg-slate-50/60"
                                }`}
                              >
                                {/* # */}
                                <td className="px-4 py-3.5 text-center font-bold text-slate-400">
                                  {actualIdx}
                                </td>

                                {/* Order ID */}
                                <td className="px-4 py-3.5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/admin/orders/${order._id || order.orderId}`);
                                    }}
                                    className="font-mono font-bold text-[#4F46E5] hover:underline cursor-pointer text-left"
                                    title="Go to full order details"
                                  >
                                    {formatOrderId(order)}
                                  </button>
                                </td>

                                {/* Date */}
                                <td className="px-4 py-3.5 text-slate-600 font-medium whitespace-nowrap">
                                  {dateStr}
                                </td>

                                {/* Products Thumbnail Stack (Image 3) */}
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {(order.items || []).slice(0, 3).map((item, itemIdx) => {
                                      const img = getItemImage(item);
                                      return img ? (
                                        <img
                                          key={itemIdx}
                                          src={img}
                                          alt="Product"
                                          className="w-7 h-7 rounded-md object-cover border border-slate-200 bg-white shadow-2xs shrink-0"
                                          title={item.product?.name || "Product"}
                                        />
                                      ) : (
                                        <div
                                          key={itemIdx}
                                          className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0"
                                        >
                                          Pkg
                                        </div>
                                      );
                                    })}
                                    {(order.items?.length || 0) > 3 && (
                                      <span className="text-[10px] font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                                        +{(order.items.length - 3)}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Total Amount */}
                                <td className="px-4 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                                  ₹{(order.totalAmount || 0).toLocaleString("en-IN")}
                                </td>

                                {/* Status */}
                                <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                  {getStatusBadge(order.status)}
                                </td>

                                {/* Actions (View button) */}
                                <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedOrderId(order._id);
                                    }}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer ${
                                      isSelected
                                        ? "bg-[#4F46E5] text-white"
                                        : "bg-indigo-50/70 text-[#4F46E5] hover:bg-indigo-100 border border-indigo-200/50"
                                    }`}
                                  >
                                    <span>👁 View</span>
                                  </button>
                                </td>

                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination Footer (Matching Image 3) */}
                  <div className="p-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 font-medium">
                    <div>
                      Showing {filteredOrders.length > 0 ? (orderCurrentPage - 1) * ordersPerPage + 1 : 0} to{" "}
                      {Math.min(orderCurrentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center gap-1 self-center sm:self-auto">
                        <button
                          disabled={orderCurrentPage <= 1}
                          onClick={() => setOrderCurrentPage((p) => Math.max(1, p - 1))}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ChevronLeft size={14} />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setOrderCurrentPage(page)}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              page === orderCurrentPage
                                ? "bg-[#4F46E5] text-white"
                                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          disabled={orderCurrentPage >= totalPages}
                          onClick={() => setOrderCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Column: Selected Order Card & Shipping Address (~32% on large screens) */}
                <div className="lg:col-span-4 space-y-4">
                  
                  {/* Card 1: Latest / Selected Order Preview (Matching Image 3) */}
                  {selectedOrder ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-4">
                      
                      {/* Top Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#3B82F6] flex items-center justify-center">
                            <ShoppingCart size={14} />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {selectedOrder === orders[0] ? "Latest Order" : "Selected Order"}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const targetId = selectedOrder?._id || selectedOrder?.orderId;
                            if (targetId) navigate(`/admin/orders/${targetId}`);
                          }}
                          className="font-mono text-xs font-bold text-[#4F46E5] hover:underline cursor-pointer"
                          title="Go to full order details"
                        >
                          {formatOrderId(selectedOrder)}
                        </button>
                      </div>

                      {/* Sub-header: Status & Timestamp */}
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <div>{getStatusBadge(selectedOrder.status)}</div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {selectedOrder.createdAt
                            ? new Date(selectedOrder.createdAt).toLocaleString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "5 Oct 2026, 10:24 AM"}
                        </div>
                      </div>

                      {/* Ordered Products Items List */}
                      <div className="border-t border-slate-100 pt-3 space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                        {(selectedOrder.items || []).map((item, iIdx) => {
                          const img = getItemImage(item);
                          const title = item.product?.name || item.product?.title || "Product";
                          const variantText = getItemVariantText(item);
                          const itemPrice = item.sellingPrice || item.price || item.mrp || 0;

                          return (
                            <div key={iIdx} className="flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {img ? (
                                  <img
                                    src={img}
                                    alt={title}
                                    className="w-11 h-11 rounded-lg object-cover border border-slate-200 bg-white shrink-0"
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                    <ShoppingBag size={18} />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <h4 className="font-bold text-slate-900 text-xs truncate max-w-[170px]" title={title}>
                                    {title}
                                  </h4>
                                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                    {variantText}
                                  </p>
                                </div>
                              </div>
                              <span className="font-bold text-slate-900 shrink-0">
                                ₹{(itemPrice * (item.quantity || 1)).toLocaleString("en-IN")}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Financial Breakdown */}
                      <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-500 font-medium">
                        <div className="flex items-center justify-between">
                          <span>Subtotal</span>
                          <span className="text-slate-800 font-semibold">
                            ₹{(selectedOrder.subtotal || selectedOrder.totalMRP || selectedOrder.totalAmount || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Shipping Charge</span>
                          <span className="text-slate-800 font-semibold">
                            {selectedOrder.shippingAmount > 0 ? `₹${selectedOrder.shippingAmount}` : "₹0"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Discount</span>
                          <span className="text-emerald-600 font-semibold">
                            - ₹{(selectedOrder.discountAmount || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-sm font-bold text-slate-900">
                          <span>Total Paid</span>
                          <span>
                            ₹{(selectedOrder.totalAmount || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* View Full Order Details Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const targetId = selectedOrder?._id || selectedOrder?.orderId;
                          if (targetId) {
                            navigate(`/admin/orders/${targetId}`);
                          } else {
                            toast.error("Order details not found");
                          }
                        }}
                        className="w-full py-2.5 px-3 bg-indigo-50/70 hover:bg-indigo-100 text-[#4F46E5] border border-indigo-200/80 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                      >
                        <FileText size={14} />
                        <span>View Full Order Details</span>
                      </button>

                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                      <ShoppingBag size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-semibold text-slate-600">No Order Selected</p>
                    </div>
                  )}

                  {/* Card 2: Shipping Address (Matching Image 3) */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                        <MapPin size={15} className="text-[#4F46E5]" />
                        <span>Shipping Address</span>
                      </div>
                      <button 
                        onClick={() => setActiveTab("addresses")}
                        className="text-[#4F46E5] hover:underline text-xs font-bold cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 pt-1 font-medium leading-relaxed">
                      <div className="font-bold text-slate-900 text-sm">
                        {selectedOrder?.shippingAddress?.name || defaultAddress?.fullName || user.username || "Garima Gupta"}
                      </div>
                      <p>
                        {selectedOrder?.shippingAddress?.address || defaultAddress?.addressLine1 || "123, Main Street, Dinanagar"}
                      </p>
                      <p>
                        {selectedOrder?.shippingAddress?.city || defaultAddress?.city || "Gurdaspur"}, {" "}
                        {selectedOrder?.shippingAddress?.state || defaultAddress?.state || "Punjab"}{" "}
                        {selectedOrder?.shippingAddress?.pincode || defaultAddress?.pincode || "143531"}, {" "}
                        {selectedOrder?.shippingAddress?.country || defaultAddress?.country || "India"}
                      </p>
                      <p className="text-slate-700 font-semibold pt-1">
                        {selectedOrder?.shippingAddress?.phone || defaultAddress?.phone || user.mobileNo || "+91 98765 43210"}
                      </p>
                    </div>
                  </div>

                </div>

              </div>

              {/* Bottom Quick Access Cards (Matching Image 3) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                
                {/* 1. Returns & Refunds */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex flex-col justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <RotateCcw size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Returns & Refunds</h4>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{returns.length} Requests</p>
                      <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {resolvedReturnsCount} Resolved
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 mt-1 border-t border-slate-100">
                    <button
                      onClick={() => setActiveTab("returns")}
                      className="text-xs font-bold text-[#4F46E5] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

                {/* 2. Support Tickets */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex flex-col justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Headphones size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Support Tickets</h4>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{tickets.length} {tickets.length === 1 ? "Ticket" : "Tickets"}</p>
                      <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {resolvedTicketsCount} Resolved
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 mt-1 border-t border-slate-100">
                    <button
                      onClick={() => setActiveTab("tickets")}
                      className="text-xs font-bold text-[#4F46E5] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

                {/* 3. Reviews */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex flex-col justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                      <Star size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Reviews</h4>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{reviews.length} Reviews</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">Customer feedback</p>
                    </div>
                  </div>
                  <div className="pt-3 mt-1 border-t border-slate-100">
                    <button
                      onClick={() => setActiveTab("reviews")}
                      className="text-xs font-bold text-[#4F46E5] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

                {/* 4. Saved Addresses */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex flex-col justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Saved Addresses</h4>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{addresses.length} Addresses</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">Shipping locations</p>
                    </div>
                  </div>
                  <div className="pt-3 mt-1 border-t border-slate-100">
                    <button
                      onClick={() => setActiveTab("addresses")}
                      className="text-xs font-bold text-[#4F46E5] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ===================== TAB: OVERVIEW ===================== */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingCart size={16} className="text-[#4F46E5]" />
                    <span>Latest Order</span>
                  </h3>
                  {orders.length > 0 && (
                    <button 
                      onClick={() => setActiveTab("orders")} 
                      className="text-xs font-bold text-[#4F46E5] hover:underline cursor-pointer"
                    >
                      View All ({orders.length})
                    </button>
                  )}
                </div>

                {orders.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <Package size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No orders placed yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#4F46E5]">{formatOrderId(orders[0])}</span>
                      {getStatusBadge(orders[0].status)}
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p>Date: {new Date(orders[0].createdAt).toLocaleDateString("en-GB")}</p>
                      <p>Items: {orders[0].items?.length || 0} product(s)</p>
                      <p className="text-sm font-bold text-slate-900 pt-1">
                        Total: ₹{(orders[0].totalAmount || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Returns Overview */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <RotateCcw size={16} className="text-amber-600" />
                    <span>Recent Returns</span>
                  </h3>
                  {returns.length > 0 && (
                    <button 
                      onClick={() => setActiveTab("returns")} 
                      className="text-xs font-bold text-[#4F46E5] hover:underline cursor-pointer"
                    >
                      View All ({returns.length})
                    </button>
                  )}
                </div>

                {returns.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <RotateCcw size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No return requests</p>
                  </div>
                ) : (
                  <div className="text-xs space-y-2">
                    <p className="font-bold text-slate-900">{returns[0].product?.name || "Product"}</p>
                    <p className="text-slate-500">Reason: {returns[0].reason || "Not specified"}</p>
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700">
                      {returns[0].status || "pending"}
                    </span>
                  </div>
                )}
              </div>

              {/* Default Address */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin size={16} className="text-blue-600" />
                    <span>Default Address</span>
                  </h3>
                  {addresses.length > 0 && (
                    <button 
                      onClick={() => setActiveTab("addresses")} 
                      className="text-xs font-bold text-[#4F46E5] hover:underline cursor-pointer"
                    >
                      Addresses ({addresses.length})
                    </button>
                  )}
                </div>

                {!defaultAddress ? (
                  <div className="py-8 text-center text-slate-400">
                    <MapPin size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No addresses saved</p>
                  </div>
                ) : (
                  <div className="text-xs space-y-1.5 text-slate-600 font-medium">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{defaultAddress.fullName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                        {defaultAddress.label || "Home"}
                      </span>
                    </div>
                    <p>{defaultAddress.addressLine1}</p>
                    {defaultAddress.addressLine2 && <p>{defaultAddress.addressLine2}</p>}
                    <p>{defaultAddress.city}, {defaultAddress.state} - {defaultAddress.pincode}</p>
                    <p className="text-slate-700 font-semibold pt-1">Phone: {defaultAddress.phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================== TAB: RETURNS & REFUNDS ===================== */}
          {activeTab === "returns" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Returns & Exchanges History</h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {returns.length} requests
                </span>
              </div>

              {returns.length === 0 ? (
                <div className="py-14 text-center">
                  <RotateCcw size={36} className="mx-auto text-slate-300 mb-2.5" />
                  <p className="text-sm font-bold text-slate-700">No return cases found</p>
                  <p className="text-xs text-slate-400 mt-0.5">This user has never filed a return or exchange request.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3 text-center w-12">#</th>
                        <th className="px-5 py-3 text-left">Request Type</th>
                        <th className="px-5 py-3 text-left">Product</th>
                        <th className="px-5 py-3 text-left">Reason</th>
                        <th className="px-5 py-3 text-left">Date</th>
                        <th className="px-5 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {returns.map((ret, idx) => {
                        const img = ret.product?.images?.[0]?.url || ret.product?.images?.[0] || "";
                        return (
                          <tr key={ret._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-5 py-3.5 font-bold uppercase tracking-wider text-slate-800">
                              {ret.type || "Return"}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                {img && (
                                  <img src={img} alt="Product" className="w-8 h-8 rounded-md object-cover border border-slate-200" />
                                )}
                                <span className="font-bold text-slate-900">{ret.product?.name || "Product"}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-slate-600">{ret.reason || "—"}</td>
                            <td className="px-5 py-3.5 text-slate-600">
                              {ret.createdAt ? new Date(ret.createdAt).toLocaleDateString("en-GB") : "—"}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                {ret.status || "pending"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB: SUPPORT TICKETS ===================== */}
          {activeTab === "tickets" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Support Tickets</h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {tickets.length} tickets
                </span>
              </div>

              {tickets.length === 0 ? (
                <div className="py-14 text-center">
                  <Headphones size={36} className="mx-auto text-slate-300 mb-2.5" />
                  <p className="text-sm font-bold text-slate-700">No support tickets</p>
                  <p className="text-xs text-slate-400 mt-0.5">This customer has never submitted a support ticket.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {tickets.map((t) => (
                    <div key={t._id} className="p-4.5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#4F46E5]">#{t.ticketId || t._id.slice(-6)}</span>
                          <span className="font-bold text-slate-900 text-sm">{t.subject || "No Subject"}</span>
                        </div>
                        <p className="text-slate-500 font-medium mt-1">
                          Category: <span className="text-slate-700 font-bold">{t.category || "General"}</span> • Created: {new Date(t.createdAt).toLocaleDateString("en-GB")}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                          t.status === "resolved" || t.status === "closed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-indigo-50 text-[#4F46E5] border-indigo-200"
                        }`}>
                          {t.status || "open"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB: REVIEWS ===================== */}
          {activeTab === "reviews" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Product Reviews</h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {reviews.length} reviews
                </span>
              </div>

              {reviews.length === 0 ? (
                <div className="py-14 text-center">
                  <Star size={36} className="mx-auto text-slate-300 mb-2.5" />
                  <p className="text-sm font-bold text-slate-700">No product reviews</p>
                  <p className="text-xs text-slate-400 mt-0.5">This customer has not reviewed any products yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {reviews.map((rev) => (
                    <div key={rev._id} className="p-4.5 hover:bg-slate-50/60 transition-colors text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">
                          {rev.product?.name || "Product"}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          <span>{rev.rating || 5} / 5</span>
                        </div>
                      </div>
                      <p className="text-slate-600 font-medium">{rev.review || rev.comment || "No comment provided."}</p>
                      <span className="text-[11px] text-slate-400 block">
                        Reviewed on {new Date(rev.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB: SAVED ADDRESSES ===================== */}
          {activeTab === "addresses" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Saved Delivery Addresses</h3>
                <span className="text-xs font-bold text-slate-500">{addresses.length} saved</span>
              </div>

              {addresses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
                  <MapPin size={36} className="mx-auto text-slate-300 mb-2.5" />
                  <p className="text-sm font-bold text-slate-700">No saved addresses</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr._id} className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-2xs text-xs space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{addr.fullName}</span>
                        <div className="flex items-center gap-1.5">
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-[#4F46E5] border border-indigo-200">
                              Default
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                            {addr.label || "Home"}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-600 font-medium pt-1">
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                        {addr.landmark ? ` (Landmark: ${addr.landmark})` : ""}
                      </p>
                      <p className="text-slate-600 font-medium">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-slate-700 font-bold pt-1.5 border-t border-slate-100 flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400" />
                        <span>{addr.phone}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB: ACCOUNT INFO ===================== */}
          {activeTab === "account" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Account Information & Security</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Detailed database record information and account settings
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Username</span>
                  <span className="font-bold text-slate-900 text-sm mt-1 block">{user.username}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                  <span className="font-bold text-slate-900 text-sm mt-1 block truncate">{user.email}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email Verification</span>
                  <div className="mt-1">
                    {user.verified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={11} /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Unverified
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Mobile Number</span>
                  <span className="font-bold text-slate-900 mt-1 block">{user.mobileNo || "Not provided"}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Registration Date</span>
                  <span className="font-bold text-slate-900 mt-1 block">
                    {user.createdAt ? new Date(user.createdAt).toLocaleString("en-GB") : "—"}
                  </span>
                </div>

                {/* <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Database Record ID</span>
                  <span className="font-mono text-xs text-slate-800 font-bold block mt-1 truncate">{user._id}</span>
                </div> */}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default AdminUserDetailsPage;
