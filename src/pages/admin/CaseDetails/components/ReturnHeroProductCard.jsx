import React from 'react';
import { ExternalLink, Package, ArrowRight, ShieldCheck, Banknote, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const ReturnHeroProductCard = ({ returnRequest, order = null }) => {
  if (!returnRequest) return null;

  const isExchange = returnRequest.type === "exchange";
  const status = String(returnRequest.status || "pending").toLowerCase();
  const isRejected = status === "rejected";

  // Product & Variant details extraction
  const product = returnRequest.product || {};
  const origVariant = returnRequest.originalVariant || {};
  const reqVariant = returnRequest.requestedExchangeVariant || {};

  // Extract Brand
  const brandName = typeof product.brand === "object" && product.brand?.name 
    ? product.brand.name 
    : (typeof product.brand === "string" ? product.brand : "Brand");

  const productTitle = product.title || product.name || "Product Title";
  const productId = product._id || product.id || "";
  const productSlug = product.slug || productId;

  // Extract attributes helper
  const getAttributes = (variant) => {
    const list = [];
    if (!variant) return list;
    if (variant.color) list.push({ label: "Color", value: variant.color });
    if (variant.size) list.push({ label: "Size", value: variant.size });
    if (Array.isArray(variant.attributes)) {
      variant.attributes.forEach(attr => {
        if (!attr) return;
        const name = attr.attribute?.name || attr.name || "";
        const val = attr.option?.displayName || attr.option?.storedValue || attr.option?.value || attr.value || "";
        if (name && val && !list.some(item => item.label.toLowerCase() === name.toLowerCase())) {
          list.push({ label: name, value: val });
        }
      });
    }
    return list;
  };

  const origAttrs = getAttributes(origVariant);
  const reqAttrs = getAttributes(reqVariant);

  const quantity = returnRequest.quantity || 1;
  const originalPrice = returnRequest.originalPrice || origVariant.price || product.price || 999;
  const exchangePrice = returnRequest.exchangePrice || reqVariant.price || 0;
  const priceDiff = returnRequest.priceDifference !== undefined 
    ? returnRequest.priceDifference 
    : (isExchange && exchangePrice ? exchangePrice - originalPrice : 0);

  // Images
  const origImage = origVariant.mainImage?.url 
    || (typeof origVariant.mainImage === "string" ? origVariant.mainImage : null)
    || product.images?.[0]?.url 
    || (typeof product.images?.[0] === "string" ? product.images[0] : null)
    || "/placeholder-product.png";

  const reqImage = reqVariant.mainImage?.url 
    || (typeof reqVariant.mainImage === "string" ? reqVariant.mainImage : null)
    || origImage;

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
    <div className="p-4 sm:p-5 space-y-4">
      {/* Brand & Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          {brandName && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5] block">
              {brandName}
            </span>
          )}
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800 leading-snug">
              {productTitle}
            </h3>
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

        <div className="flex items-center gap-2 text-xs">
          {orderDisplayId && (
            <span className="text-slate-500 font-medium">
              Order: <strong className="text-slate-800">{orderDisplayId}</strong>
            </span>
          )}
          <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-indigo-50 text-[#4F46E5] border border-indigo-100 uppercase">
            {returnRequest.type || "Return"}
          </span>
        </div>
      </div>

      {/* Main Comparison Section */}
      {isExchange ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative items-stretch">
          
          {/* Returning Item Card */}
          <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px] uppercase border border-rose-100">
                Returning Variant (Collect from Customer)
              </span>
              <span className="text-xs font-bold text-slate-500">Qty: {quantity}</span>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-16 h-20 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                <img src={origImage} alt="Returning Variant" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap gap-1.5">
                  {origAttrs.length > 0 ? (
                    origAttrs.map((attr, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-slate-200 text-slate-700">
                        {attr.label}: <strong className="ml-1 text-slate-900">{attr.value}</strong>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">Original Variant</span>
                  )}
                </div>
                <div className="text-sm font-bold font-mono text-slate-800 pt-0.5">
                  ₹{Number(originalPrice).toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>

          {/* Requested Replacement Card */}
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200/80 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase border border-emerald-100">
                Replacement Variant (Deliver to Customer)
              </span>
              <span className="text-xs font-bold text-[#4F46E5]">Qty: {quantity}</span>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-16 h-20 rounded-lg bg-white border border-indigo-100 overflow-hidden shrink-0 flex items-center justify-center">
                <img src={reqImage} alt="Replacement Variant" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap gap-1.5">
                  {reqAttrs.length > 0 ? (
                    reqAttrs.map((attr, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-indigo-100 text-indigo-900">
                        {attr.label}: <strong className="ml-1 text-indigo-700">{attr.value}</strong>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">Replacement Variant</span>
                  )}
                </div>
                <div className="text-sm font-bold font-mono text-[#4F46E5] pt-0.5">
                  ₹{Number(exchangePrice).toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Standard Return Product View */
        <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div className="w-16 h-20 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
            {origImage ? (
              <img src={origImage} alt={productTitle} className="w-full h-full object-cover" />
            ) : (
              <Package size={24} className="text-slate-400 stroke-[1.5]" />
            )}
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap gap-1.5">
              {origAttrs.map((attr, i) => (
                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-slate-200 text-slate-700">
                  {attr.label}: <strong className="ml-1 text-slate-900">{attr.value}</strong>
                </span>
              ))}
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-slate-200 text-slate-700">
                Qty: <strong className="ml-1 text-slate-900">{quantity}</strong>
              </span>
            </div>
            <div className="text-base font-bold font-mono text-slate-900">
              ₹{Number(originalPrice).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}

      {/* Financial Settlement Strip for Exchanges */}
      {isExchange && (
        <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Settlement Direction:</span>
            {priceDiff > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {returnRequest.paymentMethod === 'razorpay' ? (
                  <>
                    <ShieldCheck size={13} className="text-emerald-600" />
                    <span>Extra +₹{priceDiff.toLocaleString("en-IN")} Paid Online (RAZORPAY)</span>
                  </>
                ) : (
                  <>
                    <Banknote size={13} className="text-amber-600" />
                    <span>Collect +₹{priceDiff.toLocaleString("en-IN")} at Doorstep (COD Swap)</span>
                  </>
                )}
              </span>
            ) : priceDiff < 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <RefreshCw size={12} className="text-emerald-600" />
                <span>Refund Due to Customer: ₹{Math.abs(priceDiff).toLocaleString("en-IN")}</span>
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-[#4F46E5] border border-indigo-200">
                Even 1-to-1 Exchange (₹0 Difference)
              </span>
            )}
          </div>

          <div className="text-slate-500 font-medium text-[11px]">
            Original: <strong className="font-mono text-slate-700">₹{Number(originalPrice).toLocaleString("en-IN")}</strong> → Replacement: <strong className="font-mono text-slate-700">₹{Number(exchangePrice).toLocaleString("en-IN")}</strong>
          </div>
        </div>
      )}

      {/* Contextual Notification Banner */}
      <div className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 ${bannerStyle}`}>
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
