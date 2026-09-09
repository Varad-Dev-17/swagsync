import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { 
  Headphones, 
  Clock, 
  Send, 
  Image as ImageIcon, 
  X, 
  Plus, 
  ShieldCheck,
  RefreshCw,
  Eye,
  Paperclip
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";

const STATUS_CONFIG = {
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
    bg: "bg-gray-100 text-gray-700 border-gray-200",
    dot: "bg-gray-400",
  },
};

const TicketsSection = () => {
  const { getAuthHeaders } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  // Image modal state
  const [previewImage, setPreviewImage] = useState(null);

  // Create Ticket Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createCategory, setCreateCategory] = useState("Order Issues");
  const [createOrderId, setCreateOrderId] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [createImageFile, setCreateImageFile] = useState(null);
  const [createImagePreview, setCreateImagePreview] = useState(null);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const fileInputRef = useRef(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/tickets/my-tickets", {
        headers: getAuthHeaders(),
      });
      if (res.data?.success) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
      toast.error("Could not load your support tickets");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      toast.error("Only JPG, PNG, or WebP formats are supported");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB");
      return;
    }

    setCreateImageFile(file);
    setCreateImagePreview(URL.createObjectURL(file));
  };

  const removeSelectedImage = () => {
    setCreateImageFile(null);
    if (createImagePreview) {
      URL.revokeObjectURL(createImagePreview);
      setCreateImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault();
    if (!createMessage.trim()) {
      toast.error("Please describe your issue");
      return;
    }

    setIsSubmittingTicket(true);
    try {
      const formData = new FormData();
      formData.append("category", createCategory);
      formData.append("orderId", createOrderId.trim());
      formData.append("message", createMessage.trim());
      if (createImageFile) {
        formData.append("image", createImageFile);
      }

      const res = await axios.post("/tickets", formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        toast.success(`Ticket ${res.data.ticket.ticketId} created successfully!`);
        setIsCreateModalOpen(false);
        setCreateCategory("Order Issues");
        setCreateOrderId("");
        setCreateMessage("");
        removeSelectedImage();
        fetchTickets();
      }
    } catch (err) {
      console.error("Ticket submission error:", err);
      toast.error(err.response?.data?.message || "Failed to submit ticket");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    setIsReplying(true);
    try {
      const res = await axios.post(
        `/tickets/${selectedTicket._id}/reply`,
        { message: replyMessage.trim() },
        { headers: getAuthHeaders() }
      );

      if (res.data?.success) {
        toast.success("Reply sent!");
        setReplyMessage("");
        setSelectedTicket(res.data.ticket);
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to reply:", err);
      toast.error(err.response?.data?.message || "Failed to send reply");
    } finally {
      setIsReplying(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Support Tickets</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF5ED] text-[#FD7100] border border-[#FD7100]/30">
              {tickets.length} {tickets.length === 1 ? "Ticket" : "Tickets"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track your requests, view admin responses, and communicate with support.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTickets}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
            title="Refresh tickets"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-[#FD7100]" : ""} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FD7100] hover:bg-[#e06400] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm shadow-[#FD7100]/20 active:scale-95"
          >
            <Plus size={16} />
            <span>Create Ticket</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading && tickets.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#FD7100] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading your tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#FD7100] flex items-center justify-center mx-auto">
            <Headphones size={28} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">No support tickets found</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Have a question about an order, payment, or delivery? Create a ticket and our customer support team will assist you.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FD7100] hover:bg-[#e06400] text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-[#FD7100]/20 active:scale-95"
          >
            <Plus size={16} />
            <span>Create Your First Ticket</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Ticket List (Left column on desktop) */}
          <div className={`${selectedTicket ? "lg:col-span-5" : "lg:col-span-12"} space-y-3`}>
            {tickets.map((ticket) => {
              const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
              const isSelected = selectedTicket?._id === ticket._id;
              const hasResponses = ticket.responses && ticket.responses.length > 0;
              const lastAdminResponse = hasResponses 
                ? [...ticket.responses].reverse().find((r) => r.sender === "admin")
                : null;

              return (
                <div
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all cursor-pointer hover:shadow-md ${
                    isSelected
                      ? "border-[#FD7100] ring-2 ring-[#FD7100]/20 shadow-sm"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                        #{ticket.ticketId}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                        {ticket.category}
                      </span>
                      {ticket.orderId && (
                        <span className="text-[11px] text-gray-500 font-mono">
                          Order: {ticket.orderId}
                        </span>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${status.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-800 font-medium line-clamp-2 mb-3">
                    {ticket.message}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(ticket.createdAt)}
                    </span>

                    <div className="flex items-center gap-3">
                      {ticket.image?.url && (
                        <span className="inline-flex items-center gap-1 text-[#FD7100] font-semibold">
                          <ImageIcon size={12} />
                          Photo
                        </span>
                      )}
                      {lastAdminResponse ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <ShieldCheck size={12} />
                          Admin Replied
                        </span>
                      ) : (
                        <span className="text-gray-400">Awaiting Reply</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ticket Details & Conversation Panel (Right column on desktop) */}
          {selectedTicket && (
            <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6 sticky top-24">
              {/* Detail Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-black text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                      #{selectedTicket.ticketId}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        STATUS_CONFIG[selectedTicket.status]?.bg || STATUS_CONFIG.open.bg
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          STATUS_CONFIG[selectedTicket.status]?.dot || STATUS_CONFIG.open.dot
                        }`}
                      />
                      {STATUS_CONFIG[selectedTicket.status]?.label || "Open"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mt-2">
                    {selectedTicket.category}
                  </h3>
                  {selectedTicket.orderId && (
                    <p className="text-xs text-gray-500 mt-0.5 font-mono">
                      Associated Order ID: {selectedTicket.orderId}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close Details"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Original User Query / Message */}
              <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-bold text-gray-800">Your Initial Request</span>
                  <span>{formatDate(selectedTicket.createdAt)}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.message}
                </p>

                {/* Uploaded Image preview (if any) */}
                {selectedTicket.image?.url && (
                  <div className="pt-2">
                    <p className="text-[11px] font-bold text-gray-600 mb-1.5 flex items-center gap-1">
                      <ImageIcon size={13} className="text-[#FD7100]" />
                      Attached Image:
                    </p>
                    <div className="relative inline-block group">
                      <img
                        src={selectedTicket.image.url}
                        alt="Ticket attachment"
                        className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl border border-gray-200 shadow-2xs group-hover:opacity-90 transition-all cursor-pointer"
                        onClick={() => setPreviewImage(selectedTicket.image.url)}
                      />
                      <button
                        onClick={() => setPreviewImage(selectedTicket.image.url)}
                        className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Responses Thread */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Conversation & Support Replies
                </h4>

                {selectedTicket.responses && selectedTicket.responses.length > 0 ? (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {selectedTicket.responses.map((resp, i) => {
                      const isAdmin = resp.sender === "admin";
                      return (
                        <div
                          key={i}
                          className={`p-4 rounded-xl border transition-all ${
                            isAdmin
                              ? "bg-gradient-to-r from-orange-50/70 to-orange-100/30 border-orange-200"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <div className="flex items-center gap-1.5">
                              {isAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FD7100] text-white">
                                  <ShieldCheck size={11} />
                                  SwagSync Support
                                </span>
                              ) : (
                                <span className="font-bold text-gray-800">
                                  You ({resp.senderName || "Customer"})
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400">
                              {formatDate(resp.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {resp.message}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-amber-900">
                        Awaiting Support Response
                      </h5>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Our customer service team is reviewing your ticket and will respond directly here.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Box (if ticket is not closed) */}
              {selectedTicket.status !== "closed" ? (
                <form onSubmit={handleSendReply} className="pt-2 border-t border-gray-100 space-y-3">
                  <label className="block text-xs font-semibold text-gray-700">
                    Send a reply or additional details:
                  </label>
                  <textarea
                    rows={2}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FD7100] focus:bg-white transition-colors resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isReplying || !replyMessage.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FD7100] hover:bg-[#e06400] text-white text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 active:scale-95 shadow-sm shadow-[#FD7100]/20"
                    >
                      {isReplying ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Send Reply</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-gray-50 rounded-xl text-center text-xs text-gray-500 font-medium">
                  This ticket is closed. For further assistance, please create a new ticket.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CREATE TICKET MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FD7100] flex items-center justify-center">
                  <Headphones size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Create Support Ticket</h3>
                  <p className="text-xs text-gray-500">We will respond within 2-4 hours</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  removeSelectedImage();
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Issue Topic *
                  </label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FD7100] focus:bg-white transition-colors"
                  >
                    <option value="Order Issues">Order Status & Delivery</option>
                    <option value="Returns & Refunds">Return or Replacement</option>
                    <option value="Payment & Billing">Payment & Refund Issue</option>
                    <option value="Coupons & Offers">Coupon / Discount Issue</option>
                    <option value="Account & Profile">Account Settings</option>
                    <option value="Other">Other Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Order ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ORD-12345"
                    value={createOrderId}
                    onChange={(e) => setCreateOrderId(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FD7100] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Describe your issue or query *
                </label>
                <textarea
                  rows={3}
                  placeholder="Please describe what you need assistance with..."
                  value={createMessage}
                  onChange={(e) => setCreateMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FD7100] focus:bg-white transition-colors"
                  required
                />
              </div>

              {/* Optional Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Attach Photo / Screenshot <span className="text-gray-400 font-normal">(Optional)</span>
                </label>

                {!createImagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 hover:border-[#FD7100] rounded-xl p-4 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-orange-50/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FD7100] flex items-center justify-center mx-auto mb-1.5">
                      <Paperclip size={15} />
                    </div>
                    <p className="text-xs font-semibold text-gray-700">Click to upload image</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG, WebP up to 5MB</p>
                  </div>
                ) : (
                  <div className="relative inline-block">
                    <img
                      src={createImagePreview}
                      alt="Upload preview"
                      className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-sm hover:bg-red-700 transition-colors"
                      title="Remove image"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    removeSelectedImage();
                  }}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FD7100] hover:bg-[#e06400] text-white text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 shadow-md shadow-[#FD7100]/20 active:scale-95"
                >
                  {isSubmittingTicket ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Submit Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMAGE LIGHTBOX / PREVIEW MODAL */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImage}
              alt="Attached preview"
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/20"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full transition-colors"
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsSection;
