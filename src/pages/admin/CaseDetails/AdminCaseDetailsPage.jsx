import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../api/axiosConfig";
import { AlertCircle } from "lucide-react";

import CaseHeader from "./sections/CaseHeader";
import ReturnHeroProductCard from "./components/ReturnHeroProductCard";
import CaseTabsSection from "./sections/CaseTabsSection";
import ReturnTrackingTimelineCard from "./components/ReturnTrackingTimelineCard";
import CaseSidebarCards from "./components/CaseSidebarCards";
import ProductPriceSection from "./sections/ProductPriceSection";

const AdminCaseDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const isReturnView = location.pathname.includes("/admin/returns");
  const isOrderView = location.pathname.includes("/admin/orders");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [returnData, setReturnData] = useState(null);
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
          if (Array.isArray(data.returnRequests) && data.returnRequests.length > 0) {
            setReturnData(data.returnRequests[0]);
          } else {
            setReturnData(null);
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
      if (isOrderView && orderData && !returnData) {
        const res = await api.put(`/admin/orders/${orderData._id || id}`, { status: newStatus });
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

  // Admin Notes handler
  const handleSaveNote = async (noteData) => {
    setIsSavingNote(true);
    try {
      const targetEndpoint = isOrderView && !returnData ? `/admin/orders/${id}` : `/admin/returns/${returnData?._id || id}`;
      const payload = typeof noteData === "string" ? { note: noteData } : noteData;
      const res = await api.put(targetEndpoint, payload);
      if (res.data.success && res.data.data) {
        toast.success("Case note recorded successfully");
        if (isOrderView && !returnData) {
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

  const isExchangeCase = returnData?.type === "exchange";
  const activeStatus = returnData ? returnData.status : (orderData?.status || "pending");

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

  const caseIdCode = returnData?._id ? returnData._id.slice(-8).toUpperCase() : (orderData?.orderId || id.slice(-8).toUpperCase());

  const headerTitle = returnData
    ? `${isExchangeCase ? "Exchange Request" : "Return Request"} #${caseIdCode}`
    : `Order Details #${orderData?.orderId || id.slice(-8).toUpperCase()}`;

  const customerName = returnData?.user?.username || orderData?.user?.username || "Customer";
  const caseDate = new Date(returnData?.createdAt || orderData?.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  const headerSubtitle = `Order ${orderData?.orderId || returnData?.order?.orderId || 'ORD-25'} • Submitted on ${caseDate}`;

  const notesList = returnData ? returnData.adminNotes || [] : orderData?.adminNotes || [];

  return (
    <div className="w-full min-h-screen bg-slate-50/50 p-3 sm:p-5 lg:p-6 print:p-0">
      
      {/* 1. Case Header */}
      <CaseHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        status={activeStatus}
        statusOptions={returnData ? returnStatusOptions : orderStatusOptions}
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
          
          {returnData ? (
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
              />

              {/* Section 3: ONE Detailed Return Tracking Vertical Timeline */}
              <ReturnTrackingTimelineCard
                returnRequest={returnData}
              />
            </>
          ) : (
            /* Standard Order View fallback if accessed via /admin/orders without return claim */
            <div className="p-4 sm:p-5 space-y-5">
              <ProductPriceSection
                items={orderData?.items || []}
                order={orderData || {}}
                isReturnItemOnly={false}
                returnItem={null}
                returnRequest={null}
                isReturnView={false}
                onUpdateStatus={handleUpdateStatus}
              />

              <CaseTabsSection
                returnRequest={{
                  type: "return",
                  status: orderData?.status,
                  reason: "Fulfillment Processing",
                  additionalDetails: "Standard order processing",
                  createdAt: orderData?.createdAt,
                  timeline: orderData?.timeline || [],
                  refundStatus: "not_required",
                  refundAmount: orderData?.totalAmount
                }}
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
          />
        </div>

      </div>

    </div>
  );
};

export default AdminCaseDetailsPage;
