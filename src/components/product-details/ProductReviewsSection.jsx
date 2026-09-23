import React, { useState, useEffect } from "react";
import { Star, ThumbsUp, ShieldCheck, Edit3, Trash2, Camera, X, CheckCircle2, MessageSquare, User, Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import WriteReviewModal from "./WriteReviewModal";

const ProductReviewsSection = ({ product, onReviewsUpdate, onVariantChange }) => {
  const { user, getAuthHeaders } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const idStr = String(product?._id || product?.id || "");
  const productId = idStr.includes("-") ? idStr.split("-")[0] : idStr;

  const fetchReviews = async () => {
    if (!productId) return;
    setIsLoading(true);
    try {
      const res = await axios.get(`/reviews/${productId}?limit=50`);
      if (res.data?.success) {
        setReviews(res.data.data.reviews || []);
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;
    try {
      const res = await axios.delete(`/reviews/${reviewId}`, {
        headers: getAuthHeaders(),
      });
      if (res.data?.success) {
        toast.success("Review deleted successfully");
        setReviews((prev) => prev.filter((r) => r._id !== reviewId));
        if (onReviewsUpdate) onReviewsUpdate();
      }
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  const myUserId = user?._id || user?.userId || user?.id;
  const userExistingReview = reviews.find(
    (r) => (r.user?._id || r.user || "") === myUserId || (r.user?.id === myUserId)
  );

  // Calculate stats
  const totalReviews = reviews.length;
  const averageScore =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1).replace(/\.0$/, '')
      : "0";

  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      starCounts[r.rating] = (starCounts[r.rating] || 0) + 1;
    }
  });

  // Extract all user uploaded photos across all reviews
  const allReviewPhotos = reviews.flatMap((r) =>
    (r.images || []).map((img) => ({
      url: img.url,
      author: r.user?.username || "Customer",
      rating: r.rating,
      comment: r.review || "",
    }))
  );

  return (
    <div id="product-reviews-section" className="mt-8 pt-8 border-t border-[#eaeaec]">
      {/* Header */}
      <div className="mb-8">
        <h3 className="text-[20px] font-extrabold text-[#282c3f] tracking-wide flex items-center gap-2">
          Customer Reviews & Ratings
        </h3>
        <p className="text-[13.5px] text-[#7e818c] mt-1">
          Real feedback and photos from verified purchasers
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
        </div>
      ) : totalReviews === 0 ? (
        /* Zero State */
        <div className="bg-gray-50/70 border border-dashed border-gray-300 rounded-xl p-10 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-white rounded-full shadow-xs flex items-center justify-center text-[#FFB800] mb-3 border border-gray-100">
            <Star size={30} className="fill-[#FFB800]" />
          </div>
          <h4 className="text-[17px] font-bold text-[#282c3f] mb-1">
            No reviews and ratings yet for this product
          </h4>
          <p className="text-[14px] text-[#7e818c] max-w-md">
            There are currently no ratings or reviews available. If you have purchased this item, be the first to rate and share your feedback from your Orders section!
          </p>
        </div>
      ) : (
        <>
          {/* Customer Review Photos Gallery */}
          {allReviewPhotos.length > 0 && (
            <div className="mb-8 bg-gray-50/50 p-5 rounded-xl border border-gray-100">
              <h4 className="text-[15px] font-bold text-[#282c3f] mb-3.5 flex items-center gap-2">
                <Camera size={18} className="text-[#4F46E5]" />
                <span>Customer Photos ({allReviewPhotos.length})</span>
              </h4>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {allReviewPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImage(photo)}
                    className="w-24 h-32 rounded-lg overflow-hidden border border-gray-200/80 bg-white shrink-0 cursor-pointer relative group shadow-2xs hover:shadow-md transition-all"
                  >
                    <img
                      src={photo.url}
                      alt="Customer review"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                     loading="lazy" decoding="async" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-0.5">
                      <Star size={9} className="fill-[#FFB800] text-[#FFB800]" />
                      {photo.rating}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rating Summary Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 bg-white border border-[#eaeaec] rounded-xl mb-8 shadow-2xs items-center">
            {/* Left: Overall Score */}
            <div className="md:col-span-5 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
              <div className="text-[34px] font-black text-[#282c3f] leading-none mb-1.5">
                {averageScore} <span className="text-[18px] font-normal text-[#7e818c]">/ 5</span>
              </div>
              <div className="flex items-center gap-1 mb-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={17}
                    className={`stroke-[1.5] ${
                      s <= Math.round(averageScore)
                        ? "fill-[#FFB800] text-[#FFB800]"
                        : "text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <div className="text-[12px] font-bold text-[#535766]">
                Based on {totalReviews} {totalReviews === 1 ? "Verified Review" : "Verified Reviews"}
              </div>
              <div className="text-[11px] text-[#4F46E5] font-bold bg-[#EEF2FF] px-2.5 py-1 rounded-full border border-indigo-200 mt-2.5 flex items-center justify-center gap-1 whitespace-nowrap shadow-2xs">
                <CheckCircle2 size={12} className="text-[#4F46E5] shrink-0" />
                <span>100% Verified Authentic</span>
              </div>
            </div>

            {/* Right: Star Distribution Bars */}
            <div className="md:col-span-7 space-y-2 pl-0 md:pl-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = starCounts[stars] || 0;
                const percent = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                const barColor = {
                  5: "bg-[#48873B]", // Excellent - Deep forest green
                  4: "bg-[#6AB247]", // Good - Lighter leaf green
                  3: "bg-[#F79D14]", // Average - Warm golden amber
                  2: "bg-[#E33B18]", // Poor - Orange-red
                  1: "bg-[#8B101C]", // Very Poor - Deep burgundy/maroon
                }[stars] || "bg-[#FFB800]";

                return (
                  <div key={stars} className="flex items-center gap-2 text-[13px] text-[#535766]">
                    <span className="w-6 font-bold text-[#282c3f] flex items-center justify-center gap-1 shrink-0">
                      {stars} <Star size={13} className="fill-[#FFB800] text-[#FFB800]" />
                    </span>
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="w-[72px] flex items-center justify-start gap-1 shrink-0 text-left">
                      <span className="font-bold text-gray-700 w-5 inline-block text-left">{count}</span>
                      <span className="text-[11px] font-normal text-gray-400 text-left inline-block">({percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review Cards Feed */}
          <div className="space-y-6">
            {reviews.map((rev) => {
              const isOwner = myUserId && ((rev.user?._id || rev.user || "") === myUserId || rev.user?.id === myUserId);
              let colorName = "";
              let variantParts = [];
              if (rev.variant && Array.isArray(rev.variant.attributes)) {
                rev.variant.attributes.forEach((a) => {
                  const optName = a?.option?.displayName || a?.option?.storedValue || a?.value;
                  const attrName = a?.attribute?.name || a?.name;
                  if (optName) {
                    if (attrName?.toLowerCase() === "color") {
                      colorName = optName;
                    }
                    variantParts.push(attrName ? `${attrName}: ${optName}` : optName);
                  }
                });
              }
              const displayVariant = colorName ? `Color: ${colorName}` : (variantParts.join(" • ") || (rev.variant?.sku ? `SKU: ${rev.variant.sku}` : null));
              const reviewVariantId = rev.variant?._id || (typeof rev.variant === "string" ? rev.variant : null);

              return (
                <div
                  key={rev._id}
                  className="p-6 bg-white border border-[#eaeaec] rounded-xl hover:border-gray-300 transition-all shadow-xs relative"
                >
                  {/* Review Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#eef2ff] text-[#4F46E5] flex items-center justify-center font-black text-[16px] uppercase shrink-0 border border-indigo-100 shadow-2xs">
                        {(rev.user?.username || "C")[0]}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-bold text-[#282c3f]">
                            {rev.user?.username || "Verified Customer"}
                          </span>
                          {rev.verifiedBuyer && (
                            <span className="inline-flex items-center gap-1 bg-[#EEF2FF] text-[#4F46E5] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                              <ShieldCheck size={13} className="text-[#4F46E5]" />
                              Verified Buyer
                            </span>
                          )}
                          {displayVariant && (
                            <button
                              type="button"
                              onClick={() => {
                                if (reviewVariantId && onVariantChange) {
                                  onVariantChange(reviewVariantId);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }
                              }}
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-all ${
                                reviewVariantId && onVariantChange
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 cursor-pointer"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              }`}
                              title={reviewVariantId && onVariantChange ? "Click to view this reviewed variant" : undefined}
                            >
                              <span>{displayVariant}</span>
                            </button>
                          )}
                        </div>
                        <span className="text-[12px] text-[#7e818c]">
                          Reviewed on{" "}
                          {new Date(rev.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-[#282c3f] text-white px-2.5 py-1 rounded font-bold text-[13px] shadow-2xs">
                        <span>{rev.rating}</span>
                        <Star size={13} className="fill-[#FFB800] text-[#FFB800]" />
                      </div>

                      {/* Author Edit/Delete Controls */}
                      {isOwner && (
                        <div className="flex items-center gap-1 ml-2 border-l border-gray-200 pl-3">
                          <button
                            onClick={() => {
                              setEditingReview(rev);
                              setIsWriteModalOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-[#4F46E5] rounded hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Edit Review"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(rev._id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Delete Review"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comment Content */}
                  {rev.review && (
                    <p className="text-[14.5px] text-[#334155] leading-relaxed whitespace-pre-wrap mb-4 font-normal">
                      {rev.review}
                    </p>
                  )}

                  {/* Attached Photos */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-[#7e818c] block mb-2">
                        Attached Photos ({rev.images.length})
                      </span>
                      <div className="flex flex-wrap gap-3">
                        {rev.images.map((img, idx) => (
                          <div
                            key={idx}
                            onClick={() =>
                              setSelectedImage({
                                url: img.url,
                                author: rev.user?.username || "Customer",
                                rating: rev.rating,
                                comment: rev.review || "",
                              })
                            }
                            className="w-16 h-20 rounded-lg overflow-hidden border border-gray-200 cursor-pointer shadow-2xs hover:shadow-md hover:scale-[1.03] transition-all"
                          >
                            <img
                              src={img.url}
                              alt="Review attachment"
                              className="w-full h-full object-cover"
                             loading="lazy" decoding="async" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Write/Edit Review Modal */}
      <WriteReviewModal
        isOpen={isWriteModalOpen}
        onClose={() => {
          setIsWriteModalOpen(false);
          setEditingReview(null);
        }}
        product={product}
        existingReview={editingReview}
        onSuccess={() => {
          fetchReviews();
          if (onReviewsUpdate) onReviewsUpdate();
        }}
      />

      {/* Full Screen Photo Viewer Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-xl overflow-hidden max-w-2xl w-full flex flex-col md:flex-row shadow-2xl relative border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 z-10 p-1 bg-black/60 text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="bg-slate-950 flex items-center justify-center w-full md:w-3/5 aspect-[3/4] md:aspect-auto max-h-[70vh]">
              <img
                src={selectedImage.url}
                alt="Customer feedback full"
                className="w-full h-full object-contain max-h-[70vh]"
               loading="lazy" decoding="async" />
            </div>

            <div className="p-6 w-full md:w-2/5 flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">
                  <div className="font-bold text-[15px] text-[#282c3f]">
                    {selectedImage.author}'s Photo
                  </div>
                  <div className="flex items-center gap-1 bg-[#282c3f] text-white px-2 py-0.5 rounded text-xs font-bold">
                    <span>{selectedImage.rating}</span>
                    <Star size={11} className="fill-[#FFB800] text-[#FFB800]" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed italic max-h-64 overflow-y-auto">
                  "{selectedImage.comment || "No commentary provided."}"
                </p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="w-full mt-6 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-sm rounded-lg transition-colors cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductReviewsSection;
