import React from "react";
import { Package, Truck, Clock, CheckCircle2, XCircle, RefreshCw, ShieldCheck, DollarSign, MessageSquare, AlertCircle, MapPin, Check } from "lucide-react";
import TimelineItem from "../../../../pages/admin/CaseDetails/components/TimelineItem";

const CustomerTrackingCard = ({ order = null }) => {
  if (!order) return null;

  const status = (order.status || "pending").toLowerCase();
  const isCancelled = status === "cancelled";

  // Check if there are any active return or exchange requests attached to this order
  const returnRequests = Array.isArray(order.returnRequests) ? order.returnRequests : [];
  const activeReturn = returnRequests.length > 0 ? returnRequests[0] : null;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  // Order Tracking Tracker
  const orderSteps = ["pending", "packed", "shipped", "on_the_way", "delivered"];
  const normalizedStatus = status === "processing" ? "packed" : status;
  const currentOrderIdx = orderSteps.indexOf(normalizedStatus);

  const renderOrderTracker = () => (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FD7100] flex items-center justify-center font-bold">
            <Package size={20} className="stroke-[2.25]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-700 tracking-tight">Order Tracking Status</h3>
            <p className="text-xs text-gray-500 font-medium">Real-time fulfillment progress for your order</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status === "delivered" ? "bg-green-50 text-green-700 border border-green-200" : isCancelled ? "bg-red-50 text-red-700 border border-red-200" : "bg-orange-50 text-[#FD7100] border border-orange-200"
          }`}>
          {status === "pending" ? "Order Confirmed" : status === "processing" ? "Packed" : status === "on_the_way" ? "Out for delivery" : status.replace(/_/g, " ")}
        </span>
      </div>

      {!isCancelled ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {[
            { label: "Order Confirmed", desc: "Verified & Approved", icon: Clock, idx: 0 },
            { label: "Packed", desc: "Packed & Verified", icon: Package, idx: 1 },
            { label: "Shipped", desc: order.trackingNumber ? `AWB: ${order.trackingNumber}` : "Dispatched", icon: Truck, idx: 2 },
            { label: "Out for delivery", desc: "Out for Delivery", icon: Truck, idx: 3 },
            { label: "Delivered", desc: "Package Received", icon: CheckCircle2, idx: 4 }
          ].map((s, i) => {
            const Icon = s.icon;
            const isCompleted = currentOrderIdx >= s.idx || status === "delivered";
            const isCurrent = currentOrderIdx === s.idx && status !== "delivered";

            return (
              <div key={i} className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50/70 border border-gray-100 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-transform ${isCompleted ? "bg-emerald-600 text-white shadow-xs" : isCurrent ? "bg-[#FD7100] text-white ring-4 ring-[#FD7100]/20 animate-pulse" : "bg-gray-200 text-gray-400"
                  }`}>
                  <Icon size={18} className="stroke-[2.25]" />
                </div>
                <span className={`text-xs font-extrabold ${isCompleted ? "text-slate-700" : isCurrent ? "text-[#FD7100]" : "text-gray-400"}`}>
                  {s.label}
                </span>
                <span className="text-[11px] text-gray-500 font-medium mt-0.5 max-w-[120px] leading-tight">
                  {s.desc}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
          <XCircle size={22} className="text-rose-600 shrink-0" />
          <div>
            <h4 className="text-sm font-bold">Order Cancelled</h4>
            <p className="text-xs font-medium opacity-90">This order was cancelled before fulfillment. If any payment was captured, reimbursement has been initiated.</p>
          </div>
        </div>
      )}
    </div>
  );

  // Return & Exchange Dedicated Tracker (Simplified 4-step flows)
  const renderReturnExchangeTracker = (req) => {
    const type = req.type || "return";
    const reqStatus = (req.status || "pending").toLowerCase();
    const isRejected = reqStatus === "rejected";

    const matchingItem = order?.items?.find(item => (item.product?._id || item.product) === (req.product?._id || req.product));
    const itemTitle = matchingItem?.product?.title || matchingItem?.product?.name || "";

    // 4-step simplified flows:
    // Return: 1. Requested -> 2. Approved/Rejected -> 3. Pickup -> 4. Return completed
    // Exchange: 1. Requested -> 2. Approved/Rejected -> 3. Pickup & Replace -> 4. Exchange completed
    const isExchange = type === "exchange";
    let currentIdx = 0;
    if (["completed", "refunded", "exchanged"].includes(reqStatus)) {
      currentIdx = 3;
    } else if (["pickup", "pickup_replace", "pickup_scheduled", "picked_up", "received", "packed", "shipped"].includes(reqStatus)) {
      currentIdx = 2;
    } else if (["approved"].includes(reqStatus)) {
      currentIdx = 1;
    } else {
      currentIdx = 0;
    }

    const steps = isExchange ? [
      { label: "Requested", desc: "Exchange Submitted", idx: 0 },
      { label: "Approved", desc: "Reviewed & Approved", idx: 1 },
      { label: "Pickup & Replace", desc: "Doorstep Swap", idx: 2 },
      { label: "Exchange Completed", desc: "Item Replaced & Closed", idx: 3 }
    ] : [
      { label: "Requested", desc: "Return Submitted", idx: 0 },
      { label: "Approved", desc: "Reviewed & Approved", idx: 1 },
      { label: "Pickup", desc: "Item Collection", idx: 2 },
      { label: "Return Completed", desc: "Processed & Closed", idx: 3 }
    ];

    const displayStatusText = reqStatus === "pickup_replace" 
      ? "Pickup & Replace" 
      : reqStatus === "completed" 
        ? (isExchange ? "Exchange Completed" : "Return Completed") 
        : reqStatus.replace("_", " ");

    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <RefreshCw size={20} className="stroke-[2.25]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-700 tracking-tight flex items-center gap-1.5 flex-wrap">
                <span>{isExchange ? "Exchange Request Tracking" : "Return Request Tracking"}</span>
                {itemTitle && <span className="text-[#FD7100] font-extrabold text-sm border-l-2 border-slate-200 pl-2">({itemTitle})</span>}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                {isExchange ? "Tracking your replacement variant fulfillment & doorstep swap" : "Tracking your product return and item collection"}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isRejected ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}>
            {displayStatusText}
          </span>
        </div>

        {!isRejected ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {steps.map((s, i) => {
              const isComp = ["completed", "refunded", "exchanged"].includes(reqStatus) || currentIdx >= s.idx;
              const isCurr = currentIdx === s.idx && !["completed", "refunded", "exchanged"].includes(reqStatus);

              return (
                <div key={i} className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-50/70 border border-gray-100">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold mb-1.5 ${isComp ? "bg-[#FD7100] text-white" : isCurr ? "bg-amber-500 text-white animate-pulse" : "bg-gray-200 text-gray-500"
                    }`}>
                  {isComp ? <Check size={14} className="stroke-[3]" /> : i + 1}
                  </div>
                  <span className={`text-xs font-bold ${isComp ? "text-slate-700" : isCurr ? "text-amber-700 font-extrabold" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium mt-0.5 leading-tight">
                    {s.desc}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
            <AlertCircle size={22} className="text-rose-600 shrink-0" />
            <div>
              <h4 className="text-sm font-bold">Request Declined</h4>
              <p className="text-xs font-medium opacity-90">Your {type} request could not be approved. Please check customer notifications or support messages below for details.</p>
            </div>
          </div>
        )}
      </div>
    );
  };



  // Refund Tracking
  const renderRefundTracking = (req) => {
    if (!req) return null;
    const type = req.type || "return";
    const refundStatus = (req.refundStatus || "not_required").toLowerCase();

    // Show only when applicable
    if (type === "exchange" && req.settlementType !== "refund" && refundStatus === "not_required") return null;

    const refundAmount = req.refundAmount || req.originalPrice || (type === "exchange" && req.priceDifference < 0 ? Math.abs(req.priceDifference) : req.product?.price || req.product?.sellingPrice || order.totalAmount || 0);
    const refundMethod = req.refundMethod || order.paymentMethod?.toUpperCase() || "Original Payment Mode";

    const isDone = req.status === "refunded" || refundStatus === "completed";

    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <DollarSign size={20} className="stroke-[2.25]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-700 tracking-tight">Refund Progress & Settlement</h3>
              <p className="text-xs text-gray-500 font-medium">Tracking financial credit to your payment source</p>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isDone ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : refundStatus === "failed" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
            {isDone ? "Completed" : refundStatus === "not_required" ? "Initiating Soon" : refundStatus}
          </span>
        </div>

        {/* Read-Only Refund Totals & Date Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-200/60 text-xs">
          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Refund Amount:</span>
            <span className="font-extrabold text-base text-slate-700">₹{Number(refundAmount).toLocaleString("en-IN")}</span>
          </div>
          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Settlement Method:</span>
            <span className="font-bold text-slate-700">{refundMethod}</span>
          </div>
          <div>
            <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Completion Date:</span>
            <span className="font-bold text-slate-700">{isDone ? formatDate(req.refundProcessedAt || req.updatedAt) : "Processing In Progress"}</span>
          </div>
          {req.refundTransactionId && (
            <div>
              <span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Reference / Txn ID:</span>
              <span className="font-mono font-bold text-slate-700 break-all">{req.refundTransactionId}</span>
            </div>
          )}
        </div>

        {/* Customer Friendly Explanatory Message */}
        <p className="text-xs font-semibold text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center gap-2">
          {isDone ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-600" />
              Your refund has been successfully finalized and credited to your payment account.
            </span>
          ) : (
            <span>
              Your refund is being communicated directly with financial payment gateways and will reflect according to normal banking timelines.
            </span>
          )}
        </p>
      </div>
    );
  };

  // Customer Timeline (Reusing existing timeline component with friendly language)
  const renderCustomerTimeline = () => {
    const orderEvents = Array.isArray(order.timeline) ? order.timeline : [];
    const allReturnEvents = returnRequests.flatMap(req => Array.isArray(req.timeline) ? req.timeline : []);

    const combined = [...orderEvents, ...allReturnEvents]
      .filter(ev => !String(ev.type || "").toLowerCase().includes("qc") && !String(ev.type || "").toLowerCase().includes("quality check"))
      .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));

    if (combined.length === 0) return null;

    const translateCustomerEvent = (ev) => {
      const t = String(ev.type || "").toLowerCase();
      let title = ev.type || "Update Received";
      let subtitle = ev.description || "";

      if (t.includes("refund initiated")) {
        title = "Refund Initiated";
        subtitle = "Your refund has been initiated and is currently being processed.";
      } else if (t.includes("refund completed") || t.includes("refunded")) {
        title = "Refund Completed";
        subtitle = "Your refund has been successfully completed and settled.";
      } else if (t.includes("pickup scheduled") || t === "pickup") {
        title = "Pickup Scheduled";
        subtitle = "A logistics courier has been assigned to collect your return item.";
      } else if (t.includes("pickup_replace") || t.includes("pickup & replace")) {
        title = "Pickup & Replace Scheduled";
        subtitle = "Courier assigned to collect item and deliver replacement.";
      } else if (t.includes("picked up")) {
        title = "Item Collected";
        subtitle = "Your item has been picked up by the logistics courier.";
      } else if (t.includes("out for delivery") || t.includes("on_the_way")) {
        title = "Out for Delivery";
        subtitle = "Your package is out for delivery.";
      }

      return { title, subtitle };
    };

    const formattedSteps = combined.map((ev, idx) => {
      const { title, subtitle } = translateCustomerEvent(ev);
      return {
        eventId: ev.eventId || idx,
        title,
        date: formatDate(ev.timestamp),
        subtitle,
        isCompleted: true,
      };
    });

    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-700 tracking-tight flex items-center gap-2 border-b border-gray-100 pb-3">
          <Clock size={18} className="text-[#FD7100] stroke-[2.25]" />
          <span>Complete Journey & Timeline History</span>
        </h3>

        <div className="px-2 pt-1 max-h-[350px] overflow-y-auto custom-scrollbar">
          {/* Reusing existing TimelineItem component from Phase 2 without modification */}
          <TimelineItem steps={formattedSteps} isAuditLog={true} />
        </div>
      </div>
    );
  };

  // Customer Notes & Updates 
  const renderCustomerNotes = () => {
    const allReturnNotes = returnRequests.flatMap(req => Array.isArray(req.adminNotes) ? req.adminNotes : []);
    const allNotes = [...(order.adminNotes || []), ...allReturnNotes];

    // Strictly display ONLY notes where visibleToCustomer is explicitly true
    const customerVisibleNotes = allNotes.filter(
      (n) => n && (n.visibleToCustomer === true || n.visibleToCustomer === "true")
    );

    // If no customer notes exist, render nothing.
    if (customerVisibleNotes.length === 0) return null;

    return (
      <div className="bg-gradient-to-br from-orange-50/70 via-white to-slate-50/90 rounded-2xl border border-orange-100 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-orange-950 font-bold text-base border-b border-orange-100 pb-3">
          <MessageSquare size={18} className="text-[#FD7100] stroke-[2.25]" />
          <span>Customer Case Updates & Notifications</span>
        </div>

        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
          {customerVisibleNotes.map((noteItem, index) => (
            <div key={index} className="p-4 bg-white rounded-xl border border-orange-200/70 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold">
                <span className="uppercase text-[#FD7100] tracking-wider">SwagSync Support Notification</span>
                <span>{formatDate(noteItem.createdAt)}</span>
              </div>
              <p className="text-sm font-semibold text-slate-700 leading-snug">
                "{noteItem.note || String(noteItem)}"
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Smart Conditional Rendering Orchestration
  return (
    <div id="customer-order-tracking" className="space-y-6 pt-2 pb-4">
      {renderOrderTracker()}
      {returnRequests.map((req, idx) => (
        <div key={req._id || idx} className="space-y-6 pt-2 border-t-2 border-orange-50/60">
          {renderReturnExchangeTracker(req)}
          {renderRefundTracking(req)}
        </div>
      ))}
      {renderCustomerTimeline()}
      {renderCustomerNotes()}
    </div>
  );
};

export default CustomerTrackingCard;
