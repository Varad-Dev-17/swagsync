import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../api/axiosConfig";
import { AlertCircle } from "lucide-react";

import CaseHeader from "./sections/CaseHeader";
import ReturnHeroProductCard from "./components/ReturnHeroProductCard";
import CaseTabsSection from "./sections/CaseTabsSection";
import ReturnTrackingTimelineCard from "./components/ReturnTrackingTimelineCard";
import CaseSidebarCards from "./components/CaseSidebarCards";
import ProductPriceSection from "./sections/ProductPriceSection";
import OrderTabsSection from "./sections/OrderTabsSection";

const AdminCaseDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isReturnView = location.pathname.includes("/admin/returns");
  const isOrderView = location.pathname.includes("/admin/orders");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [returnData, setReturnData] = useState(null);
  const [associatedReturn, setAssociatedReturn] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  const fetchCaseDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isOrderView) {
        const res = await api.get(`/admin/orders/${id}`);
        if (res.data.success && res.data.data) {
          const data = res.data.data;
          setOrderData(data);
          setReturnData(null); // Keep null so order view never renders return view layout
          if (Array.isArray(data.returnRequests) && data.returnRequests.length > 0) {
            setAssociatedReturn(data.returnRequests[0]);
          } else {
            setAssociatedReturn(null);
          }
        }
      } else if (isReturnView) {
        const res = await api.get(`/admin/returns/${id}`);
        if (res.data.success && res.data.data) {
          const data = res.data.data;
          setReturnData(data);
          if (data.order) {
            setOrderData(data.order);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching admin case details:", err);
      setError("Failed to load case details. The resource may not exist or network failed.");
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

  // Status update handler
  const handleUpdateStatus = async (newStatus) => {
    if (!newStatus) return;
    setIsUpdatingStatus(true);
    try {
      if (isOrderView) {
        const res = await api.put(`/admin/orders/${orderData?._id || id}`, { status: newStatus });
        if (res.data.success) {
          toast.success(`Order status updated to ${newStatus}`);
          setOrderData(res.data.data || { ...orderData, status: newStatus });
        }
      } else if (returnData) {
        const res = await api.put(`/admin/returns/${returnData._id || id}`, { status: newStatus });
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

  // Generic updater for return attributes (Refund details, etc.)
  const handleUpdateReturnDetails = async (updatePayload, successMsg = "Details updated successfully") => {
    if (!returnData) return;
    setIsUpdatingStatus(true);
    try {
      const res = await api.put(`/admin/returns/${returnData._id}`, updatePayload);
      if (res.data.success) {
        toast.success(successMsg);
        setReturnData(res.data.data || { ...returnData, ...updatePayload });
      }
    } catch (err) {
      console.error("Failed to update details:", err);
      toast.error(err.response?.data?.message || "Failed to save updates to database");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 1-Click Automated Razorpay Refund
  const handleProcessRazorpayRefund = async () => {
    if (!returnData) return;
    setIsUpdatingStatus(true);
    try {
      const res = await api.post(`/admin/returns/${returnData._id}/refund-razorpay`);
      if (res.data.success) {
        toast.success(res.data.message || "Refund processed successfully via Razorpay!");
        if (res.data.data) {
          setReturnData(res.data.data);
        }
      }
    } catch (err) {
      console.error("Razorpay refund error:", err);
      toast.error(err.response?.data?.message || "Failed to process Razorpay refund");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Admin Notes handler
  const handleSaveNote = async (noteData) => {
    setIsSavingNote(true);
    try {
      const targetEndpoint = isOrderView ? `/admin/orders/${id}` : `/admin/returns/${returnData?._id || id}`;
      const payload = typeof noteData === "string" ? { note: noteData } : noteData;
      const res = await api.put(targetEndpoint, payload);
      if (res.data.success && res.data.data) {
        toast.success("Case note recorded successfully");
        if (isOrderView) {
          setOrderData(res.data.data);
        } else {
          setReturnData(res.data.data);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to save admin note:", err);
      toast.error("Failed to persist admin note to database");
      return false;
    } finally {
      setIsSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="w-12 h-12 border-4 border-[#4648d4] border-t-transparent rounded-full animate-spin shadow-md" />
        <p className="text-sm font-bold text-gray-600 tracking-tight animate-pulse">
          Loading Case Dossier & Analytics...
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
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Retry Fetch
        </button>
      </div>
    );
  }

  const isExchangeCase = isReturnView && returnData?.type === "exchange";
  const activeStatus = isReturnView ? (returnData?.status || "pending") : (orderData?.status || "pending");

  const orderStatusOptions = [
    { value: "pending", label: "Order Confirmed" },
    { value: "packed", label: "Packed" },
    { value: "shipped", label: "Shipped" },
    { value: "on_the_way", label: "Out for delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const returnStatusOptions = isExchangeCase ? [
    { value: "pending", label: "Requested" },
    { value: "approved", label: "Approved" },
    { value: "pickup_replace", label: "Pickup & Replace" },
    { value: "completed", label: "Exchange Completed" },
    { value: "rejected", label: "Rejected" },
  ] : [
    { value: "pending", label: "Requested" },
    { value: "approved", label: "Approved" },
    { value: "pickup", label: "Pickup" },
    { value: "completed", label: "Return Completed" },
    { value: "rejected", label: "Rejected" },
  ];

  const caseIdCode = isReturnView
    ? (returnData?._id ? returnData._id.slice(-8).toUpperCase() : (orderData?.orderId || id.slice(-8).toUpperCase()))
    : (orderData?.orderId || id.slice(-8).toUpperCase());

  const headerTitle = isReturnView
    ? `${isExchangeCase ? "Exchange Request" : "Return Request"} #${caseIdCode}`
    : `Order Details #${orderData?.orderId || id.slice(-8).toUpperCase()}`;

  const caseDate = new Date((isReturnView ? returnData?.createdAt : orderData?.createdAt) || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  const headerSubtitle = isReturnView
    ? `Order ${orderData?.orderId || returnData?.order?.orderId || 'ORD-25'} • Submitted on ${caseDate}`
    : `Placed on ${caseDate}`;

  const notesList = isReturnView ? (returnData?.adminNotes || []) : (orderData?.adminNotes || []);

  return (
    <div className="w-full min-h-screen bg-slate-50/50 p-3 sm:p-5 lg:p-6 print:p-0">
      
      {/* 1. Case Header */}
      <CaseHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        status={activeStatus}
        statusOptions={isReturnView ? returnStatusOptions : orderStatusOptions}
        onUpdateStatus={handleUpdateStatus}
        returnRequest={returnData}
        order={orderData}
        isUpdating={isUpdatingStatus}
        isReturnView={isReturnView}
      />

      {/* 2. Main 2-Column Responsive Layout: ONE Cohesive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        
        {/* Left Column (~70% = 8 cols) - Unified Workspace Card */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          
          {isReturnView && returnData ? (
            <>
              {/* Section 1: Hero Product Details & Contextual Alert */}
              <ReturnHeroProductCard
                returnRequest={returnData}
                order={orderData}
              />

              {/* Section 2: Main Content Tabs */}
              <CaseTabsSection
                returnRequest={returnData}
                order={orderData || {}}
                notes={notesList}
                onSaveNote={handleSaveNote}
                isSavingNote={isSavingNote}
                onUpdateRefundDetails={handleUpdateReturnDetails}
                onProcessRazorpayRefund={handleProcessRazorpayRefund}
                isUpdatingRefund={isUpdatingStatus}
              />

              {/* Section 3: ONE Detailed Return Tracking Horizontal Timeline */}
              <ReturnTrackingTimelineCard
                returnRequest={returnData}
              />
            </>
          ) : (
            /* Standard Order View: ONLY Order Details */
            <div className="p-4 sm:p-5 space-y-5">
              {associatedReturn && (
                <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-medium">
                    <AlertCircle size={16} className="text-amber-600 shrink-0" />
                    <span>
                      This order has an active {associatedReturn.type === "exchange" ? "Exchange" : "Return"} Request ({associatedReturn.status}).
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/returns/${associatedReturn._id}`)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
                  >
                    View Return Dossier &rarr;
                  </button>
                </div>
              )}

              <ProductPriceSection
                items={orderData?.items || []}
                order={orderData || {}}
                isReturnItemOnly={false}
                returnItem={null}
                returnRequest={null}
                isReturnView={false}
                onUpdateStatus={handleUpdateStatus}
                hideAuditLog={true}
              />

              <OrderTabsSection
                order={orderData || {}}
                notes={notesList}
                onSaveNote={handleSaveNote}
                isSavingNote={isSavingNote}
              />
            </div>
          )}

        </div>

        {/* Right Column Sidebar (~30% = 4 cols) - Unified Information Rail */}
        <div className="lg:col-span-4 lg:sticky lg:top-4">
          <CaseSidebarCards
            returnRequest={returnData}
            order={orderData || {}}
            onUpdateStatus={handleUpdateStatus}
            isProcessing={isUpdatingStatus}
            isReturnView={isReturnView}
            associatedReturn={associatedReturn}
          />
        </div>

      </div>

    </div>
  );
};

export default AdminCaseDetailsPage;
