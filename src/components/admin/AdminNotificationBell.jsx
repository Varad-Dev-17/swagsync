import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Package,
  RotateCcw,
  UserPlus,
  Store,
  Star,
  AlertTriangle,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  ChevronRight,
  Loader2,
  Inbox,
  Headphones,
} from "lucide-react";
import api from "../../api/axiosConfig";
import toast from "react-hot-toast";

// Format relative timestamp
const formatRelativeTime = (dateInput) => {
  if (!dateInput) return "";
  const now = new Date();
  const past = new Date(dateInput);
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};

// Activity icon renderer
const renderActivityIcon = (type, iconType) => {
  const normType = (type || "").toLowerCase();
  if (normType.includes("stock")) {
    return <AlertTriangle size={15} className="text-amber-600" />;
  }
  if (normType.includes("order")) {
    return <Package size={15} className="text-blue-600" />;
  }
  if (normType.includes("return")) {
    return <RotateCcw size={15} className="text-orange-600" />;
  }
  if (normType.includes("user")) {
    return <UserPlus size={15} className="text-purple-600" />;
  }
  if (normType.includes("vendor")) {
    return <Store size={15} className="text-indigo-600" />;
  }
  if (normType.includes("review")) {
    return <Star size={15} className="text-emerald-600 fill-emerald-500/20" />;
  }
  if (normType.includes("ticket")) {
    return <Headphones size={15} className="text-rose-600" />;
  }

  switch (iconType) {
    case "package":
      return <Package size={15} className="text-blue-600" />;
    case "return":
      return <RotateCcw size={15} className="text-orange-600" />;
    case "store":
      return <Store size={15} className="text-indigo-600" />;
    case "star":
    case "sparkles":
      return <Star size={15} className="text-emerald-600 fill-emerald-500/20" />;
    case "alert":
      return <AlertTriangle size={15} className="text-amber-600" />;
    case "user":
      return <UserPlus size={15} className="text-purple-600" />;
    case "ticket":
      return <Headphones size={15} className="text-rose-600" />;
    default:
      return <Bell size={15} className="text-slate-600" />;
  }
};

const getActivityBadgeStyle = (type) => {
  const norm = (type || "").toLowerCase();
  if (norm.includes("stock")) return "bg-amber-50 border-amber-200 text-amber-700";
  if (norm.includes("order")) return "bg-blue-50 border-blue-200 text-blue-700";
  if (norm.includes("return")) return "bg-orange-50 border-orange-200 text-orange-700";
  if (norm.includes("user")) return "bg-purple-50 border-purple-200 text-purple-700";
  if (norm.includes("vendor")) return "bg-indigo-50 border-indigo-200 text-indigo-700";
  if (norm.includes("review")) return "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (norm.includes("ticket")) return "bg-rose-50 border-rose-200 text-rose-700";
  return "bg-slate-50 border-slate-200 text-slate-700";
};

const TABS = [
  { id: "all", label: "All" },
  { id: "orders", label: "Orders" },
  { id: "stock", label: "Low Stock" },
  { id: "tickets", label: "Tickets" },
  { id: "users", label: "Customers" },
  { id: "returns", label: "Returns" },
  { id: "vendors", label: "Vendors" },
  { id: "reviews", label: "Reviews" },
];

