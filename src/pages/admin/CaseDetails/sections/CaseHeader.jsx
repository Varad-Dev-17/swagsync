import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer, ExternalLink, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CopyBadge from '../components/CopyBadge';

const CaseHeader = ({ 
  title, 
  subtitle, 
  status, 
  statusOptions = [], 
  onUpdateStatus, 
  returnRequest = null,
  order = null,
  onUpdateRefundStatus = null,
  isUpdating = false, 
  isReturnView = false 
}) => {
  const [selectedStatus, setSelectedStatus] = useState(status || "");
  const navigate = useNavigate();

  const isExchange = returnRequest?.type === "exchange";

  useEffect(() => {
    setSelectedStatus(status || "");
  }, [status]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate(isReturnView ? "/admin/returns" : "/admin/orders");
      } else if ((e.altKey || e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isReturnView]);

  const handleStatusChange = (e) => {
    const newVal = e.target.value;
    setSelectedStatus(newVal);
    if (onUpdateStatus && newVal !== status) {
      onUpdateStatus(newVal);
    }
  };

  // Associated order info
  const rawOrder = returnRequest?.order || order;
  const orderObjId = typeof rawOrder === "object" ? (rawOrder?._id ? String(rawOrder._id) : "") : (rawOrder ? String(rawOrder) : "");
  const orderDisplayId = typeof rawOrder === "object" ? (rawOrder?.orderId || "") : "";

  // Title code for copy
  const idMatch = title?.match(/#[A-Za-z0-9]+/);
  const copyableCode = idMatch ? idMatch[0].replace("#", "") : "";

  // Status options
  const defaultOptions = isExchange ? [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "pickup_replace", label: "Pickup & Replace" },
    { value: "completed", label: "Exchange Completed" },
    { value: "rejected", label: "Rejected" }
  ] : [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "pickup", label: "Pickup" },
    { value: "completed", label: "Return Completed" },
    { value: "rejected", label: "Rejected" }
  ];

  const currentOptions = (statusOptions && statusOptions.length > 0) ? statusOptions : defaultOptions;

  // Clean status color style for header dropdown matching screenshot
  const getStatusPillStyle = (st) => {
    const s = String(st || "").toLowerCase();
    if (["completed", "refunded", "exchanged", "delivered"].includes(s)) {
      return "bg-emerald-50 border-emerald-200 text-emerald-800";
    }
    if (["rejected", "cancelled"].includes(s)) {
      return "bg-rose-50 border-rose-200 text-rose-800";
    }
    if (["approved", "pickup", "pickup_replace", "packed", "shipped", "on_the_way"].includes(s)) {
      return "bg-indigo-50 border-indigo-200 text-indigo-800";
    }
    return "bg-amber-50/90 border-amber-200 text-amber-900";
  };

  return (
    <div className="pb-3 mb-4 print:hidden space-y-1.5">
      
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <button
          onClick={() => navigate(isReturnView ? "/admin/returns" : "/admin/orders")}
          className="inline-flex items-center gap-1 hover:text-[#4F46E5] transition-colors cursor-pointer"
        >
          <ArrowLeft size={13} className="stroke-[2]" />
          <span>{isReturnView ? "Returns & Exchanges" : "Orders"}</span>
        </button>
        <span className="text-slate-300 font-bold">&gt;</span>
        <span className="text-slate-700 font-semibold truncate max-w-[250px] sm:max-w-none">
          {title || "Case Details"}
        </span>
      </div>

      {/* Main Title Row & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-0.5">
        
        {/* Left: Title & Subtitle */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{title || "Case Details"}</span>
              {copyableCode && (
                <CopyBadge text={copyableCode} label="Case ID" showIcon={true} className="text-slate-400 hover:text-[#4F46E5]">
                  <span className="sr-only">Copy ID</span>
                </CopyBadge>
              )}
            </h1>
          </div>

          {subtitle && (
            <p className="text-xs text-slate-500 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          
          {/* Status Select Pill */}
          <div className={`relative inline-flex items-center border rounded-lg shadow-2xs font-semibold text-xs transition-colors ${getStatusPillStyle(selectedStatus)}`}>
            <span className="pl-2.5 py-1.5 text-slate-600 font-bold whitespace-nowrap">
              {isExchange ? "Exchange:" : isReturnView ? "Return:" : "Status:"}
            </span>
            <select
              value={selectedStatus}
              onChange={handleStatusChange}
              disabled={isUpdating}
              className="bg-transparent pl-1 pr-6 py-1.5 font-semibold text-xs outline-none cursor-pointer capitalize"
            >
              {currentOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white text-slate-700 font-medium text-xs py-1">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Order Link Button */}
          {orderObjId && isReturnView && (
            <button
              onClick={() => navigate(`/admin/orders/${orderObjId}`)}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <ExternalLink size={12} className="text-[#4F46E5] stroke-[2.5]" />
              <span>View Order</span>
            </button>
          )}

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Printer size={12} className="text-[#4F46E5] stroke-[2]" />
            <span>Print</span>
          </button>

          {/* More Options Button */}
          <button 
            onClick={() => navigate(isReturnView ? "/admin/returns" : "/admin/orders")}
            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="More Options"
          >
            <MoreVertical size={14} />
          </button>

        </div>

      </div>

    </div>
  );
};

export default CaseHeader;
