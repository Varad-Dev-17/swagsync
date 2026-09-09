import React from "react";

const StatusBadge = ({ status = "", labelOverride = null }) => {
  const s = String(status).toLowerCase().trim();

  const styles = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive: "bg-gray-100 text-gray-600 border-gray-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    processing: "bg-blue-50 text-blue-700 border-blue-200",
    packed: "bg-blue-50 text-blue-700 border-blue-200",
    shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
    on_the_way: "bg-purple-50 text-purple-700 border-purple-200",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-rose-50 text-rose-700 border-rose-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
    pickup: "bg-indigo-50 text-indigo-700 border-indigo-200",
    pickup_replace: "bg-indigo-50 text-indigo-700 border-indigo-200",
    pickup_scheduled: "bg-amber-50 text-amber-700 border-amber-200",
    picked_up: "bg-indigo-50 text-indigo-700 border-indigo-200",
    received: "bg-blue-50 text-blue-700 border-blue-200",
    refunded: "bg-purple-50 text-purple-700 border-purple-200",
    exchanged: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
    return: "bg-amber-50 text-amber-700 border-amber-200",
    exchange: "bg-purple-50 text-purple-700 border-purple-200",
    passed: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
    failed: "bg-rose-50 text-rose-700 border-rose-200 font-bold",
    not_required: "bg-gray-100 text-gray-600 border-gray-200",
    initiated: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cod: "bg-blue-50 text-blue-700 border-blue-200 uppercase",
    online: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  const style = styles[s] || (s === "active" ? styles.active : "bg-gray-100 text-gray-700 border-gray-200");

  const customLabels = {
    pickup: "Pickup",
    pickup_replace: "Pickup & Replace",
    pickup_scheduled: "Pickup",
    picked_up: "Pickup",
    on_the_way: "Out for delivery",
    packed: "Packed",
    processing: "Packed",
    completed: "Completed",
    not_required: "Not Required",
    passed: "QC Passed",
    failed: "QC Failed",
    cod: "COD",
  };

  let label = labelOverride || customLabels[s] || status || "Unknown";
  if (!labelOverride && !customLabels[s] && typeof label === "string") {
    label = label.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold border ${style} shadow-2xs whitespace-nowrap transition-colors`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
