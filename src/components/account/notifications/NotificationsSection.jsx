import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Package, 
  Tag, 
  ShieldCheck, 
  CheckCheck, 
  Check,
  Trash2, 
  ChevronRight, 
  Sparkles,
  RotateCcw,
  Headphones,
  User,
  Loader2,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../api/axiosConfig';

// Color map for notification accents
const COLOR_STYLES = {
  blue: 'text-blue-600 bg-blue-50 border-blue-100',
  emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  green: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  amber: 'text-amber-600 bg-amber-50 border-amber-100',
  orange: 'text-[#FD7100] bg-[#FFF5ED] border-[#FD7100]/25',
  rose: 'text-rose-600 bg-rose-50 border-rose-100',
  red: 'text-rose-600 bg-rose-50 border-rose-100',
  purple: 'text-purple-600 bg-purple-50 border-purple-100',
  slate: 'text-slate-600 bg-slate-50 border-slate-200',
};

const renderNotificationIcon = (iconType) => {
  switch (iconType) {
    case 'package':
      return <Package size={18} />;
    case 'return':
      return <RotateCcw size={18} />;
    case 'ticket':
      return <Headphones size={18} />;
    case 'tag':
    case 'offer':
      return <Tag size={18} />;
    case 'sparkles':
      return <Sparkles size={18} />;
    case 'shield':
    case 'security':
      return <ShieldCheck size={18} />;
    case 'user':
    case 'account':
      return <User size={18} />;
    default:
      return <Bell size={18} />;
  }
};

const formatTimeAgo = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSecs = Math.floor((now - date) / 1000);

  if (diffInSecs < 60) return 'Just now';
  if (diffInSecs < 3600) return `${Math.floor(diffInSecs / 60)}m ago`;
  if (diffInSecs < 86400) return `${Math.floor(diffInSecs / 3600)}h ago`;
  if (diffInSecs < 172800) return 'Yesterday';
  if (diffInSecs < 604800) return `${Math.floor(diffInSecs / 86400)}d ago`;

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });
};

const NotificationsSection = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const params = { limit: 50 };
      if (filter === 'unread') {
        params.unreadOnly = 'true';
      } else if (filter !== 'all') {
        params.type = filter;
      }

      const res = await api.get('/notifications', { params });
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount ?? 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const notifyUpdate = (newCount) => {
    window.dispatchEvent(new CustomEvent('notifications-updated', { detail: { count: newCount } }));
  };

  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => {
        const next = Math.max(0, prev - 1);
        notifyUpdate(next);
        return next;
      });
      toast.success('Notification marked as read');
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      notifyUpdate(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      const deleted = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (deleted && !deleted.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      notifyUpdate();
      toast.success('Notification removed');
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast.error('Failed to delete notification');
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
      setUnreadCount(0);
      notifyUpdate();
      toast.success('All notifications cleared');
    } catch (err) {
      console.error('Error clearing notifications:', err);
      toast.error('Failed to clear notifications');
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.read) {
      markAsRead(n._id);
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: `Unread ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
    { id: 'orders', label: 'Orders' },
    { id: 'returns', label: 'Returns' },
    { id: 'tickets', label: 'Tickets' },
    { id: 'offers', label: 'Offers & Deals' },
    { id: 'account', label: 'Account' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF5ED] text-[#FD7100] border border-[#FD7100]/30">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time updates on your orders, returns, support tickets, and account activity.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => fetchNotifications(true)}
            disabled={refreshing || loading}
            title="Refresh notifications"
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-[#FD7100]' : ''} />
          </button>

          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer bg-gray-100 hover:bg-[#FFF5ED] text-gray-700 hover:text-[#FD7100] border border-gray-200 hover:border-[#FD7100]/30 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                title={unreadCount === 0 ? "All notifications are already read" : "Mark all as read"}
              >
                <CheckCheck size={14} className={unreadCount > 0 ? "text-[#FD7100]" : "text-gray-400"} />
                <span>Mark all as read</span>
              </button>
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-100"
                title="Clear all notifications"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        {filterTabs.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filter === f.id
                ? 'bg-[#111827] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
          <Loader2 size={32} className="animate-spin text-[#FD7100]" />
          <p className="text-xs text-gray-500 font-medium">Loading notifications...</p>
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => {
            const colorClass = COLOR_STYLES[n.color] || COLOR_STYLES.blue;
            return (
              <div
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 sm:gap-4 ${
                  !n.read
                    ? 'bg-[#FFFBF7] border-[#FD7100]/30 shadow-xs hover:border-[#FD7100]/60'
                    : 'bg-white border-gray-200/80 hover:border-gray-300 hover:bg-gray-50/50'
                }`}
              >
                {/* Unread indicator */}
                {!n.read && (
                  <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[#FD7100] ring-4 ring-[#FD7100]/10" />
                )}

                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${colorClass}`}
                >
                  {renderNotificationIcon(n.iconType)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3
                      className={`text-sm sm:text-base ${
                        !n.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'
                      }`}
                    >
                      {n.title}
                    </h3>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {formatTimeAgo(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                    {n.message}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      {n.link && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#FD7100] group-hover:underline">
                          <span>{n.linkText || 'View Details'}</span>
                          <ChevronRight size={13} />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      {!n.read ? (
                        <button
                          onClick={(e) => markAsRead(n._id, e)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-gray-700 hover:text-[#FD7100] bg-white hover:bg-[#FFF5ED] border border-gray-200 hover:border-[#FD7100]/40 transition-all cursor-pointer shadow-xs active:scale-95"
                          title="Mark this notification as read"
                        >
                          <Check size={13} className="text-[#FD7100]" />
                          <span>Mark as read</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 px-2 py-0.5 rounded bg-gray-100">
                          <CheckCheck size={12} className="text-emerald-500" />
                          <span>Read</span>
                        </span>
                      )}

                      <button
                        onClick={(e) => deleteNotification(e, n._id)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors text-xs cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-center px-4 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4 shadow-xs">
            <Bell size={28} className="stroke-[1.75]" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No notifications found</h3>
          <p className="text-sm text-gray-500 max-w-sm mb-4">
            {filter === 'unread'
              ? "You're all caught up! No unread notifications at the moment."
              : 'You have no notifications in this category right now.'}
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="text-xs font-bold text-[#FD7100] hover:underline cursor-pointer"
            >
              View all notifications
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsSection;
