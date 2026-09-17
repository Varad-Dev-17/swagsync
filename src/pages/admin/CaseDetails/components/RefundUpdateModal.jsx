import React, { useState, useEffect } from "react";
import { X, CreditCard, CheckCircle2, AlertTriangle, Loader2, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

const RefundUpdateModal = ({
  isOpen,
  onClose,
  returnRequest,
  order = {},
  onSave,
  isUpdating = false,
}) => {
  const [refundStatus, setRefundStatus] = useState("completed");
  const [refundMethod, setRefundMethod] = useState("COD");
  const [transactionId, setTransactionId] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    if (returnRequest) {
      setRefundStatus(
        returnRequest.refundStatus && returnRequest.refundStatus !== "not_required"
          ? returnRequest.refundStatus
          : "completed"
      );
      setRefundMethod(
        returnRequest.refundMethod ||
          (typeof returnRequest.order === "object" && returnRequest.order?.paymentMethod) ||
          order?.paymentMethod ||
          "COD"
      );
      setTransactionId(returnRequest.refundTransactionId || "");
      setFailureReason(returnRequest.refundFailureReason || "");
      setAdminNote("");
    }
  }, [returnRequest, order, isOpen]);

  if (!isOpen || !returnRequest) return null;

  const refundAmount = Number(
    returnRequest.refundAmount ||
      returnRequest.originalPrice ||
      (returnRequest.type === "exchange" && returnRequest.priceDifference < 0
        ? Math.abs(returnRequest.priceDifference)
        : order.totalAmount || 0)
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (refundStatus === "failed" && !failureReason.trim()) {
      toast.error("Please enter a reason for the refund failure");
      return;
    }

    const payload = {
      refundStatus,
      refundMethod,
      refundAmount,
      refundTransactionId: transactionId.trim() || undefined,
      refundFailureReason: refundStatus === "failed" ? failureReason.trim() : undefined,
      note: adminNote.trim()
        ? `Refund ${refundStatus.toUpperCase()}: ${adminNote.trim()}`
        : undefined,
    };

    onSave(payload, `Refund marked as ${refundStatus.toUpperCase()}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Process & Update Refund</h3>
              <p className="text-xs text-slate-500 font-medium">
                Order #{order.orderId || returnRequest.order?.orderId || returnRequest._id?.toString().slice(-8)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Refund Amount Banner */}
          <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Calculated Refund Payout:</span>
            <span className="text-base font-extrabold font-mono text-[#4F46E5]">
              ₹{refundAmount.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Refund Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Target Refund Status</label>
            <select
              value={refundStatus}
              onChange={(e) => setRefundStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-[#4F46E5] focus:bg-white cursor-pointer transition-all"
            >
              <option value="initiated">Initiated — Queued for Accounting</option>
              <option value="processing">Processing — Payout in Progress</option>
              <option value="completed">Completed — Amount Settled to Customer</option>
              <option value="failed">Failed — Transfer Rejected / Error</option>
            </select>
          </div>

          {/* Refund Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Payout Mode</label>
            <select
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-[#4F46E5] focus:bg-white cursor-pointer transition-all"
            >
              <option value="COD">COD Cash Payout (Handover)</option>
              <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
              <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Razorpay">Razorpay Gateway (Original Card/Netbanking)</option>
              <option value="Store Credit">Store Credit / Wallet</option>
            </select>
          </div>

          {/* Transaction / Reference ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Transaction / UPI / UTR Reference ID
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. UTR1234567890 / pay_refund_xyz / CASH-PAID"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none focus:ring-1 focus:ring-[#4F46E5] focus:bg-white transition-all"
            />
          </div>

          {/* Failure Reason (if status is failed) */}
          {refundStatus === "failed" && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-rose-700 block">Failure Reason *</label>
              <input
                type="text"
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                placeholder="e.g. Incorrect bank account / customer unreachable / gateway timeout"
                className="w-full px-3.5 py-2.5 bg-rose-50/50 border border-rose-300 rounded-lg text-xs text-rose-900 outline-none focus:ring-1 focus:ring-rose-500 transition-all"
              />
            </div>
          )}

          {/* Internal Admin Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Remarks / Case Note (Optional)</label>
            <textarea
              rows={2}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Add internal remarks about this payout..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:ring-1 focus:ring-[#4F46E5] focus:bg-white resize-none transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              <span>Save & Update Refund</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RefundUpdateModal;
