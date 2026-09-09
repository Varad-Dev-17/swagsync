import React from "react";
import { Activity } from "lucide-react";
import StatusBadge from "../../../../components/admin/ui/StatusBadge";

const CaseStatusSummary = ({ order = null, returnRequest = null }) => {
  if (!order && !returnRequest) return null;

  const hasRefund = returnRequest && (returnRequest.type === "return" || returnRequest.settlementType === "refund" || (returnRequest.refundStatus && returnRequest.refundStatus !== "not_required"));

  return (
    <div className="w-full space-y-3 py-4 border-b border-gray-100 first:pt-0 last:pb-0 last:border-b-0">
      
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-[#4F46E5] flex items-center justify-center shrink-0">
          <Activity size={17} className="stroke-[2.5]" />
        </span>
        <h3 className="font-bold text-slate-700 text-base tracking-tight">
          Request Summary
        </h3>
      </div>

      {/* 2-Column alignment for status badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 my-1.5 text-xs w-full">
        {order && (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-semibold text-slate-600">Order Status :</span>
            <StatusBadge status={order.status || "pending"} />
          </div>
        )}

        {order && (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-semibold text-slate-600">Payment Status :</span>
            <StatusBadge status={(returnRequest && (returnRequest.refundStatus === "completed" || returnRequest.status === "refunded")) ? "refunded" : (order.status === "delivered" && (!order.paymentStatus || order.paymentStatus === "pending") ? "paid" : order.paymentStatus || order.paymentMethod || "pending")} />
          </div>
        )}

        {returnRequest && (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-semibold text-slate-600">
              {returnRequest.type === "exchange" ? "Exchange Status :" : "Return Status :"}
            </span>
            <StatusBadge 
              status={returnRequest.status || "pending"} 
              labelOverride={
                returnRequest.status === "completed" 
                  ? (returnRequest.type === "exchange" ? "Exchange Completed" : "Return Completed")
                  : null
              }
            />
          </div>
        )}

        {hasRefund && (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-semibold text-slate-600">Refund Status :</span>
            <StatusBadge status={returnRequest.refundStatus || "not_required"} />
          </div>
        )}
      </div>

    </div>
  );
};

export default CaseStatusSummary;
