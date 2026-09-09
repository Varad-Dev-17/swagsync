import React, { useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Calendar, 
  Send,
  Loader2,
  CheckCircle,
  Eye
} from 'lucide-react';
import ImageViewerModal from '../components/ImageViewerModal';
import toast from 'react-hot-toast';

const CaseTabsSection = ({
  returnRequest,
  order = {},
  notes = [],
  onSaveNote = null,
  isSavingNote = false
}) => {
  const [activeTab, setActiveTab] = useState("request"); // "request" | "refund" | "activity" | "notes"
  const [isImgModalOpen, setIsImgModalOpen] = useState(false);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);

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

  return (
    <>
      <div className="w-full">
        
        {/* Tabs Navigation Header */}
        <div className="flex items-center border-b border-slate-200 px-4 sm:px-5 bg-slate-50/50 overflow-x-auto">
          {[
            { id: "request", label: "Request Details" },
            { id: "refund", label: "Refund Details" },
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

        {/* Tab 2: Refund Details */}
        {activeTab === "refund" && (
          <div className="p-4 sm:p-5 space-y-4">
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
                </div>

                <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-0.5">
                  <div>Transaction ID: <span className="font-mono font-semibold text-slate-700">{transactionId}</span></div>
                  <div>Date Processed: <span className="font-semibold text-slate-700">{dateProcessed}</span></div>
                </div>
              </div>

              {/* Refund Eligibility Status */}
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                  <span>Eligible for full refund upon collection and verification.</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The refund will be processed directly to the original COD cash receipt or mapped customer account once the return pickup has been marked as completed.
                </p>
              </div>

            </div>
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
    </>
  );
};

export default CaseTabsSection;
