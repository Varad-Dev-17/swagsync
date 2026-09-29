import { useState, useEffect, useCallback } from "react";
import api from "../../../../api/axiosConfig";
import toast from "react-hot-toast";
import {
  Headphones,
  Search,
  RefreshCw,
  Eye,
  Send,
  X,
  Image as ImageIcon,
  ShieldCheck,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  User,
} from "lucide-react";
import Pagination from "../../../../components/admin/ui/Pagination";

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
  "We have escalated this to our fulfillment team. You will receive an update shortly.",
  "Your return/exchange request has been authorized. Our courier will pick up the package soon.",
  "We have reviewed the product details and arranged a priority replacement.",
  "We sincerely apologize for the inconvenience. The issue has now been addressed.",
  "Could you please provide additional details or a photo of the product packaging tag?",
];

export default function VendorTickets() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);

  // Drawer / Conversation Modal
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

  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
      });
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());

      const res = await api.get(`/vendor/portal/tickets?${params.toString()}`);
      if (res.data?.success) {
        setTickets(res.data.data?.tickets || []);
        if (res.data.data?.stats) {
          setStats(res.data.data.stats);
        }
        setTotalPages(res.data.data?.pagination?.totalPages || 1);
        setTotalTickets(res.data.data?.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Failed to load vendor tickets:", error);
      toast.error(error.response?.data?.message || "Failed to fetch support tickets");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      const res = await api.patch(`/vendor/portal/tickets/${ticketId}/status`, { status: newStatus });
      if (res.data?.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchTickets();
        if (activeTicket && activeTicket._id === ticketId) {
          setActiveTicket((prev) => ({ ...prev, status: newStatus }));
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
      const res = await api.post(`/vendor/portal/tickets/${activeTicket._id}/reply`, {
        message: responseMessage.trim(),
        newStatus: responseStatus,
      });

      if (res.data?.success) {
        toast.success("Response sent to customer successfully!");
        setResponseMessage("");
        setActiveTicket(res.data.data);
        fetchTickets();
      }
    } catch (error) {
      console.error("Failed to respond to ticket:", error);
      toast.error(error.response?.data?.message || "Failed to submit response");
    } finally {
      setIsSendingResponse(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 py-6 px-4 sm:px-8 lg:px-12 font-sans">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#fe4a03] border border-orange-100 flex items-center justify-center">
                <Headphones size={22} />
              </div>
              Customer Support Tickets
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Resolve customer queries, inspect product evidence, and dispatch official merchant replies.
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
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Toolbar & Filter Bar */}
          <div className="p-4 sm:p-4.5 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Ticket ID, Customer, Order ID, query..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#fe4a03] focus:ring-2 focus:ring-[#fe4a03]/20 transition-all shadow-2xs"
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
                        ? "bg-white text-[#fe4a03] shadow-2xs font-bold"
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
                <RefreshCw size={15} className={isLoading ? "animate-spin text-[#fe4a03]" : ""} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Ticket</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Subject & Query</th>
                  <th className="py-3.5 px-4 text-center">Order Reference</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Priority</th>
                  <th className="py-3.5 px-4 text-center">Date</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw size={24} className="animate-spin mx-auto text-[#fe4a03] mb-2" />
                      Loading support tickets...
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      No support tickets found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => {
                    const badge = STATUS_BADGES[t.status] || STATUS_BADGES.open;
                    return (
                      <tr key={t._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-4 sm:px-6 font-mono font-bold text-[#fe4a03]">
                          #{t.ticketId || t._id.slice(-6).toUpperCase()}
                        </td>

                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-900 text-xs">
                            {t.user?.username || t.user?.name || "Customer"}
                          </p>
                          <p className="text-[11px] text-slate-400">{t.user?.email || ""}</p>
                        </td>

                        <td className="py-4 px-4 max-w-xs">
                          <p className="font-bold text-slate-800 line-clamp-1">{t.subject || t.title || "Query"}</p>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{t.message || ""}</p>
                          {t.images && t.images.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-[#fe4a03] font-bold mt-1">
                              <ImageIcon size={11} /> {t.images.length} attachment(s)
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center">
                          {t.orderId ? (
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                              #{t.orderId}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                              t.priority === "high"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : t.priority === "medium"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {t.priority || "Normal"}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center text-xs text-slate-500">
                          {formatDate(t.createdAt)}
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-right">
                          <button
                            onClick={() => {
                              setActiveTicket(t);
                              setResponseStatus(t.status === "closed" ? "closed" : "in_progress");
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#fe4a03] border border-orange-100 font-bold text-xs transition-colors cursor-pointer"
                          >
                            <Eye size={13} />
                            Reply
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalTickets}
            itemsPerPage={10}
            itemLabel="tickets"
          />
        </div>
      </div>

      {/* Slide-over Conversation Drawer / Modal */}
      {activeTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs animate-in fade-in"
          onClick={() => setActiveTicket(null)}
        >
          <div
            className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#fe4a03] border border-orange-100 flex items-center justify-center font-bold">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Ticket #{activeTicket.ticketId || activeTicket._id.slice(-6).toUpperCase()}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Customer: {activeTicket.user?.username || activeTicket.user?.name || "Customer"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={activeTicket.status}
                  onChange={(e) => handleUpdateStatus(activeTicket._id, e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-[#fe4a03]"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <button
                  onClick={() => setActiveTicket(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
              {/* Customer Initial Issue */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <User size={13} className="text-[#fe4a03]" />
                    {activeTicket.user?.username || "Customer"}
                  </span>
                  <span className="text-[10px] text-slate-400">{formatDate(activeTicket.createdAt)}</span>
                </div>
                <p className="text-xs font-bold text-slate-800">{activeTicket.subject || "Issue Details"}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{activeTicket.message}</p>

                {activeTicket.images && activeTicket.images.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Attached Evidence:</p>
                    <div className="flex gap-2">
                      {activeTicket.images.map((img, i) => (
                        <div
                          key={i}
                          onClick={() => setPreviewImage(typeof img === "string" ? img : img.url)}
                          className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer hover:opacity-90"
                        >
                          <img
                            src={typeof img === "string" ? img : img.url}
                            alt="Attachment"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Thread Responses */}
              {activeTicket.responses &&
                activeTicket.responses.map((resp, idx) => {
                  const isVendor = resp.sender === "vendor" || resp.sender === "admin";
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border shadow-2xs space-y-1.5 ${
                        isVendor
                          ? "bg-orange-50/60 border-orange-200/80 ml-6"
                          : "bg-white border-slate-200/90 mr-6"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-xs ${isVendor ? "text-[#fe4a03]" : "text-slate-900"}`}>
                          {resp.senderName || (isVendor ? "Store Support" : "Customer")}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(resp.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{resp.message}</p>
                    </div>
                  );
                })}
            </div>

            {/* Quick Response Suggestions */}
            <div className="px-6 py-2 bg-slate-100 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">Quick:</span>
              {QUICK_RESPONSES.map((qr, i) => (
                <button
                  key={i}
                  onClick={() => setResponseMessage(qr)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-white border border-slate-200 hover:border-[#fe4a03] text-slate-700 hover:text-[#fe4a03] transition-colors whitespace-nowrap cursor-pointer shrink-0"
                >
                  {qr.slice(0, 30)}...
                </button>
              ))}
            </div>

            {/* Composer Form */}
            <form onSubmit={handleSendResponse} className="p-4 bg-white border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Compose Official Response</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">After sending:</span>
                  <select
                    value={responseStatus}
                    onChange={(e) => setResponseStatus(e.target.value)}
                    className="px-2 py-0.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-[#fe4a03]"
                  >
                    <option value="in_progress">Keep In Progress</option>
                    <option value="resolved">Mark Resolved</option>
                    <option value="closed">Close Ticket</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={3}
                placeholder="Type your official merchant response here..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#fe4a03] focus:ring-2 focus:ring-[#fe4a03]/20 transition-all font-medium"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSendingResponse}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#fe4a03] hover:bg-[#e03f00] text-white text-xs font-bold transition-colors shadow-sm shadow-[#fe4a03]/20 cursor-pointer"
                >
                  <Send size={14} />
                  {isSendingResponse ? "Sending..." : "Send Response"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-xl max-h-[85vh] overflow-hidden rounded-2xl bg-black">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            <img src={previewImage} alt="Preview" className="w-full h-auto object-contain max-h-[80vh]" />
          </div>
        </div>
      )}
    </div>
  );
}
