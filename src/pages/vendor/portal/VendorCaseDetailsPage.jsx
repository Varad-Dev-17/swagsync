import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../api/axiosConfig";
import {
  ArrowLeft,
  AlertCircle,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Send,
  Loader2,
  FileText,
  Calendar,
  Eye,
  Check,
  X,
  Boxes,
  ZoomIn,
} from "lucide-react";
import ImageViewerModal from "../../admin/CaseDetails/components/ImageViewerModal";
import StatusBadge from "../../../components/admin/ui/StatusBadge";

export default function VendorCaseDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isReturnView = location.pathname.includes("/vendor/portal/returns");
  const isOrderView = location.pathname.includes("/vendor/portal/orders");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [returnData, setReturnData] = useState(null);
  const [associatedReturn, setAssociatedReturn] = useState(null);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState("request"); // "request" | "settlement" | "timeline" | "notes"

  // Lightbox modal state
  const [isImgModalOpen, setIsImgModalOpen] = useState(false);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // QC modal state
  const [qcModalOpen, setQcModalOpen] = useState(false);
  const [qcStatus, setQcStatus] = useState("passed");
  const [qcReason, setQcReason] = useState("");

  // Tracking / Courier modal state
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [shippingCourier, setShippingCourier] = useState("Delhivery");
  const [shippingTrackingNumber, setShippingTrackingNumber] = useState("");
  const [shippingTargetItemId, setShippingTargetItemId] = useState(null);

  // Notes state
  const [newNote, setNewNote] = useState("");

  const fetchCaseDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isOrderView) {
        const res = await api.get(`/vendor/portal/orders/${id}`);
        if (res.data.success && res.data.data) {
          const data = res.data.data;
          setOrderData(data);
          setReturnData(null);
          if (Array.isArray(data.returnRequests) && data.returnRequests.length > 0) {
            setAssociatedReturn(data.returnRequests[0]);
          } else {
            setAssociatedReturn(null);
          }
        }
      } else if (isReturnView) {
        const res = await api.get(`/vendor/portal/returns/${id}`);
        if (res.data.success && res.data.data) {
          const data = res.data.data;
          setReturnData(data);
          if (data.order) {
            setOrderData(data.order);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching vendor case details:", err);
      setError("Failed to load case details. The resource may not exist or access was denied.");
      toast.error("Error loading case details");
    } finally {
      setLoading(false);
    }
  }, [id, isOrderView, isReturnView]);

  useEffect(() => {
    if (id) {
      fetchCaseDetails();
    }
  }, [id, fetchCaseDetails]);

  // Update Status handler
  const handleUpdateStatus = async (newStatus) => {
    if (!newStatus) return;
    setIsUpdatingStatus(true);
    try {
      if (isOrderView) {
        const res = await api.put(`/vendor/portal/orders/${orderData?._id || id}`, { status: newStatus });
        if (res.data.success) {
          toast.success(`Order status updated to ${newStatus}`);
          setOrderData(res.data.data || { ...orderData, status: newStatus });
        }
      } else if (returnData) {
        const res = await api.put(`/vendor/portal/returns/${returnData._id || id}`, { status: newStatus });
        if (res.data.success) {
          toast.success(`Request status updated to ${newStatus}`);
          setReturnData(res.data.data || { ...returnData, status: newStatus });
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Vendor Action handler (approve, reject, qc, received)
  const handleVendorAction = async (actionPayload, successMsg = "Action processed successfully") => {
    if (!returnData) return;
    setIsUpdatingStatus(true);
    try {
      const res = await api.put(`/vendor/portal/returns/${returnData._id || id}`, actionPayload);
      if (res.data.success) {
        toast.success(res.data.message || successMsg);
        setReturnData(res.data.data || { ...returnData, ...actionPayload });
        setRejectModalOpen(false);
        setQcModalOpen(false);
      }
    } catch (err) {
      console.error("Failed vendor action:", err);
      toast.error(err.response?.data?.message || "Failed to process action");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Shipping fulfillment handler for orders
  const handleFulfillmentSubmit = async (e) => {
    e.preventDefault();
    if (!shippingTrackingNumber.trim()) {
      toast.error("Please enter a courier tracking number");
      return;
    }
    setIsUpdatingStatus(true);
    try {
      if (shippingTargetItemId) {
        // Single item fulfillment
        const res = await api.patch(
          `/vendor/portal/orders/${orderData?._id || id}/items/${shippingTargetItemId}/fulfillment`,
          {
            status: "shipped",
            courier: shippingCourier,
            trackingNumber: shippingTrackingNumber.trim(),
          }
        );
        if (res.data.success) {
          toast.success("Item marked as shipped with tracking");
          setShippingModalOpen(false);
          setShippingTrackingNumber("");
          fetchCaseDetails();
        }
      } else {
        // Overall order fulfillment
        const res = await api.put(`/vendor/portal/orders/${orderData?._id || id}`, {
          status: "shipped",
          courier: shippingCourier,
          trackingNumber: shippingTrackingNumber.trim(),
        });
        if (res.data.success) {
          toast.success("Order marked as shipped with tracking");
          setShippingModalOpen(false);
          setShippingTrackingNumber("");
          fetchCaseDetails();
        }
      }
    } catch (err) {
      console.error("Failed to update fulfillment:", err);
      toast.error(err.response?.data?.message || "Failed to dispatch order");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Save Note handler
  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) {
      toast.error("Please enter a note before saving");
      return;
    }
    setIsSavingNote(true);
    try {
      const targetEndpoint = isOrderView
        ? `/vendor/portal/orders/${orderData?._id || id}`
        : `/vendor/portal/returns/${returnData?._id || id}`;
      const res = await api.put(targetEndpoint, { note: newNote.trim() });
      if (res.data.success && res.data.data) {
        toast.success("Official note recorded");
        if (isOrderView) {
          setOrderData(res.data.data);
        } else {
          setReturnData(res.data.data);
        }
        setNewNote("");
      }
    } catch (err) {
      console.error("Failed to save note:", err);
      toast.error(err.response?.data?.message || "Failed to persist note");
    } finally {
      setIsSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="w-12 h-12 border-4 border-[#fe4a03] border-t-transparent rounded-full animate-spin shadow-md" />
        <p className="text-sm font-bold text-slate-700 tracking-tight animate-pulse">
          Loading Case Dossier & Specifications...
        </p>
      </div>
    );
  }

  if (error || (!orderData && !returnData)) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-rose-50/80 border border-rose-200 rounded-2xl text-center shadow-sm space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto stroke-[1.75]" />
        <h3 className="text-lg font-extrabold text-rose-900">Unable to Load Case Details</h3>
        <p className="text-sm font-medium text-rose-700">{error || "Case data could not be parsed."}</p>
        <button
          onClick={fetchCaseDetails}
          className="px-5 py-2.5 bg-[#fe4a03] hover:bg-[#e03f00] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Retry Fetch
        </button>
      </div>
    );
  }

  // Determine Case Mode & Status
  const isExchangeCase = isReturnView && returnData?.type === "exchange";
  const activeStatus = isReturnView ? (returnData?.status || "pending") : (orderData?.status || "pending");

  const orderStatusOptions = [
    { value: "pending", label: "Order Confirmed" },
    { value: "packed", label: "Packed" },
    { value: "shipped", label: "Shipped" },
  ];

  const returnStatusOptions = isExchangeCase
    ? [
        { value: "pending", label: "Requested" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "pickup_scheduled", label: "Picked up schedule" },
        { value: "replace_and_exchange", label: "Replace and Exchange" },
        { value: "completed", label: "Completed" },
      ]
    : [
        { value: "pending", label: "Requested" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "pickup_scheduled", label: "Picked up schedule" },
        { value: "received", label: "Recieved" },
        { value: "completed", label: "Completed" },
      ];

  const caseIdCode = isReturnView
    ? returnData?._id
      ? returnData._id.slice(-8).toUpperCase()
      : orderData?.orderId || id.slice(-8).toUpperCase()
    : orderData?.orderId || id.slice(-8).toUpperCase();

  const headerTitle = isReturnView
    ? `${isExchangeCase ? "Exchange Request" : "Return Request"} #${caseIdCode}`
    : `Order Details #${orderData?.orderId || id.slice(-8).toUpperCase()}`;

  const caseDate = new Date(
    (isReturnView ? returnData?.createdAt : orderData?.createdAt) || Date.now()
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const headerSubtitle = isReturnView
    ? `Order ${orderData?.orderId || returnData?.order?.orderId || "ORD-25"} • Submitted on ${caseDate}`
    : `Placed on ${caseDate}`;

  // Customer info
  const customer = isReturnView ? returnData?.user || orderData?.user || {} : orderData?.user || {};
  const customerName =
    customer.name ||
    customer.username ||
    orderData?.shippingAddress?.name ||
    orderData?.shippingAddress?.fullName ||
    "Customer";
  const customerEmail = customer.email || orderData?.shippingAddress?.email || "No email";
  const customerPhone =
    customer.mobileNo ||
    customer.phone ||
    orderData?.shippingAddress?.phone ||
    orderData?.shippingAddress?.mobileNo ||
    "No phone";

  // Address
  const shippingAddress = orderData?.shippingAddress || returnData?.order?.shippingAddress || {};
  const fullAddressStr =
    [
      shippingAddress.address || shippingAddress.street,
      shippingAddress.city,
      shippingAddress.state,
      shippingAddress.country,
      shippingAddress.pincode,
    ]
      .filter(Boolean)
      .join(", ") || "No address recorded";

  // Notes list
  const notesList = isReturnView
    ? returnData?.adminNotes || []
    : orderData?.adminNotes || [];

  // Return attributes helper
  const getVariantAttrs = (variant) => {
    const list = [];
    if (!variant) return list;
    if (variant.color) list.push({ label: "Color", value: variant.color });
    if (variant.size) list.push({ label: "Size", value: variant.size });
    if (Array.isArray(variant.attributes)) {
      variant.attributes.forEach((attr) => {
        if (!attr) return;
        const name = attr.attribute?.name || attr.name || "";
        const val =
          attr.option?.displayName ||
          attr.option?.storedValue ||
          attr.option?.value ||
          attr.value ||
          "";
        if (name && val && !list.some((item) => item.label.toLowerCase() === name.toLowerCase())) {
          list.push({ label: name, value: val });
        }
      });
    }
    return list;
  };

  // Pricing calculations for Return/Exchange
  const product = returnData?.product || {};
  const origVariant = returnData?.originalVariant || {};
  const reqVariant = returnData?.requestedExchangeVariant || {};
  const quantity = returnData?.quantity || 1;
  const originalPrice = returnData?.originalPrice || origVariant.price || product.price || 0;
  const exchangePrice = returnData?.exchangePrice || reqVariant.price || 0;
  const priceDiff =
    returnData?.priceDifference !== undefined
      ? returnData.priceDifference
      : isExchangeCase && exchangePrice
      ? exchangePrice - originalPrice
      : 0;

  const origAttrs = getVariantAttrs(origVariant);
  const reqAttrs = getVariantAttrs(reqVariant);

  const origImage =
    origVariant.mainImage?.url ||
    (typeof origVariant.mainImage === "string" ? origVariant.mainImage : null) ||
    product.images?.[0]?.url ||
    (typeof product.images?.[0] === "string" ? product.images[0] : null) ||
    "";

  const reqImage =
    reqVariant.mainImage?.url ||
    (typeof reqVariant.mainImage === "string" ? reqVariant.mainImage : null) ||
    origImage;

  // Evidence images
  const evidenceImages = Array.isArray(returnData?.images)
    ? returnData.images.map((img) => (typeof img === "object" && img?.url ? img.url : img))
    : [];

  // Items for order view
  const orderItems = orderData?.vendorItems || orderData?.items || [];

  return (
    <div className="w-full min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      {/* 1. Header Toolbar */}
      <div className="pb-4 mb-4 space-y-2 border-b border-slate-200">
        <button
          onClick={() => navigate(isReturnView ? "/vendor/portal/returns" : "/vendor/portal/orders")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#fe4a03] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} className="stroke-[2.5]" />
          <span>Back to {isReturnView ? "Returns & Exchanges" : "Orders"}</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{headerTitle}</h1>
              <StatusBadge status={activeStatus} />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{headerSubtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Status:</span>
              {isOrderView && (activeStatus === "shipped" || activeStatus === "on_the_way" || activeStatus === "delivered") ? (
                <span className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 font-bold text-xs text-indigo-700 shadow-2xs">
                  {activeStatus === "shipped" ? "Shipped (Admin Logistics)" : activeStatus === "on_the_way" ? "Out for delivery (Admin)" : "Delivered"}
                </span>
              ) : (
                <select
                  value={activeStatus}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  disabled={isUpdatingStatus}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 shadow-2xs focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03] transition-all cursor-pointer"
                >
                  {(isReturnView ? returnStatusOptions : orderStatusOptions).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden divide-y divide-slate-100">
          {/* RETURN / EXCHANGE VIEW */}
          {isReturnView && returnData ? (
            <>
              {/* SECTION A: Product Hero Card (Conditional on Exchange vs Return) */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#fe4a03] block">
                      {product.brand?.name || "Official Brand"}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      {product.title || "Product Title"}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-medium">
                      Order: <strong className="text-slate-800">{orderData?.orderId || returnData.order?.orderId || "ORD"}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-orange-50 text-[#fe4a03] border border-orange-100 uppercase">
                      {returnData.type || "Return"}
                    </span>
                  </div>
                </div>

                {/* EXACT SAME CONDITION: If Exchange vs If Return */}
                {isExchangeCase ? (
                  /* EXCHANGE: Side-by-side returning vs replacement variant */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                      {/* 1. Returning Variant (Collect from Customer) */}
                      <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px] uppercase border border-rose-100">
                            Returning Variant (Collect from Customer)
                          </span>
                          <span className="text-xs font-bold text-slate-500">Qty: {quantity}</span>
                        </div>

                        <div className="flex items-start gap-3.5">
                          <div className="w-16 h-20 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {origImage ? (
                              <img src={origImage} alt="Returning Variant" className="w-full h-full object-cover" />
                            ) : (
                              <Package size={24} className="text-slate-400" />
                            )}
                          </div>
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap gap-1.5">
                              {origAttrs.length > 0 ? (
                                origAttrs.map((attr, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-slate-200 text-slate-700"
                                  >
                                    {attr.label}: <strong className="ml-1 text-slate-900">{attr.value}</strong>
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-500">Original Variant</span>
                              )}
                            </div>
                            <div className="text-sm font-bold font-mono text-slate-800 pt-0.5">
                              ₹{Number(originalPrice).toLocaleString("en-IN")}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. Replacement Variant (Deliver to Customer) */}
                      <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase border border-emerald-100">
                            Replacement Variant (Deliver to Customer)
                          </span>
                          <span className="text-xs font-bold text-[#fe4a03]">Qty: {quantity}</span>
                        </div>

                        <div className="flex items-start gap-3.5">
                          <div className="w-16 h-20 rounded-lg bg-white border border-orange-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {reqImage ? (
                              <img src={reqImage} alt="Replacement Variant" className="w-full h-full object-cover" />
                            ) : (
                              <Package size={24} className="text-orange-400" />
                            )}
                          </div>
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap gap-1.5">
                              {reqAttrs.length > 0 ? (
                                reqAttrs.map((attr, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-orange-100 text-orange-900"
                                  >
                                    {attr.label}: <strong className="ml-1 text-[#fe4a03]">{attr.value}</strong>
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-500">Replacement Variant</span>
                              )}
                            </div>
                            <div className="text-sm font-bold font-mono text-[#fe4a03] pt-0.5">
                              ₹{Number(exchangePrice).toLocaleString("en-IN")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Settlement Alert Banner */}
                    <div className="p-3.5 bg-orange-50/80 border border-orange-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-orange-950 font-medium">
                        <RefreshCw size={15} className="text-[#fe4a03] shrink-0" />
                        <span>
                          {priceDiff > 0 ? (
                            <>
                              Additional payment of <strong>₹{priceDiff}</strong> collected from customer.
                            </>
                          ) : priceDiff < 0 ? (
                            <>
                              Refund difference of <strong>₹{Math.abs(priceDiff)}</strong> to be settled with customer.
                            </>
                          ) : (
                            <>Even value exchange — direct doorstep swap without payment difference.</>
                          )}
                        </span>
                      </div>
                      <span className="font-bold text-[#fe4a03] capitalize font-mono">
                        {returnData.settlementType || "Direct Swap"}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* RETURN: Single Product View */
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-16 h-20 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {origImage ? (
                        <img src={origImage} alt="Product" className="w-full h-full object-cover" />
                      ) : (
                        <Package size={24} className="text-slate-400" />
                      )}
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap gap-1.5">
                        {origAttrs.map((attr, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-slate-200 text-slate-700"
                          >
                            {attr.label}: <strong className="ml-1 text-slate-900">{attr.value}</strong>
                          </span>
                        ))}
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-slate-200 text-slate-700">
                          Qty: <strong className="ml-1 text-slate-900">{quantity}</strong>
                        </span>
                      </div>
                      <div className="text-sm font-bold font-mono text-slate-900">
                        Refund Due: ₹{Number(returnData.refundAmount || originalPrice).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION B: Tabs Row */}
              <div className="border-b border-slate-200 bg-slate-50/50 px-5 pt-3 flex gap-2">
                <button
                  onClick={() => setActiveTab("request")}
                  className={`px-4 py-2 font-bold text-xs rounded-t-xl transition-all border-b-2 cursor-pointer ${
                    activeTab === "request"
                      ? "bg-white text-[#fe4a03] border-[#fe4a03] shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 border-transparent"
                  }`}
                >
                  Request Dossier & Evidence ({evidenceImages.length})
                </button>
                <button
                  onClick={() => setActiveTab("settlement")}
                  className={`px-4 py-2 font-bold text-xs rounded-t-xl transition-all border-b-2 cursor-pointer ${
                    activeTab === "settlement"
                      ? "bg-white text-[#fe4a03] border-[#fe4a03] shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 border-transparent"
                  }`}
                >
                  Financial Settlement
                </button>
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`px-4 py-2 font-bold text-xs rounded-t-xl transition-all border-b-2 cursor-pointer ${
                    activeTab === "timeline"
                      ? "bg-white text-[#fe4a03] border-[#fe4a03] shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 border-transparent"
                  }`}
                >
                  Activity Audit
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`px-4 py-2 font-bold text-xs rounded-t-xl transition-all border-b-2 cursor-pointer ${
                    activeTab === "notes"
                      ? "bg-white text-[#fe4a03] border-[#fe4a03] shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 border-transparent"
                  }`}
                >
                  Merchant Notes ({notesList.length})
                </button>
              </div>

              {/* SECTION C: Tab Content */}
              <div className="p-5 sm:p-6 space-y-4">
                {activeTab === "request" && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Reason</h4>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {returnData.reason || "Defect / Size Mismatch"}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Explanation</h4>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mt-1 text-xs text-slate-700 leading-relaxed font-medium">
                        {returnData.additionalDetails || "No additional text provided by customer."}
                      </div>
                    </div>

                    {/* Evidence photos with click-to-enlarge lightbox */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Evidence Photos ({evidenceImages.length})
                      </h4>
                      {evidenceImages.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No photos attached with this request.</p>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {evidenceImages.map((img, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setSelectedImgIndex(idx);
                                setIsImgModalOpen(true);
                              }}
                              className="w-20 h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 hover:border-[#fe4a03] transition-all cursor-pointer relative group shadow-2xs"
                            >
                              <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <ZoomIn size={18} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "settlement" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block">Original Product Value</span>
                        <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">
                          ₹{Number(originalPrice).toLocaleString("en-IN")}
                        </span>
                      </div>
                      {isExchangeCase && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-slate-500 block">Replacement Value</span>
                          <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">
                            ₹{Number(exchangePrice).toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                      <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                        <span className="text-orange-950 font-medium block">
                          {isExchangeCase ? "Net Price Difference" : "Net Refund Settlement"}
                        </span>
                        <span className="text-sm font-extrabold text-[#fe4a03] font-mono mt-0.5 block">
                          {isExchangeCase
                            ? `${priceDiff >= 0 ? "+" : "-"}₹${Math.abs(priceDiff).toLocaleString("en-IN")}`
                            : `₹${Number(returnData.refundAmount || originalPrice).toLocaleString("en-IN")}`}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block">Settlement Mode</span>
                        <span className="text-sm font-bold text-slate-900 capitalize mt-0.5 block">
                          {returnData.settlementType || "Standard Refund"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "timeline" && (
                  <div className="space-y-3">
                    {(returnData.timeline || []).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No timeline entries yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {returnData.timeline.map((item, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start gap-3">
                            <Clock size={16} className="text-[#fe4a03] shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900">{item.description || item.type}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                <span>By: {item.performedBy || item.createdBy || "System"}</span>
                                <span>•</span>
                                <span>
                                  {new Date(item.timestamp).toLocaleString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="space-y-4">
                    <form onSubmit={handleSaveNote} className="space-y-2">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add official merchant note (internal audit only)..."
                        rows={3}
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03] outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSavingNote}
                          className="px-4 py-2 rounded-xl bg-[#fe4a03] hover:bg-[#e03f00] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSavingNote ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                          Save Note
                        </button>
                      </div>
                    </form>

                    <div className="space-y-2">
                      {notesList.map((n, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <p className="text-slate-800 font-medium">{typeof n === "string" ? n : n.note}</p>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Recorded by {n.createdBy || "Merchant"} •{" "}
                            {new Date(n.createdAt || Date.now()).toLocaleDateString("en-IN")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION D: Return / Exchange Tracking Lifecycle Bar */}
              <div className="p-5 sm:p-6 bg-slate-50/40">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                  {isExchangeCase ? "Exchange Lifecycle Progress" : "Return Lifecycle Progress"}
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {[
                    { label: isExchangeCase ? "Requested" : "Requested", key: "pending" },
                    { label: "Approved", key: "approved" },
                    { label: isExchangeCase ? "Pickup & Swap" : "Pickup Scheduled", key: "pickup_replace" },
                    { label: "Completed", key: "completed" },
                  ].map((step, idx) => {
                    const isDone =
                      idx === 0 ||
                      (idx === 1 && ["approved", "pickup", "pickup_replace", "completed"].includes(activeStatus)) ||
                      (idx === 2 && ["pickup", "pickup_replace", "completed"].includes(activeStatus)) ||
                      (idx === 3 && activeStatus === "completed");

                    return (
                      <div key={idx} className="flex flex-col items-center space-y-1.5">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                            isDone
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20"
                              : "bg-white text-slate-400 border-slate-200"
                          }`}
                        >
                          {isDone ? <Check size={14} strokeWidth={3} /> : idx + 1}
                        </div>
                        <span className={`text-[11px] font-bold ${isDone ? "text-slate-900" : "text-slate-400"}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* ORDER VIEW */
            <div className="p-5 sm:p-6 space-y-6">
              {associatedReturn && (
                <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-orange-950 font-medium">
                    <AlertCircle size={16} className="text-[#fe4a03] shrink-0" />
                    <span>
                      This order has an active {associatedReturn.type === "exchange" ? "Exchange" : "Return"} Request (
                      {associatedReturn.status}).
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/vendor/portal/returns/${associatedReturn._id}`)}
                    className="px-3 py-1.5 bg-[#fe4a03] hover:bg-[#e03f00] text-white font-bold text-xs rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
                  >
                    View Return Dossier &rarr;
                  </button>
                </div>
              )}

              {/* Order Items Table */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Your Products in this Order ({orderItems.length})
                </h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {orderItems.map((item, idx) => {
                    const prod = item.product || {};
                    const variant = item.variant || {};
                    const img =
                      variant.mainImage?.url ||
                      (typeof variant.mainImage === "string" ? variant.mainImage : null) ||
                      prod.images?.[0]?.url ||
                      (typeof prod.images?.[0] === "string" ? prod.images[0] : null) ||
                      "";
                    const attrs = getVariantAttrs(variant);

                    return (
                      <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {img ? <img src={img} alt="Product" className="w-full h-full object-cover" /> : <Package size={20} className="text-slate-400" />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-[#fe4a03] uppercase">
                              {prod.brand?.name || "Brand"}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 truncate">{prod.title || "Product"}</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {attrs.map((a, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                  {a.label}: {a.value}
                                </span>
                              ))}
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                Qty: {item.quantity || 1}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-slate-900 font-mono">
                              ₹{((item.sellingPrice || item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              ₹{item.sellingPrice || item.price || 0} each
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <StatusBadge status={item.status || activeStatus} />
                            {(!item.status || item.status === "pending" || item.status === "packed") && (
                              <button
                                onClick={() => {
                                  setShippingTargetItemId(item._id);
                                  setShippingModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#fe4a03] font-bold text-[11px] border border-orange-200 transition-colors cursor-pointer"
                              >
                                Ship Item
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Notes Section */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Merchant Audit Notes</h4>
                <form onSubmit={handleSaveNote} className="space-y-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an internal fulfillment note for this order..."
                    rows={2}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03] outline-none transition-all font-medium text-slate-800"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingNote}
                      className="px-4 py-2 rounded-xl bg-[#fe4a03] hover:bg-[#e03f00] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingNote ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      Record Note
                    </button>
                  </div>
                </form>

                <div className="space-y-2">
                  {notesList.map((n, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <p className="text-slate-800 font-medium">{typeof n === "string" ? n : n.note}</p>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Recorded by {n.createdBy || "Merchant"} •{" "}
                        {new Date(n.createdAt || Date.now()).toLocaleDateString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Action Button Box */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor Operational Actions</h4>
            
            {isReturnView ? (
              <div className="space-y-2">
                {activeStatus === "pending" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleVendorAction({ action: "approve" }, "Approved request")}
                      disabled={isUpdatingStatus}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => setRejectModalOpen(true)}
                      disabled={isUpdatingStatus}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}

                {(activeStatus === "approved" || activeStatus === "pickup" || activeStatus === "pickup_replace") && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleVendorAction({ action: "received" }, "Marked item as received")}
                      disabled={isUpdatingStatus}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Package size={14} /> Mark Item Received
                    </button>
                    <button
                      onClick={() => setQcModalOpen(true)}
                      disabled={isUpdatingStatus}
                      className="w-full py-2.5 bg-[#fe4a03] hover:bg-[#e03f00] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck size={14} /> Inspect QC & Settle
                    </button>
                  </div>
                )}

                {activeStatus === "completed" && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Case Fully Resolved & Settled
                  </div>
                )}

                {activeStatus === "rejected" && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs font-bold text-rose-800 flex items-center justify-center gap-2">
                    <XCircle size={16} className="text-rose-600" />
                    Case Rejected
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {activeStatus === "pending" && (
                  <button
                    onClick={() => handleUpdateStatus("packed")}
                    disabled={isUpdatingStatus}
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Boxes size={14} /> Mark Packed
                  </button>
                )}
                {["pending", "packed", "processing"].includes(activeStatus) && (
                  <button
                    onClick={() => {
                      setShippingTargetItemId(null);
                      setShippingModalOpen(true);
                    }}
                    disabled={isUpdatingStatus}
                    className="w-full py-2.5 bg-[#fe4a03] hover:bg-[#e03f00] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Truck size={14} /> Dispatch & Enter Tracking
                  </button>
                )}
                {activeStatus === "shipped" && (
                  <button
                    onClick={() => handleUpdateStatus("delivered")}
                    disabled={isUpdatingStatus}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 size={14} /> Confirm Delivered
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Customer Dossier Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Details</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5 text-slate-800 font-bold">
                <User size={15} className="text-[#fe4a03]" />
                <span>{customerName}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600 font-medium">
                <Mail size={15} className="text-slate-400" />
                <span className="truncate">{customerEmail}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600 font-medium">
                <Phone size={15} className="text-slate-400" />
                <span>{customerPhone}</span>
              </div>
            </div>
          </div>

          {/* Delivery / Shipping Address Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isReturnView ? "Pickup / Return Address" : "Shipping Destination"}
            </h4>
            <div className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed font-medium">
              <MapPin size={16} className="text-[#fe4a03] shrink-0 mt-0.5" />
              <span>{fullAddressStr}</span>
            </div>
          </div>

          {/* Financial Summary Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Financial Overview</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Payment Mode:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {orderData?.paymentMethod || "COD"}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Your Portion Subtotal:</span>
                <span className="font-extrabold text-[#fe4a03] font-mono text-sm">
                  ₹{(orderData?.vendorSubtotal || orderData?.totalAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Evidence Photos */}
      <ImageViewerModal
        isOpen={isImgModalOpen}
        onClose={() => setIsImgModalOpen(false)}
        images={evidenceImages}
        initialIndex={selectedImgIndex}
      />

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Reject {returnData?.type || "Return"} Request</h3>
              <button onClick={() => setRejectModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Please enter an official merchant reason for rejecting this claim. This will be visible in the customer dossier.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Returned item does not match original SKU or shows signs of wear and tear..."
              rows={3}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    toast.error("Please enter a rejection reason");
                    return;
                  }
                  handleVendorAction({ action: "reject", rejectionReason: rejectionReason.trim() }, "Request rejected");
                }}
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QC Inspection Modal */}
      {qcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Quality Check (QC) Inspection</h3>
              <button onClick={() => setQcModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Inspect returned product tags, packaging, and condition before completing the settlement.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">QC Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQcStatus("passed")}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    qcStatus === "passed"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Check size={14} /> QC Passed
                </button>
                <button
                  type="button"
                  onClick={() => setQcStatus("failed")}
                  className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    qcStatus === "failed"
                      ? "bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <X size={14} /> QC Failed
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">QC Inspection Notes</label>
              <textarea
                value={qcReason}
                onChange={(e) => setQcReason(e.target.value)}
                placeholder="Product verified in original packaging with intact security tag..."
                rows={2}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03] outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setQcModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleVendorAction(
                    { action: "qc", qcStatus, qcReason: qcReason.trim() },
                    `QC Inspection completed: ${qcStatus.toUpperCase()}`
                  )
                }
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#fe4a03] hover:bg-[#e03f00] text-white cursor-pointer"
              >
                Submit QC Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Dispatch Modal */}
      {shippingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <form onSubmit={handleFulfillmentSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Dispatch Shipment</h3>
              <button
                type="button"
                onClick={() => setShippingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Provide courier logistics partner and tracking airway bill (AWB) number for the buyer.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Courier Service</label>
                <select
                  value={shippingCourier}
                  onChange={(e) => setShippingCourier(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                >
                  <option value="Delhivery">Delhivery</option>
                  <option value="BlueDart">BlueDart</option>
                  <option value="Ekart Logistics">Ekart Logistics</option>
                  <option value="DTDC">DTDC</option>
                  <option value="FedEx">FedEx</option>
                  <option value="Shadowfax">Shadowfax</option>
                  <option value="Xpressbees">Xpressbees</option>
                  <option value="Speed Post">India Speed Post</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tracking / AWB Number</label>
                <input
                  type="text"
                  placeholder="e.g. DEL789123456IN"
                  value={shippingTrackingNumber}
                  onChange={(e) => setShippingTrackingNumber(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShippingModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#fe4a03] hover:bg-[#e03f00] text-white cursor-pointer"
              >
                Dispatch Order
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
