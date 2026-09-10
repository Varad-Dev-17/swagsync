import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Trash2, Shield, Ban, UserCheck, 
  Users, CheckCircle2, ShieldAlert, RefreshCcw,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  Eye
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axiosConfig";

const UserAvatar = ({ user, initial, size = "md" }) => {
  const [imgError, setImgError] = useState(false);
  const avatarUrl =
    user?.profileImage?.url ||
    (typeof user?.profileImage === "string" ? user.profileImage : null) ||
    user?.avatar;

  const sizeClasses = size === "lg" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm";

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={user?.username || "User avatar"}
        onError={() => setImgError(true)}
        className={`${sizeClasses} rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div className={`${sizeClasses} rounded-full bg-indigo-50 border border-indigo-100/90 text-[#4F46E5] font-bold flex items-center justify-center shrink-0 shadow-2xs`}>
      {initial}
    </div>
  );
};

const UsersSection = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting & Pagination
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const itemsPerPage = 7;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users");
      if (res.data.success) setUsers(res.data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await api.delete(`/admin/users/${id}`);
      if (res.data.success) {
        setUsers((prev) => prev.filter((u) => u._id !== id));
        toast.success("User deleted successfully");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.put(`/admin/users/${id}/toggle-status`);
      if (res.data.success) {
        const isBlocked = res.data.user.isBlocked;
        setUsers((prev) =>
          prev.map((u) => (u._id === id ? { ...u, isBlocked } : u))
        );
        toast.success(`User ${isBlocked ? "blocked" : "unblocked"}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleMakeAdmin = async (id) => {
    try {
      const res = await api.patch(`/admin/users/make-admin/${id}`);
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === id ? { ...u, isAdmin: true } : u))
        );
        toast.success("User promoted to admin");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to make admin");
    }
  };

  const handleRemoveAdmin = async (id) => {
    try {
      const res = await api.patch(`/admin/users/remove-admin/${id}`);
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === id ? { ...u, isAdmin: false } : u))
        );
        toast.success("Admin rights removed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove admin");
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, sortBy]);

  // Derived state
  const { filteredAndSortedUsers, stats } = useMemo(() => {
    let result = [...users];

    // Stats calculation
    const total = result.length;
    let active = 0;
    let admins = 0;
    let restricted = 0;

    result.forEach(u => {
      if (u.verified && !u.isBlocked) active++;
      if (u.isAdmin) admins++;
      if (u.isBlocked) restricted++;
    });

    // 1. Search
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(u => 
        u.username?.toLowerCase().includes(lowerSearch) || 
        u.email?.toLowerCase().includes(lowerSearch)
      );
    }

    // 2. Role filter
    if (roleFilter === "admin") result = result.filter(u => u.isAdmin);
    if (roleFilter === "user") result = result.filter(u => !u.isAdmin);

    // 3. Status filter
    if (statusFilter === "verified") result = result.filter(u => u.verified && !u.isBlocked);
    if (statusFilter === "pending") result = result.filter(u => !u.verified && !u.isBlocked);
    if (statusFilter === "blocked") result = result.filter(u => u.isBlocked);

    // 4. Sort
    result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "name-asc") return (a.username || "").localeCompare(b.username || "");
      if (sortBy === "name-desc") return (b.username || "").localeCompare(a.username || "");
      return 0;
    });

    return { filteredAndSortedUsers: result, stats: { total, active, admins, restricted } };
  }, [users, search, roleFilter, statusFilter, sortBy]);

  // Pagination
  const totalItems = filteredAndSortedUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentUsers = filteredAndSortedUsers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-6 px-4 sm:px-8 lg:px-12">
      <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage customer accounts, access permissions, roles, and status.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-[#4F46E5] rounded-lg transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin text-[#4F46E5]" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Total Users */}
        <div className="bg-white rounded-xl p-4 sm:p-4.5 border border-slate-200 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-[#4F46E5]">
            <Users size={22} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Total Users</p>
            <h3 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-tight mt-0.5">{stats.total}</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">All registered users</p>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-xl p-4 sm:p-4.5 border border-slate-200 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
            <CheckCircle2 size={22} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Active Users</p>
            <h3 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-tight mt-0.5">{stats.active}</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">Verified & active</p>
          </div>
        </div>

        {/* Admins */}
        <div className="bg-white rounded-xl p-4 sm:p-4.5 border border-slate-200 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 text-purple-600">
            <Shield size={22} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Admins</p>
            <h3 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-tight mt-0.5">{stats.admins}</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">Administrators</p>
          </div>
        </div>

        {/* Restricted Users */}
        <div className="bg-white rounded-xl p-4 sm:p-4.5 border border-slate-200 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-rose-600">
            <ShieldAlert size={22} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">Restricted Users</p>
            <h3 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-tight mt-0.5">{stats.restricted}</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">Blocked or restricted</p>
          </div>
        </div>

      </div>

      {/* 3. Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {/* Filter Toolbar */}
        <div className="p-4 sm:p-4.5 border-b border-slate-100 bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm font-medium text-slate-800 placeholder:text-slate-400 bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] transition-all shadow-2xs"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50/60 hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:border-[#4F46E5] cursor-pointer transition-colors shadow-2xs"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50/60 hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:border-[#4F46E5] cursor-pointer transition-colors shadow-2xs"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="blocked">Blocked</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3.5 py-2 bg-slate-50/60 hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:border-[#4F46E5] cursor-pointer transition-colors shadow-2xs"
            >
              <option value="newest">Sort by: Newest</option>
              <option value="oldest">Sort by: Oldest</option>
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
            </select>
          </div>

        </div>

        {/* Semantic Responsive Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            
            {/* Table Header */}
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 w-[26%] text-center">User</th>
                <th className="px-4 py-3.5 w-[14%] text-center">Status</th>
                <th className="px-4 py-3.5 w-[14%] text-center">Role</th>
                <th className="px-4 py-3.5 w-[16%] text-center">Joined</th>
                <th className="px-5 py-3.5 w-[30%] text-center">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="w-8 h-8 border-3 border-[#4F46E5] border-t-transparent rounded-full animate-spin mx-auto shadow-2xs" />
                    <p className="mt-3 text-sm font-medium text-slate-500">Loading users...</p>
                  </td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-2.5 text-slate-400">
                      <Users size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-700">No users found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search or filter options.</p>
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => {
                  const initial = user.username?.charAt(0).toUpperCase() || "U";
                  const dateStr = user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })
                    : "—";

                  // Status Badge Styling
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
                      Pending
                    </span>
                  );

                  if (user.isBlocked) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                        <Ban size={13} className="text-rose-600 stroke-[2.5]" />
                        Blocked
                      </span>
                    );
                  } else if (user.verified) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                        <CheckCircle2 size={13} className="text-emerald-600 stroke-[2.5]" />
                        Verified
                      </span>
                    );
                  }

                  return (
                    <tr key={user._id} className="hover:bg-slate-50/60 transition-colors">
                      
                      {/* 1. User Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5 pl-8 sm:pl-12 lg:pl-16">
                          <UserAvatar user={user} initial={initial} />
                          <div className="min-w-0">
                            <span className="block font-bold text-slate-900 text-sm truncate">
                              {user.username || "Anonymous"}
                            </span>
                            <span className="block text-xs text-slate-500 font-medium truncate mt-0.5">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Status */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center">
                          {statusBadge}
                        </div>
                      </td>

                      {/* 3. Role Dropdown */}
                      <td className="px-4 py-4 text-center">
                        <div className="relative inline-block">
                          <select
                            value={user.isAdmin ? "admin" : "user"}
                            onChange={(e) => {
                              if (e.target.value === "admin") {
                                handleMakeAdmin(user._id);
                              } else {
                                handleRemoveAdmin(user._id);
                              }
                            }}
                            className={`appearance-none pl-3 pr-7 py-1.5 rounded-lg text-xs font-bold outline-none cursor-pointer transition-colors shadow-2xs border ${
                              user.isAdmin
                                ? "bg-indigo-50 text-[#4F46E5] border-indigo-200 hover:bg-indigo-100/70"
                                : "bg-slate-100/90 text-slate-700 border-slate-200 hover:bg-slate-200/70"
                            }`}
                          >
                            <option value="user" className="bg-white text-slate-700 font-medium">User</option>
                            <option value="admin" className="bg-white text-[#4F46E5] font-bold">Admin</option>
                          </select>
                          <ChevronDown size={13} className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${user.isAdmin ? "text-[#4F46E5]" : "text-slate-400"}`} />
                        </div>
                      </td>

                      {/* 4. Joined Date */}
                      <td className="px-4 py-4 text-center text-slate-700 font-medium text-sm">
                        {dateStr}
                      </td>

                      {/* 5. Actions */}
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                          
                          {/* View Button */}
                          <button
                            onClick={() => navigate(`/admin/users/${user._id}`)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-[#4F46E5] hover:border-indigo-200 transition-colors cursor-pointer shadow-2xs"
                            title="View User Details"
                          >
                            <Eye size={13} className="stroke-[2.2] text-[#4F46E5]" />
                            <span>View</span>
                          </button>

                          {/* Block / Unblock Toggle */}
                          <button
                            onClick={() => handleToggleStatus(user._id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer shadow-2xs ${
                              user.isBlocked
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-white text-slate-700 border-slate-200 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-200"
                            }`}
                            title={user.isBlocked ? "Unblock User" : "Block User"}
                          >
                            {user.isBlocked ? (
                              <>
                                <UserCheck size={13} className="stroke-[2.2] text-emerald-600" />
                                <span>Unblock</span>
                              </>
                            ) : (
                              <>
                                <Ban size={13} className="stroke-[2.2] text-amber-600" />
                                <span>Block</span>
                              </>
                            )}
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer shadow-2xs"
                            title="Delete User"
                          >
                            <Trash2 size={13} className="stroke-[2.2] text-rose-500" />
                            <span>Delete</span>
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

        {/* 4. Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/40 text-sm">
          
          <div className="font-medium text-slate-600">
            {totalItems > 0 ? (
              <>
                Showing <span className="text-slate-900 font-bold">{((page - 1) * itemsPerPage) + 1}</span> to{" "}
                <span className="text-slate-900 font-bold">{Math.min(page * itemsPerPage, totalItems)}</span> of{" "}
                <span className="text-slate-900 font-bold">{totalItems}</span> users
              </>
            ) : (
              <span>Showing 0 users</span>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#4F46E5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                title="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-[32px] h-8 px-2.5 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center justify-center shadow-2xs ${
                    page === p
                      ? "bg-[#4F46E5] text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-[#4F46E5]"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-[#4F46E5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                title="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

        </div>

      </div>

    </div>

  </div>
);
};

export default UsersSection;