const AdminNotificationBell = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const containerRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (tab = activeTab, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get("/admin/notifications", {
        params: {
          type: tab === "all" ? undefined : tab,
          limit: 30,
        },
      });

      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("[AdminNotificationBell] Fetch error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [activeTab]);

  // Fetch unread count for badge
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get("/admin/notifications/unread-count");
      if (res.data.success) {
        setUnreadCount(res.data.count || 0);
      }
    } catch (err) {
      // Ignore background count error
    }
  }, []);

  // Poll count periodically
  useEffect(() => {
    fetchNotifications(activeTab, true);

    const interval = setInterval(() => {
      fetchUnreadCount();
      if (isOpen) {
        fetchNotifications(activeTab, true);
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [activeTab, isOpen, fetchNotifications, fetchUnreadCount]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Handle Mark Single Read
  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await api.patch(`/admin/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  // Handle Mark All Read
  const handleMarkAllRead = async () => {
    try {
      setIsMarkingAll(true);
      const res = await api.patch("/admin/notifications/mark-all-read");
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (err) {
      toast.error("Failed to mark all as read");
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Handle Clear All
  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all admin notifications?")) return;
    try {
      const res = await api.delete("/admin/notifications/clear-all");
      if (res.data.success) {
        setNotifications([]);
        setUnreadCount(0);
        toast.success("All notifications cleared");
      }
    } catch (err) {
      toast.error("Failed to clear notifications");
    }
  };

  // Click notification row -> mark read & navigate
  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      api.patch(`/admin/notifications/${notif._id}/read`).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    fetchNotifications(tabId);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) {
            fetchNotifications(activeTab);
          }
        }}
        className={`relative p-2.5 rounded-xl border transition-all flex items-center justify-center ${
          isOpen
            ? "bg-purple-50 border-purple-300 text-purple-700 shadow-xs"
            : "bg-white border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 text-slate-700 shadow-2xs"
        }`}
        title="Admin Notifications"
        aria-label="Admin Notifications"
      >
        <Bell size={18} className={unreadCount > 0 ? "text-purple-600 animate-pulse" : "text-slate-600"} />

        {/* Unread Pill Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in-50">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 mt-2.5 w-[360px] sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col font-sans"
            style={{ maxHeight: "calc(100vh - 120px)" }}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Bell size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 leading-none">
                      Store Activities
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Live updates across orders, users, returns, and inventory
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={isMarkingAll}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors text-xs flex items-center gap-1 font-semibold"
                    title="Mark all as read"
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Clear all"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-3 py-2 border-b border-slate-100 bg-white flex items-center gap-1 overflow-x-auto no-scrollbar">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Notifications Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[380px] min-h-[160px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-purple-600" />
                  <span className="text-xs font-medium">Loading activities...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                    <Inbox size={22} />
                  </div>
                  <p className="text-sm font-bold text-slate-800">No activities found</p>
                  <p className="text-xs text-slate-400 max-w-[240px] mt-1">
                    {activeTab === "all"
                      ? "You're all caught up! New orders, registrations, and alerts will appear here."
                      : `No notifications in ${TABS.find((t) => t.id === activeTab)?.label || "this category"}.`}
                  </p>
                </div>
              ) : (
                notifications.map((item) => {
                  return (
                    <div
                      key={item._id}
                      onClick={() => handleNotificationClick(item)}
                      className={`group p-3.5 sm:px-4 hover:bg-slate-50/90 transition-all cursor-pointer flex items-start gap-3 relative ${
                        !item.read ? "bg-purple-50/25" : ""
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs ${getActivityBadgeStyle(
                          item.type
                        )}`}
                      >
                        {renderActivityIcon(item.type, item.iconType)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={`text-xs truncate ${
                              !item.read
                                ? "font-bold text-slate-900"
                                : "font-semibold text-slate-700"
                            }`}
                          >
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 font-normal line-clamp-2 mt-0.5 leading-relaxed">
                          {item.message}
                        </p>

                        <div className="mt-2 flex items-center justify-between text-[11px]">
                          <span className="inline-flex items-center gap-1 font-semibold text-purple-700 group-hover:text-purple-800 transition-colors">
                            {item.linkText || "View details"}
                            <ChevronRight size={12} />
                          </span>

                          {!item.read && (
                            <button
                              onClick={(e) => handleMarkAsRead(e, item._id)}
                              className="text-[10px] font-semibold text-slate-400 hover:text-purple-700 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white"
                              title="Mark read"
                            >
                              <Check size={11} /> Mark read
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Unread Indicator Dot */}
                      {!item.read && (
                        <div className="w-2 h-2 rounded-full bg-purple-600 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Auto-refreshing live</span>
              <button
                onClick={() => fetchNotifications(activeTab)}
                className="text-purple-700 hover:text-purple-900 font-semibold"
              >
                Refresh now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminNotificationBell;
