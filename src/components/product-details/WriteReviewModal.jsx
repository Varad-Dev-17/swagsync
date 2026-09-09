import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Star, ImagePlus, X, Loader2, CheckCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const RATING_TOOLTIPS = {
  1: "Very Dissatisfied",
  2: "Poor",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

const WriteReviewModal = ({
  isOpen,
  onClose,
  product,
  variant = null,
  existingReview = null,
  onSuccess,
}) => {
  const { user, getAuthHeaders } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.review || existingReview?.comment || "");
  const [images, setImages] = useState(existingReview?.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (existingReview) {
        setRating(existingReview.rating || 0);
        setComment(existingReview.review || existingReview.comment || "");
        setImages(existingReview.images || []);
      } else {
        setRating(0);
        setComment("");
        setImages([]);
      }
      setHoverRating(0);
    }
  }, [isOpen, existingReview]);

  if (!isOpen || !product) return null;

  const idStr = String(product._id || product.id || "");
  const productId = idStr.includes("-") ? idStr.split("-")[0] : idStr;
  const activeVariant = variant || existingReview?.variant;
  const variantImage = typeof activeVariant === 'object' ? (activeVariant?.mainImage?.url || activeVariant?.image || null) : null;
  const productImage = variantImage || product.images?.[0]?.url || product.image || product.productImage || "";

  let colorName = "";
  if (typeof activeVariant === 'object' && Array.isArray(activeVariant?.attributes)) {
    const colAttr = activeVariant.attributes.find(
      (a) => a?.attribute?.name?.toLowerCase() === "color" || a?.name?.toLowerCase() === "color"
    );
    if (colAttr) colorName = colAttr.option?.displayName || colAttr.value || colAttr.name || "";
  }

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (images.length + files.length > 5) {
      toast.error("Maximum 5 photos allowed per review");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    setIsUploading(true);
    try {
      const response = await axios.post(
        "/admin/upload/user-multiple",
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data?.success) {
        setImages([...images, ...response.data.data]);
        toast.success("Photos uploaded successfully!");
      }
    } catch (error) {
      console.error("Photo upload failed:", error);
      toast.error(
        error.response?.data?.message || "Failed to upload photos. Please try again."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      toast.error("Please tap a star rating from 1 to 5");
      return;
    }

    if (!user) {
      toast.error("Please log in to submit a review");
      return;
    }

    setIsSubmitting(true);
    try {
      const activeVar = variant || existingReview?.variant;
      const variantId = typeof activeVar === 'object' ? activeVar?._id : (activeVar || null);
      const payload = {
        rating,
        review: comment.trim(),
        images,
        variantId,
      };

      let response;
      if (existingReview?._id) {
        response = await axios.put(
          `/reviews/${existingReview._id}`,
          payload,
          { headers: getAuthHeaders() }
        );
      } else {
        response = await axios.post(`/reviews/${productId}`, payload, {
          headers: getAuthHeaders(),
        });
      }

      if (response.data?.success) {
        toast.success(
          existingReview ? "Review updated!" : "Thank you! Your review has been published."
        );
        if (onSuccess) onSuccess(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(
        error.response?.data?.message || "Failed to submit review. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeScore = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: <-- write a review for */}
        <div className="px-6 py-4 border-b border-[#eaeaec] flex items-center gap-3 bg-gray-50/70">
          <button
            type="button"
            onClick={onClose}
            className="p-1 -ml-1 text-gray-600 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft size={22} />
          </button>
          <span className="text-[17px] font-bold text-[#282c3f]">
            {existingReview ? "Edit your review for" : "Write a review for"}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh] flex flex-col gap-6">
          {/* Centered Product Preview: delivered product image & details(name, brand) */}
          <div className="flex flex-col items-center justify-center text-center bg-gray-50/50 p-4 rounded-lg border border-gray-100">
            {productImage && (
              <div className="w-24 h-28 mb-3 overflow-hidden rounded-md border border-gray-200 shadow-sm bg-white flex items-center justify-center">
                <img
                  src={productImage}
                  alt={product.title || "Product Image"}
                  className="w-full h-full object-cover"
                 loading="lazy" decoding="async" />
              </div>
            )}
            <div className="text-[12px] font-bold uppercase tracking-wider text-[#7e818c]">
              {product.brand?.name || product.brand || "SWAGSYNC"}
            </div>
            <h4 className="text-[15px] font-extrabold text-[#282c3f] mt-0.5 line-clamp-2">
              {product.title || product.productName || "Product Title"}
            </h4>
            {colorName && (
              <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs">
                Color: {colorName}
              </span>
            )}
          </div>

          {/* Interactive Rating Strip: empty 5 stars */}
          <div className="flex flex-col items-center justify-center py-2">
            <label className="text-[14px] font-bold text-[#282c3f] mb-2">
              How would you rate this product? <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= activeScore;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none transition-transform active:scale-125 cursor-pointer hover:scale-110"
                  >
                    <Star
                      size={36}
                      className={`transition-colors duration-150 ${
                        isFilled
                          ? "fill-[#FFB800] text-[#FFB800] drop-shadow-[0_2px_4px_rgba(255,184,0,0.3)]"
                          : "text-gray-300 stroke-[1.5] hover:text-[#FFB800]"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <div className="h-6 mt-2 flex items-center justify-center">
              {activeScore > 0 ? (
                <span className="text-[13.5px] font-semibold text-[#4F46E5] bg-[#eef2ff] px-3 py-0.5 rounded-full animate-in fade-in duration-150">
                  {RATING_TOOLTIPS[activeScore]}
                </span>
              ) : (
                <span className="text-[12.5px] text-gray-400">
                  Tap a star to score
                </span>
              )}
            </div>
          </div>

          {/* Written Commentary: |text area| */}
          <div>
            <label className="block text-[13.5px] font-bold text-[#282c3f] mb-1.5">
              Write your review <span className="text-[#7e818c] font-normal">(Optional)</span>
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like or dislike? How was the fabric quality, sizing, and comfort?"
              className="w-full rounded-lg border border-gray-300 p-3.5 text-[14px] text-[#282c3f] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all resize-none shadow-xs"
            />
          </div>

          {/* Photo Upload: |image upload| */}
          <div>
            <label className="block text-[13.5px] font-bold text-[#282c3f] mb-1.5">
              Attach Photos <span className="text-[#7e818c] font-normal">(Optional, up to 5)</span>
            </label>

            {/* Existing Thumbnail Previews */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-3">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="relative w-16 h-16 border border-gray-200 rounded-lg overflow-hidden shadow-xs bg-gray-50 group"
                  >
                    <img
                      src={img.url}
                      alt={`Upload preview ${index + 1}`}
                      className="w-full h-full object-cover"
                     loading="lazy" decoding="async" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full p-0.5 opacity-90 hover:opacity-100 hover:bg-red-600 transition-all shadow-sm cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Dropzone */}
            {images.length < 5 && (
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed border-gray-300 rounded-lg py-6 px-4 flex flex-col items-center justify-center text-center transition-all ${
                  isUploading
                    ? "opacity-60 cursor-not-allowed bg-gray-50"
                    : "hover:border-[#4F46E5] hover:bg-[#4F46E5]/[0.02] cursor-pointer bg-white"
                }`}
              >
                {isUploading ? (
                  <Loader2 className="w-7 h-7 text-[#4F46E5] animate-spin mb-2" />
                ) : (
                  <div className="w-10 h-10 bg-[#eef2ff] text-[#4F46E5] rounded-full flex items-center justify-center mb-2 shadow-xs">
                    <ImagePlus className="w-5 h-5" />
                  </div>
                )}
                <p className="text-[14px] font-bold text-[#282c3f]">
                  {isUploading ? "Uploading photos..." : "Click to attach photos"}
                </p>
                <p className="text-[12px] text-[#7e818c] mt-0.5">
                  Show others how it looks on you (PNG, JPG, WEBP)
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Submit Review Button */}
          <button
            type="submit"
            disabled={isSubmitting || isUploading || !rating}
            className={`w-full py-3.5 rounded-lg font-bold text-[15px] text-white flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
              isSubmitting || isUploading || !rating
                ? "bg-gray-300 text-gray-500 shadow-none cursor-not-allowed"
                : "bg-[#1E1B4B] hover:bg-[#312e81] hover:shadow-lg active:scale-[0.99]"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {existingReview ? "Updating Review..." : "Publishing Review..."}
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                {existingReview ? "Update Review" : "Submit Review"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WriteReviewModal;
