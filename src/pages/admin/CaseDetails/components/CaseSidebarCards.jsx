import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Send, 
  ExternalLink, 
  ChevronDown,
  Loader2,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CopyBadge from './CopyBadge';

const CaseSidebarCards = ({
  returnRequest,
  order = {},
  onUpdateStatus,
  isProcessing = false,
  isReturnView = false,
  associatedReturn = null
}) => {
  const navigate = useNavigate();
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  if (!returnRequest && !order) return null;

  const isExchange = returnRequest?.type === "exchange";
  const status = String(returnRequest?.status || order?.status || "pending").toLowerCase();

  // Customer info
  const customer = returnRequest?.user || order?.user || {};
  const customerName = customer.username || customer.name || "Customer";
  const customerEmail = customer.email || "No email";
  const customerPhone = customer.mobileNo || customer.phone || order?.shippingAddress?.mobileNo || order?.shippingAddress?.phone || "No phone";

  // Order identifiers
  const rawOrder = returnRequest?.order || order;
  const orderObjId = typeof rawOrder === "object" ? (rawOrder?._id ? String(rawOrder._id) : "") : (rawOrder ? String(rawOrder) : "");
  const orderDisplayId = typeof rawOrder === "object" ? (rawOrder?.orderId || (orderObjId ? `#${orderObjId.slice(-6).toUpperCase()}` : "")) : "";

  // Shipping Address
  const shippingAddress = order?.shippingAddress || (typeof returnRequest?.order === "object" ? returnRequest?.order?.shippingAddress : {}) || {};
  const fullAddressStr = [
    shippingAddress.address || shippingAddress.street,
    shippingAddress.city,
    shippingAddress.state,
    shippingAddress.country,
    shippingAddress.pincode
  ].filter(Boolean).join(", ") || "No address recorded";

  // Payment Financials
  const orderItems = Array.isArray(order?.items) ? order.items : [];
  const itemsCount = orderItems.length || 1;
  const deliveryFee = order?.shippingAmount !== undefined ? order.shippingAmount : (isReturnView ? 49 : 0);
  const paymentMethod = (order?.paymentMethod || (typeof returnRequest?.order === "object" && returnRequest?.order?.paymentMethod) || "COD").toUpperCase();

  // Return view vs Order view financials
  const itemPrice = isReturnView
    ? (returnRequest?.refundAmount || returnRequest?.originalPrice || returnRequest?.product?.price || 999)
    : (orderItems.reduce((acc, item) => acc + (Number(item?.sellingPrice ?? item?.price ?? 0) * Number(item?.quantity || 1)), 0) || Number(order?.totalAmount || 0));

  const totalAmount = isReturnView
    ? (returnRequest?.refundAmount || itemPrice)
    : Number(order?.totalAmount || itemPrice);

  const gstAmount = !isReturnView
    ? orderItems.reduce((acc, item) => acc + (Number(item?.gstAmount || 0) * Number(item?.quantity || 1)), 0)
    : 0;

  // Next actionable button logic
  let primaryActionLabel = null;
  let nextTargetStatus = null;

  if (isReturnView) {
    if (status === "pending") {
      primaryActionLabel = "Approve Request";
      nextTargetStatus = "approved";
    } else if (status === "approved") {
      primaryActionLabel = isExchange ? "Schedule Pickup & Swap" : "Schedule Pickup";
      nextTargetStatus = isExchange ? "pickup_replace" : "pickup";
    } else if (status === "pickup" || status === "pickup_scheduled" || status === "pickup_replace") {
      primaryActionLabel = isExchange ? "Complete Exchange" : "Complete Return";
      nextTargetStatus = "completed";
    }
  } else {
    // Order View Workflow
    if (status === "pending") {
      primaryActionLabel = "Mark as Packed";
      nextTargetStatus = "packed";
    } else if (status === "packed" || status === "processing") {
      primaryActionLabel = "Mark as Shipped";
      nextTargetStatus = "shipped";
    } else if (status === "shipped") {
      primaryActionLabel = "Out for Delivery";
      nextTargetStatus = "on_the_way";
    } else if (status === "on_the_way") {
      primaryActionLabel = "Mark as Delivered";
      nextTargetStatus = "delivered";
    }
  }

  // Dropdown options
  const returnStatusOptions = isExchange ? [
    { value: "approved", label: "Approve" },
    { value: "pickup_replace", label: "Pickup & Replace" },
    { value: "completed", label: "Exchange Completed" },
    { value: "rejected", label: "Reject / Cancel" }
  ] : [
    { value: "approved", label: "Approve" },
    { value: "pickup", label: "Pickup" },
    { value: "completed", label: "Return Completed" },
    { value: "rejected", label: "Reject / Cancel" }
  ];

  const orderStatusOptions = [
    { value: "pending", label: "Order Confirmed" },
    { value: "packed", label: "Packed" },
    { value: "shipped", label: "Shipped" },
    { value: "on_the_way", label: "Out for delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" }
  ];

  const statusOptions = isReturnView ? returnStatusOptions : orderStatusOptions;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
      
      {/* 1. Customer Details */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
          <User size={14} className="text-[#4F46E5]" />
          <span>Customer Details</span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="font-bold text-slate-800 text-sm">
            {customerName}
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <Mail size={13} className="text-slate-400 shrink-0" />
            <CopyBadge text={customerEmail} label="Email" className="font-medium truncate text-slate-700">
              {customerEmail}
            </CopyBadge>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <Phone size={13} className="text-slate-400 shrink-0" />
            <CopyBadge text={customerPhone} label="Phone number" className="font-medium text-slate-700">
              {customerPhone}
            </CopyBadge>
          </div>
        </div>

        {/* View Order Link - Only in Return View */}
        {orderObjId && isReturnView && (
          <button
            onClick={() => navigate(`/admin/orders/${orderObjId}`)}
            className="w-full py-2 px-3 rounded-lg bg-indigo-50/80 hover:bg-indigo-100 text-[#4F46E5] font-bold text-xs border border-indigo-100 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <ExternalLink size={12} className="stroke-[2.5]" />
            <span>View Order {orderDisplayId ? `(${orderDisplayId})` : ""}</span>
          </button>
        )}

        {/* View Return Link - If on Order View and order has active claim */}
        {!isReturnView && associatedReturn && (
          <button
            onClick={() => navigate(`/admin/returns/${associatedReturn._id}`)}
            className="w-full py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <ExternalLink size={12} className="stroke-[2.5]" />
            <span>View Return Request (#{associatedReturn._id.slice(-6).toUpperCase()})</span>
          </button>
        )}
      </div>

      {/* 2. Shipping Address */}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
          <MapPin size={14} className="text-[#4F46E5]" />
          <span>Shipping Address</span>
        </div>

        <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
          <CopyBadge text={fullAddressStr} label="Address" className="hover:text-slate-800 text-left">
            {fullAddressStr}
          </CopyBadge>
        </div>
      </div>

      {/* 3. Payment Summary (Essential only, no duplicate refund details) */}
      <div className="p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <CreditCard size={14} className="text-[#4F46E5]" />
            <span>Payment Summary</span>
          </div>
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            {paymentMethod}
          </span>
        </div>

        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span>{isReturnView ? "Item Price (1 unit)" : `Items (${itemsCount} ${itemsCount === 1 ? 'unit' : 'units'})`}</span>
            <span className="font-bold text-slate-800 font-mono">₹{Number(itemPrice).toLocaleString("en-IN")}</span>
          </div>

          <div className="flex items-center justify-between">
            <span>Delivery Fee</span>
            <span className="text-slate-500 font-mono">
              {deliveryFee > 0 ? `₹${deliveryFee} (Non-refundable)` : "FREE (₹0)"}
            </span>
          </div>

          {gstAmount > 0 && (
            <div className="flex items-center justify-between">
              <span>Tax (Total GST)</span>
              <span className="text-amber-700 font-mono font-semibold">
                ₹{Number(gstAmount).toLocaleString("en-IN")}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-bold text-sm text-slate-900">
            <span>Total Amount</span>
            <span className="font-mono text-base font-bold text-[#4F46E5]">₹{Number(totalAmount).toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* 4. Actions */}
      <div className="p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
          <Send size={13} className="text-[#4F46E5]" />
          <span>Actions</span>
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Primary Action Button */}
          {primaryActionLabel && (
            <button
              disabled={isProcessing}
              onClick={() => nextTargetStatus && onUpdateStatus && onUpdateStatus(nextTargetStatus)}
              className="flex-1 py-2 px-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? <Loader2 size={12} className="animate-spin" /> : null}
              <span>{primaryActionLabel}</span>
            </button>
          )}

          {/* Update Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Update Status</span>
              <ChevronDown size={13} className="text-slate-500" />
            </button>

            {showStatusMenu && (
              <div className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400">Change Status to</div>
                {statusOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setShowStatusMenu(false);
                      if (onUpdateStatus) onUpdateStatus(opt.value);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-[#4F46E5] flex items-center justify-between cursor-pointer"
                  >
                    <span>{opt.label}</span>
                    {status === opt.value && <Check size={12} className="text-[#4F46E5]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default CaseSidebarCards;
