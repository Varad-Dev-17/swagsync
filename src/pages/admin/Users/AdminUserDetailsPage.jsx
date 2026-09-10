import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, Shield, Ban, UserCheck, Trash2, 
  ShoppingBag, RotateCcw, Headphones, Star, MapPin, 
  User, Mail, Phone, Calendar, CheckCircle2, 
  AlertCircle, ChevronRight, ExternalLink, Copy, Check,
  Package, ChevronDown
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

const AdminUserDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedId, setCopiedId] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  // Filters inside Orders tab
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  const fetchUserDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users/${id}`);
      if (res.data.success) {
        setData(res.data);
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
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-2xs"
        >
          <ArrowLeft size={14} /> Back to Users
        </button>
      </div>
    );
  }

  const { user, orders = [], returns = [], tickets = [], reviews = [], addresses = [], stats = {} } = data;
  const initial = user.username?.charAt(0).toUpperCase() || "U";
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
  const userLocation = defaultAddress 
    ? `${defaultAddress.city || ""}${defaultAddress.state ? `, ${defaultAddress.state}` : ""}`.replace(/^,\s*/, "") 
    : "Location not provided";

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === "all") return true;
    return o.status?.toLowerCase() === orderStatusFilter.toLowerCase();
  });

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-6 px-4 sm:px-8 lg:px-12">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        
        {/* 1. Breadcrumbs & Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <button onClick={() => navigate("/admin/users")} className="hover:text-[#4F46E5] transition-colors cursor-pointer">
                Users
              </button>
              <ChevronRight size={12} className="text-slate-400" />
              <span className="text-slate-700 font-bold">User Details</span>
              <ChevronRight size={12} className="text-slate-400" />
              <span className="text-slate-400 font-mono text-[11px] truncate max-w-[120px]">{user._id}</span>
            </div>
            <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">User Details</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              View complete information, order history, tickets, returns, and more.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={() => navigate("/admin/users")}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-[#4F46E5] rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Users</span>
            </button>

            {/* Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#4F46E5] hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <span>Actions</span>
                <ChevronDown size={14} />
              </button>

              {showActionsDropdown && (
                <div 
                  className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-scaleIn"
                  onMouseLeave={() => setShowActionsDropdown(false)}
                >
                  {/* Block / Unblock */}
                  <button
                    onClick={handleToggleStatus}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 cursor-pointer"
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

                  {/* Make Admin / Remove Admin */}
                  <button
                    onClick={handleToggleAdmin}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2.5 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Shield size={14} className="text-purple-600 stroke-[2.2]" />
                    <span>{user.isAdmin ? "Remove Admin Privileges" : "Promote to Admin"}</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  {/* Delete User */}
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 size={14} className="stroke-[2.2]" />
                    <span>Delete User</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. User Hero Profile Card & Live KPI Stats */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Left: User Identity */}
            <div className="flex items-start sm:items-center gap-4.5">
              <UserAvatar user={user} initial={initial} size="xl" />
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {user.username || "Anonymous"}
                  </h2>

                  {/* Status Badge */}
                  {user.isBlocked ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                      <Ban size={11} className="stroke-[2.5]" /> Blocked
                    </span>
                  ) : user.verified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      <CheckCircle2 size={11} className="stroke-[2.5]" /> Active / Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                      Pending
                    </span>
                  )}

                  {/* Role Badge */}
                  {user.isAdmin && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
                      <Shield size={11} /> Administrator
                    </span>
                  )}
                </div>

                {/* Sub-meta: email, phone, location, joined */}
                <div className="flex items-center gap-y-1.5 gap-x-4 flex-wrap mt-2 text-xs font-medium text-slate-500">
                  <div className="inline-flex items-center gap-1.5 text-slate-700">
                    <Mail size={13} className="text-slate-400" />
                    <span>{user.email}</span>
                  </div>
                  {user.mobileNo && (
                    <div className="inline-flex items-center gap-1.5 text-slate-700">
                      <Phone size={13} className="text-slate-400" />
                      <span>{user.mobileNo}</span>
                    </div>
                  )}
                  <div className="inline-flex items-center gap-1.5 text-slate-700">
                    <Calendar size={13} className="text-slate-400" />
                    <span>
                      Joined on {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-slate-700">
                    <MapPin size={13} className="text-slate-400" />
                    <span>{userLocation}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live KPI Stat Cards (100% Real Database Metrics) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-3.5 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 shrink-0">
              
              {/* Total Orders */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 min-w-[110px]">
                <div className="flex items-center gap-1.5 text-[#4F46E5] text-xs font-bold uppercase tracking-wider">
                  <ShoppingBag size={14} />
                  <span>Orders</span>
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {stats.totalOrders ?? orders.length}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">All time placed</div>
              </div>

              {/* Total Spent */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 min-w-[120px]">
                <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase tracking-wider">
                  <span>₹ Spent</span>
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  ₹{(stats.totalSpent || 0).toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Valid orders</div>
              </div>

              {/* Returns & Exchanges */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 min-w-[110px]">
                <div className="flex items-center gap-1.5 text-amber-600 text-xs font-bold uppercase tracking-wider">
                  <RotateCcw size={14} />
                  <span>Returns</span>
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {stats.totalReturns ?? returns.length}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Requested cases</div>
              </div>

              {/* Support Tickets */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 min-w-[110px]">
                <div className="flex items-center gap-1.5 text-purple-600 text-xs font-bold uppercase tracking-wider">
                  <Headphones size={14} />
                  <span>Tickets</span>
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {stats.totalTickets ?? tickets.length}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Support requests</div>
              </div>

            </div>

          </div>
        </div>

        {/* 3. Tabbed Navigation Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar pt-1">
          {[
            { id: "overview", label: "Overview", icon: User },
            { id: "orders", label: `Orders (${orders.length})`, icon: ShoppingBag },
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
                className={`inline-flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "border-[#4F46E5] text-[#4F46E5] bg-indigo-50/30"
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
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recent Order Preview */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingBag size={16} className="text-[#4F46E5]" />
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
                    <p className="text-[11px] text-slate-400 mt-0.5">This customer has not placed any orders.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#4F46E5]">#{orders[0].orderId || orders[0]._id}</span>
                      <span className="font-semibold text-slate-500">
                        {new Date(orders[0].createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-slate-50">
                      <span className="text-slate-600 font-medium">{orders[0].items?.length || 0} item(s)</span>
                      <span className="font-bold text-slate-900">₹{(orders[0].totalAmount || 0).toLocaleString("en-IN")}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-[#4F46E5] border border-indigo-200">
                        {orders[0].status || "pending"}
                      </span>
                      <Link
                        to={`/admin/orders/${orders[0]._id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#4F46E5] hover:underline"
                      >
                        <span>Inspect Order</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Return Case */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <RotateCcw size={16} className="text-amber-600" />
                    <span>Latest Return Request</span>
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
                    <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No return requests</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">This user has never submitted a return or refund.</p>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 uppercase tracking-wider">{returns[0].type || "Return"}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                        {returns[0].status || "pending"}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium line-clamp-2">
                      <span className="font-bold text-slate-700">Reason:</span> {returns[0].reason || "Not specified"}
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">
                        {new Date(returns[0].createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <Link
                        to={`/admin/returns/${returns[0]._id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#4F46E5] hover:underline"
                      >
                        <span>Case Details</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Default Address & Contact */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin size={16} className="text-rose-600" />
                    <span>Primary Shipping Address</span>
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
                    <p className="text-[11px] text-slate-400 mt-0.5">The user has not added any delivery address yet.</p>
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

          {/* TAB 2: ORDERS */}
          {activeTab === "orders" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              
              {/* Orders Toolbar */}
              <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Order History</h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {orders.length} total
                  </span>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2">
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-[#4F46E5] cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="delivered">Delivered</option>
                    <option value="shipped">Shipped</option>
                    <option value="processing">Processing</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="py-14 text-center">
                  <ShoppingBag size={36} className="mx-auto text-slate-300 mb-2.5" />
                  <p className="text-sm font-bold text-slate-700">No orders found</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {orders.length === 0 ? "This user has not placed any orders yet." : "No orders matching selected status."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3 text-center w-12">#</th>
                        <th className="px-5 py-3 text-left">Order ID</th>
                        <th className="px-5 py-3 text-left">Date</th>
                        <th className="px-5 py-3 text-left">Products</th>
                        <th className="px-5 py-3 text-right">Total</th>
                        <th className="px-5 py-3 text-center">Status</th>
                        <th className="px-5 py-3 text-center w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredOrders.map((order, idx) => {
                        const dateStr = order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                          : "—";

                        return (
                          <tr key={order._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-5 py-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                            
                            <td className="px-5 py-3.5">
                              <span className="font-mono font-bold text-[#4F46E5]">
                                #{order.orderId || order._id.slice(-8)}
                              </span>
                            </td>

                            <td className="px-5 py-3.5 text-slate-600 font-medium">
                              {dateStr}
                            </td>

                            {/* Products preview */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {(order.items || []).slice(0, 3).map((item, itemIdx) => {
                                  const img = item.product?.images?.[0]?.url || item.product?.images?.[0] || "";
                                  return img ? (
                                    <img
                                      key={itemIdx}
                                      src={img}
                                      alt="Product"
                                      className="w-8 h-8 rounded-md object-cover border border-slate-200 shadow-2xs"
                                      title={item.product?.name || "Product"}
                                    />
                                  ) : (
                                    <div
                                      key={itemIdx}
                                      className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500"
                                    >
                                      Pkg
                                    </div>
                                  );
                                })}
                                {(order.items?.length || 0) > 3 && (
                                  <span className="text-[11px] font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">
                                    +{(order.items.length - 3)}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                              ₹{(order.totalAmount || 0).toLocaleString("en-IN")}
                            </td>

                            <td className="px-5 py-3.5 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                                order.status === "delivered"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : order.status === "cancelled"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-indigo-50 text-[#4F46E5] border-indigo-200"
                              }`}>
                                {order.status || "pending"}
                              </span>
                            </td>

                            <td className="px-5 py-3.5 text-center">
                              <Link
                                to={`/admin/orders/${order._id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-[#4F46E5] hover:border-indigo-200 transition-colors shadow-2xs"
                              >
                                <span>Inspect</span>
                                <ExternalLink size={12} />
                              </Link>
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

          {/* TAB 3: RETURNS & REFUNDS */}
          {activeTab === "returns" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
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
                        <th className="px-5 py-3 text-center w-28">Actions</th>
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
                                {img ? (
                                  <img src={img} alt="Product" className="w-8 h-8 rounded-md object-cover border border-slate-200 shadow-2xs" />
                                ) : (
                                  <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">Item</div>
                                )}
                                <span className="font-semibold text-slate-800 truncate max-w-[180px] block">
                                  {ret.product?.name || "Product"}
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-3.5 text-slate-600 font-medium">
                              {ret.reason || "Not specified"}
                            </td>

                            <td className="px-5 py-3.5 text-slate-500">
                              {ret.createdAt ? new Date(ret.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                            </td>

                            <td className="px-5 py-3.5 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                {ret.status || "pending"}
                              </span>
                            </td>

                            <td className="px-5 py-3.5 text-center">
                              <Link
                                to={`/admin/returns/${ret._id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-[#4F46E5] hover:border-indigo-200 transition-colors shadow-2xs"
                              >
                                <span>Inspect</span>
                                <ExternalLink size={12} />
                              </Link>
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

          {/* TAB 4: SUPPORT TICKETS */}
          {activeTab === "tickets" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
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
                          Category: <span className="text-slate-700 font-bold">{t.category || "General"}</span> • Created: {new Date(t.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
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
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                          t.priority === "high" || t.priority === "urgent"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {t.priority || "normal"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: REVIEWS */}
          {activeTab === "reviews" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
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
                        Reviewed on {new Date(rev.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SAVED ADDRESSES */}
          {activeTab === "addresses" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Saved Delivery Addresses</h3>
                <span className="text-xs font-bold text-slate-500">{addresses.length} saved</span>
              </div>

              {addresses.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
                  <MapPin size={36} className="mx-auto text-slate-300 mb-2.5" />
                  <p className="text-sm font-bold text-slate-700">No saved addresses</p>
                  <p className="text-xs text-slate-400 mt-0.5">The user has not added any addresses yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr._id} className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-2xs text-xs space-y-2 relative">
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

          {/* TAB 7: ACCOUNT INFO */}
          {activeTab === "account" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Account Information & Security</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Detailed database record information and account settings
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                
                {/* Username */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Username</span>
                  <span className="font-bold text-slate-900 text-sm mt-1 block">{user.username}</span>
                </div>

                {/* Email Address */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
                  <span className="font-bold text-slate-900 text-sm mt-1 block truncate">{user.email}</span>
                </div>

                {/* Verification Status */}
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

                {/* Customer ID */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Customer ID</span>
                  <span className="font-mono text-slate-800 font-bold mt-1 block">{user.customerId || "Not Assigned"}</span>
                </div>

                {/* Mobile Number */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Mobile Number</span>
                  <span className="font-bold text-slate-900 mt-1 block">{user.mobileNo || "Not provided"}</span>
                </div>

                {/* Gender */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Gender</span>
                  <span className="font-bold text-slate-900 mt-1 block">{user.gender || "Not specified"}</span>
                </div>

                {/* Date of Birth */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Date of Birth</span>
                  <span className="font-bold text-slate-900 mt-1 block">
                    {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not provided"}
                  </span>
                </div>

                {/* Account Created */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Registration Date</span>
                  <span className="font-bold text-slate-900 mt-1 block">
                    {user.createdAt ? new Date(user.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </span>
                </div>

                {/* Account Updated */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Profile Last Updated</span>
                  <span className="font-bold text-slate-900 mt-1 block">
                    {user.updatedAt ? new Date(user.updatedAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </span>
                </div>

                {/* Mongo ID with Copy */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 sm:col-span-2 lg:col-span-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Database Record ID (MongoDB)</span>
                    <span className="font-mono text-xs text-slate-800 font-bold block mt-1">{user._id}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user._id);
                      setCopiedId(true);
                      toast.success("User ID copied to clipboard");
                      setTimeout(() => setCopiedId(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer shadow-2xs shrink-0"
                  >
                    {copiedId ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedId ? "Copied" : "Copy ID"}</span>
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default AdminUserDetailsPage;
