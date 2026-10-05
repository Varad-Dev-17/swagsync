import React, { useState, useEffect } from "react";
import { AlertTriangle, ArrowLeft, Check, Loader2, X, HelpCircle, ShieldAlert } from "lucide-react";

const CANCELLATION_REASONS = [
  { id: "mistake", label: "Ordered by mistake" },
  { id: "delayed", label: "Expected delivery time is too late" },
  { id: "cheaper", label: "Found a cheaper price / better deal elsewhere" },
  { id: "address", label: "Need to change shipping address or phone number" },
  { id: "variant", label: "Need to change size, color, or variant" },
  { id: "price_dropped", label: "Price has dropped / reordering with discount" },
  { id: "other", label: "Other / Changed my mind" },
];

const CancelOrderModal = ({
  isOpen,
  onClose,
  onConfirm,
  order,
  targetItem = null,
  isLoading = false,
}) => {
  const [step, setStep] = useState(1); // 1 = Confirmation, 2 = Select Reason
  const [selectedReason, setSelectedReason] = useState("");
  const [comment, setComment] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedReason("");
      setComment("");
      setErrorMsg("");
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const isMultiItemOrder = (order.items || []).length > 1;
  const isItemLevel = Boolean(targetItem && isMultiItemOrder);

  // Compute pricing/refund info
  const refundAmount = isItemLevel
    ? Number(targetItem.sellingPrice || targetItem.price || 0) * Number(targetItem.quantity || 1)
    : Number(order.totalAmount || 0);

  const isPaidOnline = (order.paymentMethod || "").toLowerCase() === "razorpay" ||
    order.paymentStatus === "paid" ||
    Boolean(order.razorpayPaymentId);

  const handleNextStep = () => {
    setStep(2);
  };

  const handleBackStep = () => {
    setStep(1);
    setErrorMsg("");
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      setErrorMsg("Please select a reason for cancellation.");
      return;
    }

    try {
      await onConfirm({
        reason: selectedReason,
        comment: comment.trim(),
      });
    } catch {
      // Error handled by caller
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            {step === 2 && (
              <button
                type="button"
                onClick={handleBackStep}
                disabled={isLoading}
                className="p-1 -ml-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Go back"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className={`p-2 rounded-xl ${step === 1 ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
              {step === 1 ? <AlertTriangle size={20} className="stroke-[2.25]" /> : <HelpCircle size={20} className="stroke-[2.25]" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {step === 1
                  ? isItemLevel
                    ? "Cancel This Item?"
                    : "Cancel Order?"
                  : "Select Cancellation Reason"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {step === 1
                  ? `Order #${order.orderId || order._id?.slice(-8).toUpperCase()}`
                  : `Step 2 of 2: Tell us why you're cancelling`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: CONFIRMATION PROMPT */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Target Item / Order Preview Card */}
              {isItemLevel && targetItem ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3.5">
                  <div className="w-14 h-16 bg-white rounded-lg border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                    <img
                      src={
                        targetItem.variant?.mainImage?.url ||
                        targetItem.product?.images?.[0]?.url ||
                        targetItem.image ||
                        ""
                      }
                      alt={targetItem.product?.title || "Product"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="font-bold text-slate-900 text-sm truncate">
                      {targetItem.product?.title || "Product Item"}
                    </p>
                    <div className="text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                      {targetItem.variant?.color && <span>Color: <strong>{targetItem.variant.color}</strong></span>}
                      {targetItem.variant?.size && <span>• Size: <strong>{targetItem.variant.size}</strong></span>}
                      <span>• Qty: <strong>{targetItem.quantity || 1}</strong></span>
                    </div>
                    <p className="text-[#FD7100] font-bold font-mono text-xs mt-1">
                      ₹{refundAmount.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-medium">Order Reference:</span>
                    <span className="font-mono font-bold text-slate-900">#{order.orderId || order._id}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-medium">Total Items:</span>
                    <span className="font-bold text-slate-900">{(order.items || []).length} items</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
                    <span>Order Amount:</span>
                    <span className="font-mono text-[#FD7100]">₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}

              {/* Warning Notice */}
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-900">
                <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <p className="font-bold">This action cannot be undone.</p>
                  <p className="text-rose-800">
                    {isItemLevel
                      ? "Are you sure you want to cancel this item? Any other shipped or non-cancelled items in this order will continue to be delivered."
                      : "Are you sure you want to cancel this order? Once cancelled, the items will be returned to stock."}
                  </p>
                </div>
              </div>

              {/* Refund Info Banner */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900">
                <p className="font-medium">
                  {isPaidOnline ? (
                    <>
                      💰 <strong>Online Payment:</strong> A refund of{" "}
                      <strong className="font-mono">₹{refundAmount.toLocaleString("en-IN")}</strong> will be returned to your original payment account within 5-7 business days.
                    </>
                  ) : (
                    <>
                      💵 <strong>Cash on Delivery (COD):</strong> No payment was collected, so no refund is needed.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: REASON SELECTION */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 font-medium">
                Please select the primary reason for cancelling this {isItemLevel ? "item" : "order"}:
              </p>

              {/* Reason Radio Group */}
              <div className="space-y-2">
                {CANCELLATION_REASONS.map((r) => {
                  const isSelected = selectedReason === r.label;
                  return (
                    <label
                      key={r.id}
                      onClick={() => {
                        setSelectedReason(r.label);
                        setErrorMsg("");
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        isSelected
                          ? "bg-rose-50/70 border-rose-400 text-rose-950 shadow-2xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                            isSelected ? "border-rose-600 bg-rose-600 text-white" : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span>{r.label}</span>
                      </div>
                      {isSelected && <Check size={14} className="text-rose-600" />}
                    </label>
                  );
                })}
              </div>

              {/* Optional Comments */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us more about why you're cancelling..."
                  rows={2}
                  disabled={isLoading}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                Keep {isItemLevel ? "Item" : "Order"}
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Continue to Cancel</span>
                &rarr;
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleBackStep}
                disabled={isLoading}
                className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || !selectedReason}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing Cancellation...</span>
                  </>
                ) : (
                  <span>Submit & Cancel {isItemLevel ? "Item" : "Order"}</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CancelOrderModal;
