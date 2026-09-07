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
          {status === "pending" ? "Order Confirmed" : status === "processing" ? "Packed" : status === "on_the_way" ? "On The Way" : status.replace(/_/g, " ")}
        </span>
      </div>

      {!isCancelled ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {[
            { label: "Order Confirmed", desc: "Verified & Approved", icon: Clock, idx: 0 },
            { label: "Packed", desc: "Packed & Verified", icon: Package, idx: 1 },
            { label: "Shipped", desc: order.trackingNumber ? `AWB: ${order.trackingNumber}` : "Dispatched", icon: Truck, idx: 2 },
            { label: "On The Way", desc: "Out for Delivery", icon: Truck, idx: 3 },
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

  // Return & Exchange Dedicated Tracker
  const renderReturnExchangeTracker = (req) => {
    const type = req.type || "return";
    const reqStatus = (req.status || "pending").toLowerCase();
    const isRejected = reqStatus === "rejected";

    const matchingItem = order?.items?.find(item => (item.product?._id || item.product) === (req.product?._id || req.product));
    const itemTitle = matchingItem?.product?.title || matchingItem?.product?.name || "";

    const stepsList = type === "exchange" 
      ? ["pending", "approved", "packed", "shipped", "pickup_scheduled", "picked_up", "exchanged"]
      : ["pending", "approved", "pickup_scheduled", "picked_up", "received"];
    const currentIdx = stepsList.indexOf(reqStatus);

    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <RefreshCw size={20} className="stroke-[2.25]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-700 tracking-tight flex items-center gap-1.5 flex-wrap">
                <span>{type === "exchange" ? "Exchange Request Tracking" : "Return Request Tracking"}</span>
                {itemTitle && <span className="text-[#FD7100] font-extrabold text-sm border-l-2 border-slate-200 pl-2">({itemTitle})</span>}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                {type === "exchange" ? "Tracking your replacement variant fulfillment & doorstep swap" : "Tracking your product return and item collection"}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isRejected ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}>
            {reqStatus.replace("_", " ")}
          </span>
        </div>

        {!isRejected ? (
          <div className={`grid grid-cols-2 ${type === "exchange" ? "sm:grid-cols-4 lg:grid-cols-7" : "sm:grid-cols-5"} gap-2.5 pt-2`}>
            {(type === "exchange" ? [
              { label: "Exchange Requested", desc: "Submitted", idx: 0 },
              { label: "Approved", desc: "Reserved", idx: 1 },
              { label: "Packed", desc: "Item Packed", idx: 2 },
              { label: "Shipped", desc: "Dispatched", idx: 3 },
              { label: "Out for Exchange", desc: "En Route", idx: 4 },
              { label: "Quality Check", desc: "Tag Inspection", idx: 5 },
              { label: "Exchanged", desc: "Swapped", idx: 6 }
            ] : [
              { label: "Return Requested", desc: "Submitted", idx: 0 },
              { label: "Approved", desc: "Reviewed & Verified", idx: 1 },
              { label: "Pickup Scheduled", desc: "Courier Assigned", idx: 2 },
              { label: "Picked Up", desc: "Collected by Courier", idx: 3 },
              { label: "Received", desc: "Arrived at Facility", idx: 4 }
            ]).map((s, i) => {
              const isComp = ["refunded", "exchanged"].includes(reqStatus) || currentIdx >= s.idx;
              const isCurr = currentIdx === s.idx && !["refunded", "exchanged"].includes(reqStatus);

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

  // Quality Check (QC) Tracking
  const renderQcTracking = (req) => {
    if (!req) return null;
    const qcStatus = (req.qcStatus || "pending").toLowerCase();
    const reqStatus = (req.status || "pending").toLowerCase();

    const showQc = ["picked_up", "received", "refunded", "exchanged"].includes(reqStatus) || qcStatus !== "pending";
    if (!showQc) return null;

    return (
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-900/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck size={22} className="stroke-[2.25]" />
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-tight text-white">Quality Inspection Status</h4>
              <p className="text-xs text-indigo-200 font-medium">Verifying product brand tags and condition during doorstep collection or upon facility intake</p>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${qcStatus === "passed" ? "bg-emerald-500 text-white" : qcStatus === "failed" ? "bg-rose-500 text-white" : "bg-amber-400 text-slate-950 font-extrabold"
            }`}>
            {qcStatus === "passed" ? "Passed Inspection" : qcStatus === "failed" ? "Inspection Failed" : "Pending Inspection"}
          </span>
        </div>

        {/* Customer Friendly Explanatory Text */}
        <div className="p-3.5 bg-white/10 rounded-xl border border-white/15 text-xs font-medium leading-relaxed">
          {qcStatus === "passed" ? (
            <span className="text-emerald-300 font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              Your item's quality, tags, and condition have been verified successfully.
            </span>
          ) : qcStatus === "failed" ? (
            <div className="space-y-1 text-rose-200">
              <p className="font-bold flex items-center gap-1.5 text-rose-300">
                <XCircle size={15} className="shrink-0" />
                We were unable to verify your return during item quality inspection:
              </p>
              <p className="italic pl-5 font-semibold bg-black/20 p-2 rounded-lg border border-rose-500/30">
                "{req.qcReason || "Item condition check did not pass original verification standards."}"
              </p>
            </div>
          ) : (
            <span className="text-indigo-200 flex items-center gap-2">
              <Clock size={16} className="text-amber-300 shrink-0" />
              Your item is awaiting quality check of brand tags, packaging, and condition during courier collection or upon intake.
            </span>
          )}
        </div>
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

    const combined = [...orderEvents, ...allReturnEvents].sort((a, b) => {
      return new Date(a.timestamp || 0) - new Date(b.timestamp || 0);
    });

    if (combined.length === 0) return null;

    const translateCustomerEvent = (ev) => {
      const t = String(ev.type || "").toLowerCase();
      let title = ev.type || "Update Received";
      let subtitle = ev.description || "";

      if (t.includes("qc passed") || t.includes("quality check passed")) {
        title = "Inspection Passed";
        subtitle = "Your returned item has been inspected successfully.";
      } else if (t.includes("qc failed") || t.includes("quality check failed")) {
        title = "Inspection Did Not Pass";
        subtitle = `We were unable to verify your return during inspection: ${activeReturn?.qcReason || "Condition mismatch."}`;
      } else if (t.includes("refund initiated")) {
        title = "Refund Initiated";
        subtitle = "Your refund has been initiated and is currently being processed.";
      } else if (t.includes("refund completed") || t.includes("refunded")) {
        title = "Refund Completed";
        subtitle = "Your refund has been successfully completed and settled.";
      } else if (t.includes("pickup scheduled")) {
        title = "Pickup Scheduled";
        subtitle = "A logistics courier has been assigned to collect your return item.";
      } else if (t.includes("picked up")) {
        title = "Item Collected";
        subtitle = "Your item has been picked up by the logistics courier.";
      } else if (t.includes("received")) {
        title = "Arrived at Warehouse";
        subtitle = "Your item has arrived at our facility for quality verification.";
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
          {renderQcTracking(req)}
          {renderRefundTracking(req)}
        </div>
      ))}
      {renderCustomerTimeline()}
      {renderCustomerNotes()}
    </div>
  );
};

export default CustomerTrackingCard;
