import { useState, useEffect, useMemo, useCallback } from "react";
import PageCard from "../../../../components/admin/ui/PageCard";
import {
  Star,
  Trash2,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Loader2,
  X,
  AlertCircle,
  Camera,
  MessageSquare,
  CornerDownRight,
  Send,
  Package,
  CheckCircle2,
  User,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../../api/axiosConfig";
import Pagination from "../../../../components/admin/ui/Pagination";

export default function VendorReviews() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImageModal, setSelectedImageModal] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Reply Composer State
  const [replyModal, setReplyModal] = useState({
    open: false,
    reviewId: null,
    reviewItem: null,
    message: "",
    submitting: false,
  });

  const fetchVendorReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        rating: selectedRating,
      });

      const res = await api.get(`/vendor/portal/reviews?${params.toString()}`);
      if (res.data?.success) {
        setReviews(res.data.data?.reviews || []);
        if (res.data.data?.stats) {
          setStats(res.data.data.stats);
        }
        setTotalPages(res.data.data?.pagination?.totalPages || 1);
        setTotalItems(res.data.data?.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Error fetching vendor reviews:", error);
      toast.error(error.response?.data?.message || "Failed to load customer reviews");
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedRating]);

  useEffect(() => {
    fetchVendorReviews();
  }, [fetchVendorReviews]);

  // Search filter
  const filteredReviews = useMemo(() => {
    if (!searchTerm.trim()) return reviews;
    const lower = searchTerm.toLowerCase();
    return reviews.filter(
      (r) =>
        r.product?.title?.toLowerCase().includes(lower) ||
        r.user?.username?.toLowerCase().includes(lower) ||
        r.user?.name?.toLowerCase().includes(lower) ||
        r.user?.email?.toLowerCase().includes(lower) ||
        r.review?.toLowerCase().includes(lower)
    );
  }, [reviews, searchTerm]);

  // Submit vendor reply
  const handleSaveReply = async (e) => {
    e.preventDefault();
    if (!replyModal.message.trim() || !replyModal.reviewId) {
      toast.error("Please enter a reply message");
      return;
    }

    setReplyModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await api.post(`/vendor/portal/reviews/${replyModal.reviewId}/reply`, {
        message: replyModal.message.trim(),
      });
      if (res.data?.success) {
        toast.success("Merchant reply posted successfully!");
        setReplyModal({ open: false, reviewId: null, reviewItem: null, message: "", submitting: false });
        fetchVendorReviews();
      }
    } catch (error) {
      console.error("Error posting review reply:", error);
      toast.error(error.response?.data?.message || "Failed to post reply");
    } finally {
      setReplyModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Delete vendor reply
  const handleDeleteReply = async (reviewId) => {
    if (!window.confirm("Are you sure you want to remove your merchant response?")) return;
    try {
      const res = await api.delete(`/vendor/portal/reviews/${reviewId}/reply`);
      if (res.data?.success) {
        toast.success("Merchant response removed");
        fetchVendorReviews();
      }
    } catch (error) {
      console.error("Delete review reply error:", error);
      toast.error(error.response?.data?.message || "Failed to delete reply");
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={star <= rating ? "text-[#FFB800] fill-[#FFB800]" : "text-slate-200 fill-slate-100"}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 min-h-screen bg-slate-50/50 font-sans">
      <PageCard>
        <div className="flex flex-col gap-6 p-6 bg-white w-full">
          {/* Header & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                <Star className="text-[#FFB800] fill-[#FFB800]" size={28} />
                Customer Reviews & Store Feedback
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Inspect customer ratings, review attached photos, and build merchant trust with official store replies.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-orange-50 text-[#fe4a03] px-4 py-2 rounded-xl font-bold text-xs sm:text-sm border border-orange-200 self-start sm:self-center shadow-2xs">
              <span>Total Reviews:</span>
              <span className="text-base font-extrabold text-[#fe4a03]">{stats.totalReviews || reviews.length}</span>
            </div>
          </div>

          {/* Star Rating Breakdown Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
            {/* Score Overview */}
            <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-slate-200/80">
              <span className="text-5xl font-black text-slate-900 tracking-tight">
                {Number(stats.avgRating || 0).toFixed(1)}
              </span>
              <div className="flex items-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={18}
                    className={
                      s <= Math.round(stats.avgRating || 0)
                        ? "text-[#FFB800] fill-[#FFB800]"
                        : "text-slate-200 fill-slate-100"
                    }
                  />
                ))}
              </div>
              <p className="text-xs font-semibold text-slate-500">
                Based on {stats.totalReviews || 0} customer reviews
              </p>
            </div>

            {/* Star Distribution Bars */}
            <div className="md:col-span-2 space-y-2 justify-center flex flex-col">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats.ratingCounts?.[stars] || 0;
                const percentage =
                  stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
                return (
                  <div key={stars} className="flex items-center gap-3 text-xs">
                    <span className="w-12 font-bold text-slate-700 flex items-center gap-1">
                      {stars} <Star size={12} className="text-[#FFB800] fill-[#FFB800]" />
                    </span>
                    <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#fe4a03] h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-slate-400 font-medium">{percentage}%</span>
                    <span className="w-10 text-right font-bold text-slate-800">({count})</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by product, customer, or review..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03] shadow-2xs font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Rating Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              {[
                { id: "all", label: "All Stars" },
                { id: "5", label: "5 ★" },
                { id: "4", label: "4 ★" },
                { id: "3", label: "3 ★" },
                { id: "2", label: "2 ★" },
                { id: "1", label: "1 ★" },
              ].map((pill) => {
                const active = selectedRating === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => {
                      setSelectedRating(pill.id);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                      active
                        ? "bg-[#fe4a03] text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#fe4a03] mb-2" />
                Loading product reviews...
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-medium border border-dashed border-slate-200 rounded-2xl">
                No customer reviews found matching your filter criteria.
              </div>
            ) : (
              filteredReviews.map((r) => {
                const productName = r.product?.title || "Product";
                const prodImg =
                  r.variant?.mainImage?.url ||
                  r.product?.images?.[0]?.url ||
                  r.product?.images?.[0] ||
                  "";

                return (
                  <div
                    key={r._id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      {/* Product reference */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                          {prodImg ? (
                            <img
                              src={typeof prodImg === "string" ? prodImg : prodImg.url}
                              alt={productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package size={18} className="m-auto text-slate-400 mt-2.5" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">{productName}</p>
                          <p className="text-[11px] text-slate-400">
                            Reviewed on {new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>

                      {/* Customer info & Rating */}
                      <div className="flex items-center gap-4">
                        {renderStars(r.rating || 5)}
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                          <User size={13} className="text-slate-400" />
                          <span>{r.user?.username || r.user?.name || "Customer"}</span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 size={10} /> Verified
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Commentary */}
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                        {r.review || r.comment || "No written review text provided."}
                      </p>

                      {/* Review Photos */}
                      {r.images && r.images.length > 0 && (
                        <div className="flex gap-2 pt-1">
                          {r.images.map((img, i) => {
                            const imgUrl = typeof img === "string" ? img : img.url;
                            return (
                              <div
                                key={i}
                                onClick={() => setSelectedImageModal(imgUrl)}
                                className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer hover:opacity-90"
                              >
                                <img src={imgUrl} alt="Review attachment" className="w-full h-full object-cover" />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Store Reply if present */}
                    {r.vendorReply?.message && (
                      <div className="mt-3 p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#fe4a03] flex items-center gap-1.5">
                            <CornerDownRight size={13} />
                            Store Response
                          </span>
                          <button
                            onClick={() => handleDeleteReply(r._id)}
                            className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                          >
                            Delete Reply
                          </button>
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed">{r.vendorReply.message}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {!r.vendorReply?.message && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() =>
                            setReplyModal({
                              open: true,
                              reviewId: r._id,
                              reviewItem: r,
                              message: "",
                              submitting: false,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#fe4a03] border border-orange-100 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <MessageSquare size={13} />
                          Reply to Customer
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            itemsPerPage={10}
          />
        </div>
      </PageCard>

      {/* Reply Composer Modal */}
      {replyModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setReplyModal({ ...replyModal, open: false })}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-slate-900">Reply to Review</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Posting official merchant response to {replyModal.reviewItem?.product?.title || "Product"}
              </p>
            </div>

            {/* Original review snippet */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Customer commentary:
              </span>
              <p className="text-xs text-slate-700 italic line-clamp-2">
                "{replyModal.reviewItem?.review || "Rating provided without text."}"
              </p>
            </div>

            <form onSubmit={handleSaveReply} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Your Store Message *
                </label>
                <textarea
                  rows={4}
                  placeholder="Thank the customer or address their concern constructively..."
                  value={replyModal.message}
                  onChange={(e) => setReplyModal({ ...replyModal, message: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#fe4a03] focus:ring-2 focus:ring-[#fe4a03]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReplyModal({ ...replyModal, open: false })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={replyModal.submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#fe4a03] hover:bg-[#e03f00] text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-[#fe4a03]/20 cursor-pointer"
                >
                  <Send size={13} />
                  {replyModal.submitting ? "Posting..." : "Post Reply"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox for review photos */}
      {selectedImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedImageModal(null)}
        >
          <div className="relative max-w-xl max-h-[85vh] overflow-hidden rounded-2xl bg-black">
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            <img src={selectedImageModal} alt="Review Photo" className="w-full h-auto object-contain max-h-[80vh]" />
          </div>
        </div>
      )}
    </div>
  );
}
