import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Headphones,
  Search,
  RefreshCw,
  Eye,
  Send,
  Trash2,
  X,
  Image as ImageIcon,
  ShieldCheck,
  MessageSquare
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";

const STATUS_BADGES = {
  open: {
    label: "Open",
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  resolved: {
    label: "Resolved",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  closed: {
    label: "Closed",
    bg: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
};

const QUICK_RESPONSES = [
  "We have escalated this to our delivery partner. You will receive an update shortly.",
  "Your return request has been authorized. Our courier will pick up the package within 24-48 hours.",
  "Your refund has been successfully initiated and should reflect in your account in 3-5 business days.",
  "We apologize for the inconvenience. The issue has now been resolved.",
  "Could you please provide additional details or a photo of the product tag?",
];

const Tickets = () => {
  const { getAuthHeaders } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modal / Drawer state
  const [activeTicket, setActiveTicket] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [responseStatus, setResponseStatus] = useState("in_progress");
  const [isSendingResponse, setIsSendingResponse] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/admin/tickets?limit=100`;
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      if (debouncedSearch.trim()) {
        url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
      }

      const res = await axios.get(url, { headers: getAuthHeaders() });
      if (res.data?.success) {
        setTickets(res.data.tickets || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (error) {
      console.error("Failed to load admin tickets:", error);
      toast.error("Failed to fetch support tickets");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      const res = await axios.patch(
        `/admin/tickets/${ticketId}/status`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );

      if (res.data?.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchTickets();
        if (activeTicket && activeTicket._id === ticketId) {
          setActiveTicket(res.data.ticket);
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!responseMessage.trim() || !activeTicket) {
      toast.error("Please enter a response message");
      return;
    }

    setIsSendingResponse(true);
    try {
      const res = await axios.post(
        `/admin/tickets/${activeTicket._id}/reply`,
        {
          message: responseMessage.trim(),
          newStatus: responseStatus,
        },
        { headers: getAuthHeaders() }
      );

      if (res.data?.success) {
        toast.success("Response sent to customer successfully!");
        setResponseMessage("");
        setActiveTicket(res.data.ticket);
        fetchTickets();
      }
    } catch (error) {
      console.error("Failed to respond to ticket:", error);
      toast.error(error.response?.data?.message || "Failed to submit response");
    } finally {
      setIsSendingResponse(false);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await axios.delete(`/admin/tickets/${ticketId}`, {
        headers: getAuthHeaders(),
      });

      if (res.data?.success) {
        toast.success("Ticket deleted successfully");
        if (activeTicket?._id === ticketId) {
          setActiveTicket(null);
        }
        fetchTickets();
      }
    } catch (error) {
      console.error("Delete ticket error:", error);
      toast.error(error.response?.data?.message || "Failed to delete ticket");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-6 px-4 sm:px-8 lg:px-12">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#4648d4]/10 text-[#4648d4] flex items-center justify-center">
                <Headphones size={22} />
              </div>
              Support Tickets Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Review customer tickets, inspect uploaded evidence images, and dispatch official support responses.
            </p>
          </div>

          {/* Stat pills */}
          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-2xs">
              Total: <span className="font-bold text-slate-900">{stats.total || tickets.length}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 shadow-2xs">
              Open: <span className="font-bold">{stats.open || 0}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800 shadow-2xs">
              In Progress: <span className="font-bold">{stats.in_progress || 0}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 shadow-2xs">
              Resolved: <span className="font-bold">{stats.resolved || 0}</span>
            </div>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Toolbar & Filter Bar */}
          <div className="p-4 sm:p-4.5 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Ticket ID, Customer, Email, Order ID, query..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#4648d4] transition-colors shadow-2xs"
              />
            </div>

            {/* Status Tabs & Refresh */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="flex bg-slate-200/60 p-1 rounded-xl gap-1 shrink-0">
                {["all", "open", "in_progress", "resolved", "closed"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                      statusFilter === st
                        ? "bg-white text-[#4648d4] shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {st === "in_progress" ? "In Progress" : st}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchTickets}
                className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shrink-0 shadow-2xs cursor-pointer"
                title="Refresh"
              >
                <RefreshCw size={15} className={isLoading ? "animate-spin text-[#4648d4]" : ""} />
              </button>
            </div>
          </div>

        {/* Ticket List Table */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#4648d4] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-500">Loading support tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#4648d4] flex items-center justify-center mx-auto">
                <Headphones size={28} />
              </div>
              <h3 className="font-bold text-slate-800 text-base">No support tickets found</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                {debouncedSearch || statusFilter !== "all"
                  ? "Try adjusting your search query or status filter."
                  : "Customer tickets will appear here once submitted."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Topic / Order</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Image</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                  {tickets.map((t) => {
                    const status = STATUS_BADGES[t.status] || STATUS_BADGES.open;
                    const hasReplies = t.responses && t.responses.length > 0;

                    return (
                      <tr
                        key={t._id}
                        className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                        onClick={() => {
                          setActiveTicket(t);
                          setResponseStatus(t.status === "open" ? "in_progress" : t.status);
                        }}
                      >
                        {/* Ticket ID & Date */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>#{t.ticketId}</span>
                            {hasReplies && (
                              <span className="w-2 h-2 rounded-full bg-[#4648d4]" title="Has conversation history" />
                            )}
                          </div>
                          <span className="text-[11px] font-normal text-slate-400 block mt-0.5">
                            {formatDate(t.createdAt)}
                          </span>
                        </td>

                        {/* Customer Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {t.user?.profileImage?.url ? (
                              <img
                                src={t.user.profileImage.url}
                                alt="Avatar"
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#4648d4]/10 text-[#4648d4] font-bold flex items-center justify-center shrink-0 text-xs">
                                {t.user?.username ? t.user.username[0].toUpperCase() : "U"}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate">
                                {t.user?.username || "Unknown User"}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {t.user?.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Topic / Order */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-700 block">
                            {t.category}
                          </span>
                          {t.orderId ? (
                            <span className="text-[11px] text-slate-500 font-mono">
                              ORD: {t.orderId}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No Order ID</span>
                          )}
                        </td>

                        {/* Message Preview */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-slate-600 line-clamp-2 leading-relaxed">
                            {t.message}
                          </p>
                        </td>

                        {/* Attached Image */}
                        <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {t.image?.url ? (
                            <button
                              onClick={() => setPreviewImage(t.image.url)}
                              className="relative inline-block group"
                              title="Click to zoom image"
                            >
                              <img
                                src={t.image.url}
                                alt="Attachment"
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-2xs group-hover:opacity-80 transition-opacity"
                              />
                              <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                <Eye size={13} />
                              </div>
                            </button>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={t.status}
                            onChange={(e) => handleUpdateStatus(t._id, e.target.value)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition-colors ${status.bg}`}
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setActiveTicket(t);
                                setResponseStatus(t.status === "open" ? "in_progress" : t.status);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#4648d4] hover:bg-[#3b3db8] text-white text-xs font-bold transition-colors shadow-2xs"
                            >
                              <MessageSquare size={13} />
                              <span>Respond</span>
                            </button>
                            <button
                              onClick={() => handleDeleteTicket(t._id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Ticket"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* DETAIL & RESPONSE MODAL */}
      {activeTicket && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setActiveTicket(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4648d4]/10 text-[#4648d4] flex items-center justify-center">
                  <Headphones size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">
                      Ticket #{activeTicket.ticketId}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        STATUS_BADGES[activeTicket.status]?.bg || STATUS_BADGES.open.bg
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          STATUS_BADGES[activeTicket.status]?.dot || STATUS_BADGES.open.dot
                        }`}
                      />
                      {STATUS_BADGES[activeTicket.status]?.label || "Open"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Created on {formatDate(activeTicket.createdAt)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTicket(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Customer & Issue Summary Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Customer Information
                  </span>
                  <p className="text-sm font-bold text-slate-800">
                    {activeTicket.user?.username || "Unknown"}
                  </p>
                  <p className="text-xs text-slate-500">{activeTicket.user?.email}</p>
                  {activeTicket.user?.mobileNo && (
                    <p className="text-xs text-slate-500">Phone: {activeTicket.user.mobileNo}</p>
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Topic & Order
                  </span>
                  <p className="text-sm font-bold text-slate-800">{activeTicket.category}</p>
                  {activeTicket.orderId ? (
                    <p className="text-xs text-[#4648d4] font-mono font-bold mt-0.5">
                      Order: {activeTicket.orderId}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No Order ID specified</p>
                  )}
                </div>
              </div>

              {/* Initial Customer Message & Attached Image */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Customer's Original Message
                </span>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {activeTicket.message}
                  </p>

                  {/* Attached photo view */}
                  {activeTicket.image?.url && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                        <ImageIcon size={14} className="text-[#4648d4]" />
                        Customer Attached Evidence Photo:
                      </p>
                      <div className="relative inline-block group">
                        <img
                          src={activeTicket.image.url}
                          alt="Ticket attachment"
                          className="w-32 h-32 object-cover rounded-xl border border-slate-200 shadow-sm cursor-pointer group-hover:opacity-90 transition-all"
                          onClick={() => setPreviewImage(activeTicket.image.url)}
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewImage(activeTicket.image.url)}
                          className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all"
                        >
                          <Eye size={15} />
                          <span>Click to Zoom</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Thread History */}
              {activeTicket.responses && activeTicket.responses.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Response History ({activeTicket.responses.length})
                  </span>
                  <div className="space-y-3">
                    {activeTicket.responses.map((resp, idx) => {
                      const isAdmin = resp.sender === "admin";
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border text-xs sm:text-sm ${
                            isAdmin
                              ? "bg-indigo-50/70 border-indigo-200 text-slate-800"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              {isAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4648d4] text-white">
                                  <ShieldCheck size={11} />
                                  Support Response ({resp.senderName || "Admin"})
                                </span>
                              ) : (
                                <span className="font-bold text-slate-900">
                                  Customer ({resp.senderName || "User"})
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {formatDate(resp.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed">{resp.message}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Response Composer */}
              <form onSubmit={handleSendResponse} className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Dispatch Official Response to Customer:
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Set Status:</span>
                    <select
                      value={responseStatus}
                      onChange={(e) => setResponseStatus(e.target.value)}
                      className="text-xs font-bold px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#4648d4]"
                    >
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                      <option value="open">Open</option>
                    </select>
                  </div>
                </div>

                {/* Quick Templates */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Quick Templates:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_RESPONSES.map((tmpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setResponseMessage(tmpl)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-left truncate max-w-xs"
                        title={tmpl}
                      >
                        {tmpl}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Type your message to the customer here. This response will be immediately visible on their account..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#4648d4] focus:bg-white transition-colors"
                  required
                />

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTicket(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingResponse || !responseMessage.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4648d4] hover:bg-[#3b3db8] text-white text-xs sm:text-sm font-bold transition-all disabled:opacity-50 shadow-sm shadow-[#4648d4]/20 active:scale-95"
                  >
                    {isSendingResponse ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Response...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Send Response & Update</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FULL LIGHTBOX FOR IMAGE PREVIEW */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImage}
              alt="Full evidence"
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/20"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white p-2 rounded-full transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Tickets;
