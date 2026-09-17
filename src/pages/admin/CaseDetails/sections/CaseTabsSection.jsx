import React, { useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Calendar, 
  Send,
  Loader2,
  CheckCircle,
  Eye,
  CreditCard,
  Edit3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import ImageViewerModal from '../components/ImageViewerModal';
import RefundUpdateModal from '../components/RefundUpdateModal';
import StatusBadge from '../../../../components/admin/ui/StatusBadge';
import toast from 'react-hot-toast';

const CaseTabsSection = ({
  returnRequest,
  order = {},
  notes = [],
  onSaveNote = null,
  isSavingNote = false,
  onUpdateRefundDetails = null,
  onProcessRazorpayRefund = null,
  isUpdatingRefund = false,
}) => {
  const [activeTab, setActiveTab] = useState("request"); // "request" | "refund" | "activity" | "notes"
  const [isImgModalOpen, setIsImgModalOpen] = useState(false);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [showRazorpayConfirm, setShowRazorpayConfirm] = useState(false);

  // New Note state
  const [newNote, setNewNote] = useState("");
  const [visibleToCustomer, setVisibleToCustomer] = useState(false);

  if (!returnRequest) return null;

  const type = returnRequest.type || "return";
  const isExchange = type === "exchange";

  const reason = returnRequest.reason || "Other";
  const description = returnRequest.additionalDetails || "Not Needed";
  const images = Array.isArray(returnRequest.images)
    ? returnRequest.images.map(img => (typeof img === "object" && img?.url ? img.url : img))
    : [];

  const formatDate = (dateVal) => {
    if (!dateVal) return "";
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

  // Refund values per requirements
  const itemPrice = returnRequest.originalPrice || returnRequest.refundAmount || 999;
  const deliveryFee = order?.shippingAmount !== undefined ? order.shippingAmount : 49;
  const deduction = 0;
  const refundAmount = returnRequest.refundAmount || itemPrice;
  const refundMethod = (returnRequest.refundMethod || order?.paymentMethod || "COD").toUpperCase();
  const transactionId = returnRequest.refundTransactionId || "Not sent yet";
  const dateProcessed = returnRequest.refundProcessedAt ? formatDate(returnRequest.refundProcessedAt) : "Pending Settlement";

  // Activity History timeline
  const orderEvents = Array.isArray(order.timeline) ? order.timeline : [];
  const returnEvents = Array.isArray(returnRequest.timeline) ? returnRequest.timeline : [];
  const combinedEvents = [...orderEvents, ...returnEvents]
    .filter(ev => !String(ev.type || "").toLowerCase().includes("qc") && !String(ev.type || "").toLowerCase().includes("quality check"))
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  const handleAddNoteSubmit = (e) => {
    e.preventDefault();
    if (!newNote.trim()) {
      toast.error("Please enter a note before saving");
      return;
    }
    if (onSaveNote) {
      onSaveNote({
        note: newNote.trim(),
        visibleToCustomer: visibleToCustomer
      });
      setNewNote("");
      setVisibleToCustomer(false);
    }
  };

  const isExtraPayment = isExchange && ((returnRequest.priceDifference || 0) > 0 || returnRequest.settlementType === "additional_payment");
  const isRefundDue = !isExchange || ((returnRequest.priceDifference || 0) < 0 || returnRequest.settlementType === "refund");
  const isEvenSwap = isExchange && !isExtraPayment && !isRefundDue;

  // Tab Title
  const financeTabLabel = isExtraPayment 
    ? "Payment & Settlement" 
    : isEvenSwap 
    ? "Settlement (₹0)" 
    : "Refund Details";

  return (
    <>
      <div className="w-full">
        
        {/* Tabs Navigation Header */}
        <div className="flex items-center border-b border-slate-200 px-4 sm:px-5 bg-slate-50/50 overflow-x-auto">
          {[
            { id: "request", label: "Request Details" },
            { id: "refund", label: financeTabLabel },
            { id: "activity", label: `Activity History (${combinedEvents.length})` },
            { id: "notes", label: `Admin Notes (${notes.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 text-xs font-semibold transition-all relative border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "border-[#4F46E5] text-[#4F46E5] font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Request Details */}
        {activeTab === "request" && (
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Left: Metadata attributes */}
              <div className="space-y-3.5">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                    Reason for {isExchange ? "Exchange" : "Return"}
                  </span>
                  <span className="text-sm font-bold text-slate-800 block mt-0.5">
                    {reason}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                    Description
                  </span>
                  <span className="text-xs text-slate-700 block mt-0.5 font-medium leading-relaxed">
                    {description}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                    Requested On
                  </span>
                  <span className="text-xs text-slate-700 block mt-0.5 font-medium">
                    {formatDate(returnRequest.createdAt)}
                  </span>
                </div>
              </div>

              {/* Right: Uploaded Photos */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-[#4F46E5]" />
                  <span className="text-xs font-bold text-slate-700">
                    Uploaded Photos ({images.length})
                  </span>
                </div>

                {images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2.5">
                    {images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedImgIndex(idx);
                          setIsImgModalOpen(true);
                        }}
                        className="group relative aspect-square rounded-lg bg-slate-100 overflow-hidden border border-slate-200 cursor-pointer shadow-2xs hover:scale-102 transition-all"
                      >
                        <img src={imgUrl} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <Eye size={13} />
                          <span>View</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-20 w-full rounded-lg border border-dashed border-slate-200 flex items-center justify-center gap-2 text-slate-400 p-3 bg-slate-50/40">
                    <ImageIcon size={18} className="text-slate-300" />
                    <span className="text-xs font-medium text-slate-400">No photos uploaded</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: Financial Settlement / Refund Details */}
        {activeTab === "refund" && (
          <div className="p-4 sm:p-5 space-y-4">
            
            {/* Case A: Costlier Exchange (Customer Paid Extra) */}
            {isExtraPayment ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      ₹
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-950">Customer Extra Payment Required</h4>
                      <p className="text-[11px] text-amber-800">
                        {returnRequest.paymentMethod === "razorpay"
                          ? `Extra difference of ₹${Math.abs(returnRequest.priceDifference).toLocaleString("en-IN")} was paid online via RAZORPAY.`
                          : `Customer selected Cash on Delivery. Collect ₹${Math.abs(returnRequest.priceDifference).toLocaleString("en-IN")} at doorstep handover.`}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    returnRequest.paymentStatus === "paid"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}>
                    {returnRequest.paymentStatus === "paid" ? "Paid Online (Razorpay)" : "Pending Doorstep Collection"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-semibold text-slate-600">Settlement Mode</span>
                      <span className="font-bold text-[#4F46E5] uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {returnRequest.paymentMethod || "COD"}
                      </span>
                    </div>

                    <div className="space-y-2 text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>Original Item Price</span>
                        <span className="font-bold text-slate-800 font-mono">₹{Number(returnRequest.originalPrice || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Replacement Item Price</span>
                        <span className="font-bold text-slate-800 font-mono">₹{Number(returnRequest.exchangePrice || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-slate-900 text-sm">
                        <span>Payable Difference (Extra Paid)</span>
                        <span className="font-bold text-amber-600 font-mono text-base">+₹{Number(returnRequest.priceDifference).toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {returnRequest.razorpayPaymentId && (
                      <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Razorpay Payment ID:</span>
                        <span className="font-mono font-bold text-slate-800">{returnRequest.razorpayPaymentId}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-600">
                    <h5 className="font-bold text-slate-800">Logistics & Accounting Instructions:</h5>
                    <p className="leading-relaxed">
                      {returnRequest.paymentMethod === "razorpay"
                        ? "The extra price difference is already captured online. Delivery partner should conduct a standard doorstep item swap."
                        : "Courier should collect ₹" + Math.abs(returnRequest.priceDifference).toLocaleString("en-IN") + " in cash or UPI from the customer upon delivering the replacement package."}
                    </p>
                  </div>
                </div>
              </div>
            ) : isEvenSwap ? (
              /* Case B: Even 1-to-1 Swap (₹0 Difference) */
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                <CheckCircle2 size={28} className="text-[#4F46E5] mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">Even 1-to-1 Exchange (₹0 Difference)</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Both items have identical prices (₹{Number(returnRequest.originalPrice || 0).toLocaleString("en-IN")}). No payment or refund adjustment is needed.
                </p>
              </div>
            ) : (
              /* Case C: Refund Due (Standard Return or Cheaper Exchange) */
              <>
                {/* Header Control Row: Current Status + Action Button */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Refund Status:</span>
                    <StatusBadge status={returnRequest.refundStatus || "pending"} />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {returnRequest.refundStatus !== "completed" && (
                      <>
                        {refundMethod === "RAZORPAY" && onProcessRazorpayRefund && (
                          <button
                            type="button"
                            onClick={() => setShowRazorpayConfirm(true)}
                            disabled={isUpdatingRefund}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                          >
                            {isUpdatingRefund ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
                            <span>⚡ 1-Click Razorpay Refund</span>
                          </button>
                        )}

                        {onUpdateRefundDetails && (
                          <button
                            type="button"
                            onClick={() => setIsRefundModalOpen(true)}
                            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <Edit3 size={13} />
                            <span>{refundMethod === "RAZORPAY" ? "Manual / UTR Override" : "Update Refund (Record UTR / Cash)"}</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  {/* Financial Calculation */}
                  <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <span className="font-semibold text-slate-600">Refund Method</span>
                      <span className="font-bold text-[#4F46E5] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {refundMethod}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-slate-600">
                      {isExchange ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span>Original Item Price</span>
                            <span className="font-bold text-slate-800 font-mono">₹{Number(returnRequest.originalPrice || 0).toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Replacement Item Price</span>
                            <span className="font-bold text-slate-800 font-mono">₹{Number(returnRequest.exchangePrice || 0).toLocaleString("en-IN")}</span>
                          </div>
                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-slate-900 text-sm">
                            <span>Price Difference Refund</span>
                            <span className="font-bold text-emerald-600 font-mono text-base">₹{Number(refundAmount).toLocaleString("en-IN")}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span>Item Price</span>
                            <span className="font-bold text-slate-800 font-mono">₹{Number(itemPrice).toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Delivery Fee</span>
                            <span className="text-slate-500 font-mono">₹{deliveryFee} (Non-refundable)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Deduction</span>
                            <span className="text-slate-500 font-mono">₹{deduction}</span>
                          </div>
                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-slate-900 text-sm">
                            <span>Refund Amount</span>
                            <span className="font-bold text-[#4F46E5] font-mono text-base">₹{Number(refundAmount).toLocaleString("en-IN")}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Transaction ID:</span>
                        <span className="font-mono font-bold text-slate-800">{transactionId}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Date Processed:</span>
                        <span className="font-semibold text-slate-800">{dateProcessed}</span>
                      </div>
                      {returnRequest.refundStatus === "failed" && returnRequest.refundFailureReason && (
                        <div className="pt-2 text-rose-700 bg-rose-50 p-2 rounded-md border border-rose-200 text-xs">
                          <span className="font-bold block">Failure Reason:</span>
                          <span>{returnRequest.refundFailureReason}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Refund Eligibility & Status Explanations */}
                  <div className="space-y-3">
                    {returnRequest.refundStatus === "completed" ? (
                      <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-start gap-2.5">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="font-bold text-emerald-950">Refund Successfully Settled</p>
                          <p className="text-[11px] text-emerald-800 font-normal">
                            ₹{Number(refundAmount).toLocaleString("en-IN")} was processed via {refundMethod} on {dateProcessed}.
                          </p>
                        </div>
                      </div>
                    ) : returnRequest.refundStatus === "failed" ? (
                      <div className="p-3.5 bg-rose-50 rounded-lg border border-rose-200 text-rose-900 text-xs font-semibold flex items-start gap-2.5">
                        <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="font-bold text-rose-950">Refund Failed</p>
                          <p className="text-[11px] text-rose-800 font-normal">
                            {returnRequest.refundFailureReason || "Payout could not be processed. Please verify bank details or payout method."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-indigo-50/70 rounded-lg border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-start gap-2.5">
                        <CheckCircle size={18} className="text-[#4F46E5] shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="font-bold text-indigo-950">Eligible for Reimbursement</p>
                          <p className="text-[11px] text-indigo-800 font-normal">
                            {returnRequest.type === "exchange"
                              ? `Balance price difference of ₹${Number(refundAmount).toLocaleString("en-IN")} will be reimbursed to customer via ${refundMethod}.`
                              : `The refund of ₹${Number(refundAmount).toLocaleString("en-IN")} will be processed to the customer via ${refundMethod} upon completion.`}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 space-y-1">
                      <span className="font-bold text-slate-700 block">Admin Instructions:</span>
                      <p className="leading-relaxed">
                        Click <strong>"Update Refund Status"</strong> to change status to <em>Processing</em> or <em>Completed</em>, enter UTR/Transaction ID, or record payout details.
                      </p>
                    </div>
                  </div>

                </div>
              </>
            )}

          </div>
        )}

        {/* Tab 3: Activity History */}
        {activeTab === "activity" && (
          <div className="p-4 sm:p-5">
            {combinedEvents.length > 0 ? (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {combinedEvents.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <div className="w-2 h-2 rounded-full bg-[#4F46E5] mt-1.5 shrink-0" />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>{ev.type || "Status Update"}</span>
                        <span className="text-[11px] font-normal text-slate-400">{formatDate(ev.timestamp)}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{ev.description || "System recorded event update."}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No activity history records found.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Admin Notes */}
        {activeTab === "notes" && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Add Note Form */}
            <form onSubmit={handleAddNoteSubmit} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
              <span className="text-xs font-bold text-slate-700 block">Add Case Note</span>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type internal case details, verification observations, or customer instructions..."
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:ring-1 focus:ring-[#4F46E5] resize-none h-16"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleToCustomer}
                    onChange={(e) => setVisibleToCustomer(e.target.checked)}
                    className="rounded text-[#4F46E5] focus:ring-[#4F46E5]"
                  />
                  <span>Visible to customer</span>
                </label>

                <button
                  type="submit"
                  disabled={isSavingNote || !newNote.trim()}
                  className="px-3 py-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs rounded-md transition-colors flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {isSavingNote ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  <span>Save Note</span>
                </button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Notes History ({notes.length})</span>
              {notes.length > 0 ? (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {notes.map((n, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700">{n.author || "Admin"}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            n.visibleToCustomer ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600"
                          }`}>
                            {n.visibleToCustomer ? "Customer Visible" : "Internal"}
                          </span>
                          <span className="text-slate-400">{formatDate(n.createdAt)}</span>
                        </div>
                      </div>
                      <p className="text-slate-700">
                        "{n.note || String(n)}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">
                  No notes added yet for this case.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Proof Lightbox Modal */}
      <ImageViewerModal
        isOpen={isImgModalOpen}
        onClose={() => setIsImgModalOpen(false)}
        images={images}
        initialIndex={selectedImgIndex}
      />

      {/* 1-Click Razorpay Refund Confirmation Dialog */}
      {showRazorpayConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Process Razorpay Refund</h3>
                <p className="text-xs text-slate-500 font-medium">Automatic Gateway Disbursement</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to refund <strong className="font-mono text-slate-900 font-bold">₹{Number(refundAmount).toLocaleString("en-IN")}</strong> directly to the customer's original Razorpay account?
            </p>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
              ⚡ Razorpay will process the refund immediately and record the UTR/Refund ID automatically.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowRazorpayConfirm(false)}
                disabled={isUpdatingRefund}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingRefund}
                onClick={async () => {
                  if (onProcessRazorpayRefund) {
                    await onProcessRazorpayRefund();
                  }
                  setShowRazorpayConfirm(false);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isUpdatingRefund ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                <span>Confirm & Refund Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process & Update Refund Modal (Manual / COD / UTR override) */}
      <RefundUpdateModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        returnRequest={returnRequest}
        order={order}
        onSave={onUpdateRefundDetails}
        isUpdating={isUpdatingRefund}
      />
    </>
  );
};

export default CaseTabsSection;
