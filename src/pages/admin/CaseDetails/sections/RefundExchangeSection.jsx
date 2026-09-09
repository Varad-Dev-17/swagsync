import React, { useState } from "react";
import { CreditCard, ArrowRight, CheckCircle, RefreshCw, AlertTriangle, DollarSign, Clock, ShieldAlert, FileText, Send, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import SectionCard from "../components/SectionCard";
import TimelineItem from "../components/TimelineItem";
import PriceRow from "../components/PriceRow";
import StatusBadge from "../../../../components/admin/ui/StatusBadge";
import toast from "react-hot-toast";
import CopyBadge from "../components/CopyBadge";

const RefundExchangeSection = ({ returnRequest = null, order = {}, onUpdateRefundStatus = null, onUpdateRequestStatus = null, isProcessing = false }) => {
  const [activeAction, setActiveAction] = useState(null); // "completed" | "failed" | null
  const [transactionIdInput, setTransactionIdInput] = useState(returnRequest?.refundTransactionId || "");
  const [failureReasonInput, setFailureReasonInput] = useState(returnRequest?.refundFailureReason || "");

  if (!returnRequest) return null;

  const type = returnRequest.type || "return";
  const status = (returnRequest.status || "pending").toLowerCase();
  const refundStatus = (returnRequest.refundStatus || "not_required").toLowerCase();

  // For Return cases & Refund difference exchanges
  const refundAmount = returnRequest.refundAmount || returnRequest.originalPrice || (type === "exchange" && returnRequest.priceDifference < 0 ? Math.abs(returnRequest.priceDifference) : returnRequest.product?.price || returnRequest.product?.sellingPrice || order.totalAmount || 0);
  const refundMethod = returnRequest.refundMethod || order.paymentMethod?.toUpperCase() || "Original Payment Mode";
  const isRefunded = status === "refunded" || status === "completed" || refundStatus === "completed";
  const isExchanged = status === "exchanged";

  // For Exchange cases
  const origVariant = returnRequest.originalVariant || {};
  const newVariant = returnRequest.requestedExchangeVariant || {};
  const settlementType = returnRequest.settlementType || "no_difference";
  const priceDifference = returnRequest.priceDifference || (newVariant.price || 0) - (origVariant.price || 0);

  const isRefundRequired = type === "return" || settlementType === "refund" || (refundStatus && refundStatus !== "not_required");

  const getVariantSummary = (v) => {
    let size = v.size || "";
    let color = v.color || "";
    if (Array.isArray(v.attributes) && v.attributes.length > 0) {
      v.attributes.forEach((attr) => {
        const name = attr.attribute?.name?.toLowerCase() || "";
        const val = attr.option?.displayName || attr.option?.storedValue || attr.option?.value || attr.value || "";
        if (name.includes("size") && val) size = val;
        if (name.includes("color") && val) color = val;
      });
    }
    const img = v.mainImage?.url || (typeof v.mainImage === "string" ? v.mainImage : null) || returnRequest.product?.images?.[0]?.url || (typeof returnRequest.product?.images?.[0] === "string" ? returnRequest.product.images[0] : null) || null;
    return {
      sku: v.sku || null,
      image: img,
      price: Number(v.price ?? v.sellingPrice ?? v.mrp ?? returnRequest.product?.price ?? returnRequest.product?.sellingPrice ?? returnRequest.product?.mrp ?? 0) || 0,
      size: size || null,
      color: color || null,
    };
  };

  const origInfo = getVariantSummary(origVariant);
  const newInfo = getVariantSummary(newVariant);

  // Refund Timeline
  const refundSteps = [
    {
      title: "Refund Initiated",
      subtitle: "Claim verified & scheduled for accounting reimbursement.",
      isCompleted: ["initiated", "processing", "completed"].includes(refundStatus) || isRefunded,
      isCurrent: refundStatus === "initiated",
    },
    {
      title: "Processing via Gateway",
      subtitle: `Transferring via ${refundMethod}`,
      isCompleted: ["processing", "completed"].includes(refundStatus) || isRefunded,
      isCurrent: refundStatus === "processing",
    },
    {
      title: "Refund Completed",
      subtitle: isRefunded || refundStatus === "completed" ? `₹${Number(refundAmount).toLocaleString("en-IN")} settled successfully.${returnRequest.refundTransactionId ? ` Txn ID: ${returnRequest.refundTransactionId}` : ""}` : "Awaiting payout confirmation.",
      isCompleted: isRefunded || refundStatus === "completed",
      isCurrent: isRefunded || refundStatus === "completed",
    },
  ];

  if (refundStatus === "failed") {
    refundSteps.push({
      title: "Refund Failed",
      subtitle: returnRequest.refundFailureReason || "Payout transfer rejected by accounting gateway.",
      isCurrent: true,
      isError: true,
    });
  }

  // (Exchange fulfillment timeline is tracked natively in ReturnExchangeSection)

  const formatDate = (dateVal) => {
    if (!dateVal) return "Pending Settlement";
    try {
      return new Date(dateVal).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return String(dateVal);
    }
  };

  const handleQuickTransition = (targetStatus) => {
    if (onUpdateRefundStatus) {
      onUpdateRefundStatus({ refundStatus: targetStatus, refundAmount, refundMethod });
    }
  };

  const handleSubmitDetails = () => {
    if (activeAction === "failed" && !failureReasonInput.trim()) {
      toast.error("Please enter a reason for refund failure");
      return;
    }
    if (onUpdateRefundStatus) {
      onUpdateRefundStatus({
        refundStatus: activeAction,
        refundAmount,
        refundMethod,
        refundTransactionId: transactionIdInput.trim() || undefined,
        refundFailureReason: failureReasonInput.trim() || undefined,
      });
      setActiveAction(null);
    }
  };

  return (
    <SectionCard
      icon={CreditCard}
      title={type === "exchange" && !isRefundRequired ? "Item Replacement" : "Refund Details"}
      className=""
    >
      {type === "return" || isRefundRequired ? (
        <div className="space-y-8">
          
          <div className="flex flex-col gap-6 items-stretch">
            
            {/* Top Area: Refund Totals & Attributes */}
            <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
                <span className="text-xs font-semibold text-slate-600">Refund Method</span>
                <span className="px-3 py-1 bg-[#EEF2FF] text-[#4F46E5] font-bold text-xs rounded-lg capitalize shadow-2xs">
                  {refundMethod}
                </span>
              </div>

              <div className="space-y-2">
                <PriceRow label="Item Price" value={refundAmount} />
                <PriceRow label="Deductions" value={0} subtext="No deduction applied" />
                <PriceRow label="Refund Amount" value={refundAmount} isTotal />
              </div>

              {/* Accounting Details */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 font-semibold block text-[11px]">Transaction ID:</span>
                  <span className="font-mono font-semibold text-slate-700 break-all">
                    {returnRequest.refundTransactionId ? (
                      <CopyBadge text={returnRequest.refundTransactionId} label="Transaction ID">
                        {returnRequest.refundTransactionId}
                      </CopyBadge>
                    ) : "Not sent yet"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold block text-[11px]">Date Processed:</span>
                  <span className="font-semibold text-slate-700">
                    {formatDate(returnRequest.refundProcessedAt)}
                  </span>
                </div>
                {refundStatus === "failed" && returnRequest.refundFailureReason && (
                  <div className="col-span-2 pt-2 text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    <span className="font-bold block text-[11px]">Failure Reason:</span>
                    <span className="font-medium">{returnRequest.refundFailureReason}</span>
                  </div>
                )}
              </div>

              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                <span>Eligible for full refund.</span>
              </div>
            </div>

            {/* Bottom Area: Refund Timeline */}
            <div className="space-y-3 px-1 pt-2 border-t border-gray-100">
              <span className="text-xs font-bold text-slate-600 block mb-3">
                Refund Status Timeline
              </span>
              <TimelineItem steps={refundSteps} currentStatus={refundStatus} />
            </div>
          </div>
        </div>
      ) : null}

      {/* EXCHANGE COMPARISON */}
      {type === "exchange" ? (
        <div className="w-full pt-2">
          
          {/* Side-by-Side Variant Comparison */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gradient-to-r from-gray-50 via-white to-indigo-50/30 p-6 rounded-2xl border border-gray-200/80 shadow-2xs relative">
            
            {/* Old Variant */}
            <div className="space-y-3 p-4 bg-white rounded-xl border border-gray-200 shadow-2xs relative">
              <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-700 text-[11px] font-bold rounded-md border border-rose-100">
                Original (Returning)
              </span>
              <div className="flex items-center gap-4 pt-2">
                {origInfo.image ? (
                  <img src={origInfo.image} alt="old" className="w-16 h-20 object-cover rounded-lg border border-gray-100 shadow-2xs shrink-0"  loading="lazy" decoding="async" />
                ) : (
                  <div className="w-16 h-20 rounded-lg bg-gray-100 border border-gray-200 shrink-0" />
                )}
                <div className="space-y-1">
                  <div className="text-xs text-gray-700 font-medium space-y-0.5">
                    {origInfo.color && <div>Color: <strong className="text-slate-700 font-bold">{origInfo.color}</strong></div>}
                    {origInfo.size && <div>Size: <strong className="text-slate-700 font-bold">{origInfo.size}</strong></div>}
                  </div>
                  <div className="text-sm font-extrabold text-[#4648d4] font-mono pt-1">
                    ₹{Number(origInfo.price).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Arrow divider on wide screens */}
            <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#4648d4] text-white items-center justify-center z-10 shadow-lg border-2 border-white">
              <ArrowRight size={18} className="stroke-[3]" />
            </div>

            {/* New Requested Variant */}
            <div className="space-y-3 p-4 bg-white rounded-xl border border-[#4648d4]/30 ring-2 ring-[#4648d4]/10 shadow-sm">
              <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-md border border-emerald-100">
                Requested Replacement
              </span>
              <div className="flex items-center gap-4 pt-2">
                {newInfo.image ? (
                  <img src={newInfo.image} alt="new" className="w-16 h-20 object-cover rounded-lg border border-gray-100 shadow-2xs shrink-0"  loading="lazy" decoding="async" />
                ) : (
                  <div className="w-16 h-20 rounded-lg bg-gray-100 border border-gray-200 shrink-0" />
                )}
                <div className="space-y-1">
                  <div className="text-xs text-gray-700 font-medium space-y-0.5">
                    {newInfo.color && <div>Color: <strong className="text-indigo-600 font-bold">{newInfo.color}</strong></div>}
                    {newInfo.size && <div>Size: <strong className="text-indigo-600 font-bold">{newInfo.size}</strong></div>}
                  </div>
                  <div className="text-sm font-extrabold text-[#4648d4] font-mono pt-1">
                    ₹{Number(newInfo.price).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            </div>

            {/* Price difference banner across bottom */}
            <div className="sm:col-span-2 pt-3 border-t border-gray-200/80 flex items-center justify-between text-xs font-bold text-gray-700">
              <span className="flex items-center gap-1.5 text-gray-500">
                <RefreshCw size={14} className="text-[#4F46E5]" />
                Exchange Type: <strong className="text-slate-700 capitalize">{settlementType.replace("_", " ")}</strong>
              </span>
              <span className={`px-3 py-1 rounded-lg font-mono font-bold text-sm ${
                priceDifference === 0 ? "bg-gray-100 text-gray-600" : priceDifference > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
              }`}>
                {priceDifference === 0 ? "No Price Difference (₹0)" : priceDifference > 0 ? `Customer Pays Extra: +₹${priceDifference}` : `Refund Difference: -₹${Math.abs(priceDifference)}`}
              </span>
            </div>

          </div>
        </div>
      ) : null}
    </SectionCard>
  );
};

export default RefundExchangeSection;
