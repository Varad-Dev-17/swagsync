import React, { useState, useEffect, useMemo } from "react";
import PageCard from "../../../components/admin/ui/PageCard";
import { Star, Trash2, ShieldCheck, Search, Filter, Eye, Loader2, X, AlertCircle, ExternalLink, Camera } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { Link } from "react-router-dom";

const Reviews = () => {
  const { getAuthHeaders } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImageModal, setSelectedImageModal] = useState(null);

  const fetchAdminReviews = async (ratingFilter = "all") => {
    setIsLoading(true);
    try {
      let url = "/admin/reviews?limit=100";
      if (ratingFilter !== "all") {
        url += `&rating=${ratingFilter}`;
      }
      const res = await axios.get(url, { headers: getAuthHeaders() });
      if (res.data?.success) {
        setReviews(res.data.data.reviews || []);
      }
    } catch (error) {
      console.error("Error fetching admin reviews:", error);
      toast.error("Failed to load customer reviews");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminReviews(selectedRating);
  }, [selectedRating]);

  const handleDeleteReview = async (reviewId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this customer review? This will automatically recalculate the affected product's star rating and count."
      )
    ) {
      return;
    }

    try {
      const res = await axios.delete(`/admin/reviews/${reviewId}`, {
        headers: getAuthHeaders(),
      });
      if (res.data?.success) {
        toast.success("Review deleted and product ratings recalculated");
        setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error(error.response?.data?.message || "Failed to delete review");
    }
  };

  // Filter by Search Term
  const filteredReviews = useMemo(() => {
    if (!searchTerm.trim()) return reviews;
    const lower = searchTerm.toLowerCase();
    return reviews.filter(
      (r) =>
        r.product?.title?.toLowerCase().includes(lower) ||
        r.user?.username?.toLowerCase().includes(lower) ||
        r.user?.email?.toLowerCase().includes(lower) ||
        r.review?.toLowerCase().includes(lower)
    );
  }, [reviews, searchTerm]);

  return (
    <PageCard>
      <div className="flex flex-col gap-6 p-6 bg-white w-full">
        {/* Header & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Star className="text-[#FFB800] fill-[#FFB800]" size={28} />
              Customer Reviews & Moderation
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Inspect user-submitted feedback, verify photo uploads, and moderate defamatory or spam ratings across your product catalog.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-indigo-50 text-[#4F46E5] px-4 py-2 rounded-none font-bold text-sm border border-indigo-100 self-start sm:self-center shadow-2xs">
            <span>Total Reviews:</span>
            <span className="text-base font-black text-indigo-700">{reviews.length}</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-50/70 p-4 rounded-none border border-slate-200/80">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by product name, customer, or commentary..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-none text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] shadow-2xs"
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
                  onClick={() => setSelectedRating(pill.id)}
                  className={`px-4 py-2 rounded-none font-bold text-xs transition-all shrink-0 cursor-pointer shadow-2xs ${
                    active
                      ? "bg-[#1E1B4B] text-white shadow-sm"
                      : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reviews Data Table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-28">
            <Loader2 className="w-10 h-10 text-[#4F46E5] animate-spin" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-slate-50 rounded-none border border-slate-200/80 my-4">
            <AlertCircle size={48} className="text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No customer reviews found</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-4">
              There are no reviews matching your search criteria or star rating filter.
            </p>
            {(searchTerm || selectedRating !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedRating("all");
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-none transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-none shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-extrabold text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="py-4 px-4 min-w-[220px]">Product Info</th>
                  <th className="py-4 px-4 min-w-[180px]">Customer & Order</th>
                  <th className="py-4 px-4 text-center w-28">Score</th>
                  <th className="py-4 px-4 min-w-[280px]">Customer Review</th>
                  <th className="py-4 px-4 text-center w-36">Attached Photos</th>
                  <th className="py-4 px-4 text-right w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredReviews.map((rev) => {
                  const productImg =
                    rev.variant?.mainImage?.url ||
                    rev.product?.images?.[0]?.url ||
                    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><rect fill='%23f1f5f9' width='80' height='80'/><path fill='%23cbd5e1' d='M25 35a8 8 0 1016 0 8 8 0 00-16 0zm35 28H20a4 4 0 01-3-6l12-16a4 4 0 016 0l5 7 8-10a4 4 0 016 0l12 16a4 4 0 01-3 9z'/></svg>";
                  const prodSlugOrId = rev.product?.slug || rev.product?._id || rev.product;
                  const variantId = rev.variant?._id || (typeof rev.variant === "string" ? rev.variant : null);
                  const productVariantUrl = prodSlugOrId
                    ? `/product/${prodSlugOrId}${variantId ? `?variant=${variantId}` : ""}`
                    : "#";

                  // Extract human-readable variant attributes (e.g. Color: Green, Size: M)
                  const variantDetails = [];
                  if (rev.variant && Array.isArray(rev.variant.attributes)) {
                    rev.variant.attributes.forEach((attr) => {
                      const attrName = attr.attribute?.name || attr.name;
                      const optVal = attr.option?.displayName || attr.option?.storedValue || attr.value;
                      if (optVal) {
                        variantDetails.push(attrName ? `${attrName}: ${optVal}` : optVal);
                      }
                    });
                  }
                  const variantLabel =
                    variantDetails.length > 0
                      ? variantDetails.join(" • ")
                      : rev.variant?.sku
                      ? `SKU: ${rev.variant.sku}`
                      : rev.variant
                      ? "Reviewed Variant"
                      : null;

                  // Score Styling
                  let scoreBadgeBg = "bg-emerald-600";
                  if (rev.rating <= 2) scoreBadgeBg = "bg-rose-600";
                  else if (rev.rating === 3) scoreBadgeBg = "bg-amber-600";

                  return (
                    <tr key={rev._id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Product Column */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-start gap-3">
                          <Link
                            to={productVariantUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-14 h-18 rounded-none border border-slate-200 overflow-hidden shrink-0 bg-white shadow-2xs block relative group/thumb hover:border-[#4F46E5] hover:shadow-sm transition-all cursor-pointer"
                            title="Click to view reviewed variant"
                          >
                            <img
                              src={productImg}
                              alt="Product thumbnail"
                              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                              loading="lazy"
                              decoding="async"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/10 transition-colors" />
                          </Link>
                          <div className="min-w-0">
                            <Link
                              to={productVariantUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-slate-900 hover:text-[#4F46E5] line-clamp-2 transition-colors inline-flex items-center gap-1 group/link"
                              title="Click to view reviewed variant"
                            >
                              <span>{rev.product?.title || "Deleted Product"}</span>
                              <ExternalLink size={12} className="opacity-0 group-hover/link:opacity-100 transition-opacity text-[#4F46E5] shrink-0" />
                            </Link>
                            <span className="text-xs font-mono text-slate-400 block mt-0.5">
                              ID: {rev.product?.productId || String(rev.product?._id || rev.product || "")}
                            </span>
                            {variantLabel && (
                              <Link
                                to={productVariantUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-colors w-fit group/var cursor-pointer"
                                title="Click to view this reviewed variant"
                              >
                                <span>{variantLabel}</span>
                                <ExternalLink size={10} className="text-indigo-500 opacity-70 group-hover/var:opacity-100 shrink-0" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Customer Column */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-slate-900">
                          {rev.user?.username || "Verified Customer"}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 mb-1.5 truncate max-w-[160px]">
                          {rev.user?.email || "No Email"}
                        </div>
                        {/* {rev.verifiedBuyer ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck size={13} className="text-emerald-600" />
                            Verified Buyer
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-none text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Unverified Order
                          </span>
                        )} */}
                        <div className="text-[11px] text-slate-400 mt-1.5">
                          {new Date(rev.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      {/* Rating Score Column */}
                      <td className="py-4 px-4 align-top text-center">
                        <span className={`inline-flex items-center justify-center gap-1 text-white font-black px-3 py-1 rounded-none shadow-2xs text-xs ${scoreBadgeBg}`}>
                          <span>{rev.rating}</span>
                          <Star size={12} className="fill-white text-white" />
                        </span>
                      </td>

                      {/* Review Text Column */}
                      <td className="py-4 px-4 align-top">
                        {rev.review ? (
                          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-normal max-h-36 overflow-y-auto pr-2">
                            {rev.review}
                          </p>
                        ) : (
                          <span className="italic text-slate-400 text-xs">
                            No commentary provided.
                          </span>
                        )}
                      </td>

                      {/* Attached Photos Column */}
                      <td className="py-4 px-4 align-top text-center">
                        {rev.images && rev.images.length > 0 ? (
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {rev.images.map((img, idx) => (
                              <div
                                key={idx}
                                onClick={() =>
                                  setSelectedImageModal({
                                    url: img.url,
                                    author: rev.user?.username || "Customer",
                                    productTitle: rev.product?.title || "Product",
                                    rating: rev.rating,
                                    comment: rev.review || "",
                                    createdAt: rev.createdAt,
                                  })
                                }
                                className="w-10 h-12 rounded-none border border-slate-300 overflow-hidden cursor-pointer hover:scale-110 hover:shadow-md transition-all relative group/thumb bg-white"
                                title="Click to inspect photo"
                              >
                                <img
                                  src={img.url}
                                  alt="Customer photo"
                                  className="w-full h-full object-cover"
                                 loading="lazy" decoding="async" />
                                <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-colors flex items-center justify-center">
                                  <Eye size={14} className="text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 font-mono">
                            No Photos
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 align-top text-right">
                        <button
                          onClick={() => handleDeleteReview(rev._id)}
                          className="p-2 text-rose-500 hover:text-white hover:bg-rose-600 rounded-none transition-all duration-200 cursor-pointer border border-transparent hover:border-rose-700 shadow-2xs"
                          title="Delete / Remove Review"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Photo Inspector Zoom Modal */}
        {selectedImageModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setSelectedImageModal(null)}
          >
            <div
              className="bg-white rounded-none overflow-hidden max-w-2xl w-full flex flex-col md:flex-row shadow-2xl relative border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImageModal(null)}
                className="absolute top-3 right-3 z-10 p-1.5 bg-black/70 text-white hover:bg-slate-800 rounded-none transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="bg-slate-950 flex items-center justify-center w-full md:w-3/5 p-4 max-h-[75vh]">
                <img
                  src={selectedImageModal.url}
                  alt="Inspection view"
                  className="w-full h-full object-contain max-h-[70vh] rounded-none"
                 loading="lazy" decoding="async" />
              </div>

              <div className="p-6 w-full md:w-2/5 flex flex-col justify-between bg-white">
                <div>
                  <div className="border-b border-slate-100 pb-3 mb-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Photo Inspection
                    </div>
                    <div className="font-extrabold text-base text-slate-900 mt-0.5 line-clamp-2">
                      {selectedImageModal.productTitle}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 mb-2">
                    Uploaded by <strong className="text-slate-800">{selectedImageModal.author}</strong>
                  </div>

                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="bg-slate-900 text-white text-xs font-bold px-2 py-0.5 rounded-none flex items-center gap-1">
                      {selectedImageModal.rating} <Star size={11} className="fill-white text-white" />
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(selectedImageModal.createdAt).toLocaleDateString("en-GB")}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-none border border-slate-200/80 text-xs text-slate-700 italic max-h-48 overflow-y-auto">
                    "{selectedImageModal.comment || "No commentary provided."}"
                  </div>
                </div>

                <button
                  onClick={() => setSelectedImageModal(null)}
                  className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-none transition-colors cursor-pointer shadow-sm"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageCard>
  );
};

export default Reviews;
