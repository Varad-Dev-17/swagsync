import React from 'react';
import { Check } from 'lucide-react';

const ReturnTrackingTimelineCard = ({ returnRequest }) => {
  if (!returnRequest) return null;

  const isExchange = returnRequest.type === "exchange";
  const status = String(returnRequest.status || "pending").toLowerCase();
  const isRejected = status === "rejected";

  const formatDate = (dateVal) => {
    if (!dateVal) return null;
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
      return null;
    }
  };

  const timeline = Array.isArray(returnRequest.timeline) ? returnRequest.timeline : [];
  const requestedEvent = timeline.find(e => String(e.type || "").toLowerCase().includes("request") || String(e.type || "").toLowerCase().includes("pending"));
  const approvedEvent = timeline.find(e => String(e.type || "").toLowerCase().includes("approve"));
  const pickupEvent = timeline.find(e => String(e.type || "").toLowerCase().includes("pickup") || String(e.type || "").toLowerCase().includes("picked"));
  const completedEvent = timeline.find(e => String(e.type || "").toLowerCase().includes("complete") || String(e.type || "").toLowerCase().includes("refund"));

  const isCompletedStep = (idx) => {
    if (idx === 0) return true;
    if (idx === 1) {
      return ["approved", "pickup", "pickup_scheduled", "pickup_replace", "picked_up", "received", "packed", "shipped", "completed", "refunded", "exchanged"].includes(status);
    }
    if (idx === 2) {
      return ["pickup", "pickup_scheduled", "pickup_replace", "picked_up", "received", "packed", "shipped", "completed", "refunded", "exchanged"].includes(status);
    }
    if (idx === 3) {
      return ["completed", "refunded", "exchanged"].includes(status);
    }
    return false;
  };

  const isCurrentStep = (idx) => {
    if (idx === 1 && status === "pending") return true;
    if (idx === 2 && status === "approved") return true;
    if (idx === 3 && ["pickup", "pickup_scheduled", "pickup_replace", "picked_up", "received", "packed", "shipped"].includes(status)) return true;
    return false;
  };

  const steps = [
    {
      title: isExchange ? "Exchange Requested" : "Requested",
      date: formatDate(requestedEvent?.timestamp || returnRequest.createdAt) || "09 Sept 2026, 04:14 pm",
      idx: 0,
      isDone: true,
      isCurrent: false,
      isError: false,
    },
    {
      title: isRejected ? (isExchange ? "Exchange Rejected" : "Rejected") : (isExchange ? "Exchange Approved" : "Approved"),
      date: (isCompletedStep(1) || isRejected) ? (formatDate(approvedEvent?.timestamp || returnRequest.updatedAt) || "09 Sept 2026, 05:30 pm") : null,
      idx: 1,
      isDone: isCompletedStep(1),
      isCurrent: isCurrentStep(1),
      isError: isRejected,
    },
    {
      title: isExchange ? "Pickup & Replace" : "Pickup",
      date: isCompletedStep(2) ? formatDate(pickupEvent?.timestamp || returnRequest.updatedAt) : null,
      idx: 2,
      isDone: isCompletedStep(2),
      isCurrent: isCurrentStep(2),
      isError: false,
    },
    {
      title: isExchange ? "Exchange Completed" : "Return Completed",
      date: isCompletedStep(3) ? formatDate(completedEvent?.timestamp || returnRequest.updatedAt) : null,
      idx: 3,
      isDone: isCompletedStep(3),
      isCurrent: isCurrentStep(3),
      isError: false,
    }
  ];

  return (
    <div className="p-4 sm:p-5 space-y-4">
      <h3 className="text-sm font-bold text-slate-800 tracking-tight">
        {isExchange ? "Exchange Tracking" : "Return Tracking"}
      </h3>

      {/* Horizontal Stepper without redundant badge descriptions */}
      <div className="flex items-start justify-between relative pt-1 px-2">
        {steps.map((s, index) => {
          const isLast = index === steps.length - 1;
          const nextStep = steps[index + 1];
          const isLineGreen = s.isDone && (nextStep?.isDone || nextStep?.isCurrent);
          const isLineRed = s.isDone && nextStep?.isError;

          let nodeStyle = "bg-slate-200 text-slate-400";
          let nodeContent = <div className="w-1.5 h-1.5 rounded-full bg-white/70" />;

          if (s.isError) {
            nodeStyle = "bg-rose-500 text-white shadow-2xs";
            nodeContent = <span className="text-[10px] font-bold">✕</span>;
          } else if (s.isDone) {
            nodeStyle = "bg-emerald-500 text-white shadow-2xs";
            nodeContent = <Check size={12} className="stroke-[3]" />;
          } else if (s.isCurrent) {
            nodeStyle = "bg-amber-400 text-white ring-2 ring-amber-100 animate-pulse";
            nodeContent = <div className="w-2 h-2 rounded-full bg-white" />;
          }

          return (
            <div key={index} className="flex-1 flex flex-col items-center relative text-center">
              {/* Connector Line between nodes */}
              {!isLast && (
                <div
                  className={`absolute top-3 left-1/2 w-full h-0.5 -z-0 transition-colors ${
                    isLineRed ? "bg-rose-500" : isLineGreen ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}

              {/* Circle Node */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all ${nodeStyle}`}>
                {nodeContent}
              </div>

              {/* Step Title & Timestamp Only (Descriptions removed as requested) */}
              <div className="mt-2 space-y-0.5 px-1">
                <div className={`text-xs font-bold ${
                  s.isError ? "text-rose-700" : s.isDone || s.isCurrent ? "text-slate-800" : "text-slate-400"
                }`}>
                  {s.title}
                </div>
                {s.date && (
                  <div className="text-[11px] text-slate-400 font-medium">
                    {s.date}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReturnTrackingTimelineCard;
