import React from 'react';
import { ExternalLink, Package, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ReturnHeroProductCard = ({ returnRequest, order = null }) => {
  if (!returnRequest) return null;

  const isExchange = returnRequest.type === "exchange";
  const status = String(returnRequest.status || "pending").toLowerCase();
  const isRejected = status === "rejected";

  // Product & Variant details extraction
  const product = returnRequest.product || {};
  const origVariant = returnRequest.originalVariant || {};

  // Extract Brand
  const brandName = typeof product.brand === "object" && product.brand?.name 
    ? product.brand.name 
    : (typeof product.brand === "string" ? product.brand : "Brand");

  const productTitle = product.title || product.name || "Product Title";
  const productId = product._id || product.id || "";
  const productSlug = product.slug || productId;

  // Variant Attributes
  let color = origVariant.color || "";
  let size = origVariant.size || "";
  if (Array.isArray(origVariant.attributes)) {
    origVariant.attributes.forEach(attr => {
      if (!attr) return;
      const name = String(attr.attribute?.name || attr.name || "").toLowerCase();
      const val = attr.option?.displayName || attr.option?.storedValue || attr.option?.value || attr.value || "";
      if (name.includes("color") && val) color = val;
      if (name.includes("size") && val) size = val;
    });
  }

  const quantity = returnRequest.quantity || 1;
  const price = returnRequest.refundAmount || returnRequest.originalPrice || origVariant.price || product.price || product.sellingPrice || 999;

  // Product Image
  const productImage = origVariant.mainImage?.url 
    || (typeof origVariant.mainImage === "string" ? origVariant.mainImage : null)
    || product.images?.[0]?.url 
    || (typeof product.images?.[0] === "string" ? product.images[0] : null)
    || "/placeholder-product.png";

  // Contextual alert message
  let bannerMessage = "Return requested by customer. Review details below to approve or schedule pickup.";
  let bannerStyle = "bg-amber-50/90 border-amber-200/90 text-amber-900";

  if (isRejected) {
    bannerMessage = `${isExchange ? "Exchange" : "Return"} request was rejected. Details have been documented in notes.`;
    bannerStyle = "bg-rose-50/90 border-rose-200/90 text-rose-900";
  } else if (status === "approved") {
    bannerMessage = `${isExchange ? "Exchange" : "Return"} approved. Pickup will be scheduled soon.`;
    bannerStyle = "bg-indigo-50/90 border-indigo-200/90 text-indigo-900";
  } else if (status === "pickup" || status === "pickup_scheduled" || status === "pickup_replace") {
    bannerMessage = isExchange 
      ? "Doorstep pickup & replace scheduled with logistics courier." 
      : "Pickup scheduled with logistics courier. Courier will collect package soon.";
    bannerStyle = "bg-blue-50/90 border-blue-200/90 text-blue-900";
  } else if (["completed", "refunded", "exchanged"].includes(status)) {
    bannerMessage = isExchange 
      ? "Exchange completed successfully. Replacement product delivered." 
      : "Return completed successfully. Refund settled to customer account.";
    bannerStyle = "bg-emerald-50/90 border-emerald-200/90 text-emerald-900";
  }

  const rawOrder = returnRequest.order || order;
  const orderDisplayId = typeof rawOrder === "object" ? (rawOrder?.orderId || "") : "";

  return (
    <div className="p-4 sm:p-5 space-y-3.5">
      {/* Product Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left: Product Thumbnail & Details */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-16 h-20 sm:w-18 sm:h-22 rounded-lg bg-slate-50 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center">
            {productImage ? (
              <img
                src={productImage}
                alt={productTitle}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <Package size={24} className="text-slate-400 stroke-[1.5]" />
            )}
          </div>

          <div className="space-y-1 min-w-0">
            {brandName && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5] block">
                {brandName}
              </span>
            )}

            <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-snug truncate" title={productTitle}>
              {productTitle}
            </h3>

            {/* Variant Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {color && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                  Color: {color}
                </span>
              )}
              {size && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                  Size: {size}
                </span>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                Qty: {quantity}
              </span>
            </div>

            {/* Price & Link */}
            <div className="pt-0.5 flex items-baseline gap-2.5">
              <span className="text-base font-bold text-slate-900 font-mono">
                ₹{Number(price).toLocaleString("en-IN")}
              </span>

              {productId && (
                <Link
                  to={`/product/${productSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] hover:underline"
                >
                  <span>View Product</span>
                  <ExternalLink size={11} className="stroke-[2.5]" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Context Badges */}
        <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 text-xs">
          {orderDisplayId && (
            <div className="text-slate-500 font-medium">
              Order: <span className="font-bold text-slate-800">{orderDisplayId}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-[#4F46E5] border border-indigo-100 uppercase">
              {returnRequest.type || "Return"}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              Refund
            </span>
          </div>
        </div>

      </div>

      {/* ONE Contextual Notification Banner */}
      <div className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-2 ${bannerStyle}`}>
        <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
          i
        </span>
        <p className="leading-snug">
          {bannerMessage}
        </p>
      </div>
    </div>
  );
};

export default ReturnHeroProductCard;
