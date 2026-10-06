import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Truck,
  Clock,
  XCircle,
  MapPin,
  Receipt,
  Phone,
  Package,
  RefreshCw,
  Copy,
  Check,
  FileText,
  CreditCard,
  Banknote,
  ChevronRight,
  ChevronDown,
  Star,
  X,
  DollarSign,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import toast from "react-hot-toast";
import ReturnExchangeButton from "../returnexchange/ReturnExchangeButton";
import CancelOrderModal from "../CancelOrderModal";
import { getReturnEligibility } from "../../../../utils/returnEligibility";

const OrderDetails = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelModalState, setCancelModalState] = useState({
    isOpen: false,
    targetItem: null,
    isLoading: false,
  });
  const [copiedId, setCopiedId] = useState(false);
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  const [isDeliveryExpanded, setIsDeliveryExpanded] = useState(false);
  const [isPriceExpanded, setIsPriceExpanded] = useState(false);
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsUpdatesModalOpen(false);
    };
    if (isUpdatesModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isUpdatesModalOpen]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/orders/${orderId}`, {
          headers: getAuthHeaders(),
        });
        if (response.data.success) {
          setOrder(response.data.data);
        }
      } catch (error) {
        toast.error("Failed to load order details");
        navigate("/account/orders");
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, getAuthHeaders, navigate]);

  const handleOpenCancelModal = (item) => {
    const isMultiItem = (order?.items || []).length > 1;
    setCancelModalState({
      isOpen: true,
      targetItem: isMultiItem ? item : null,
      isLoading: false,
    });
  };

  const handleConfirmCancel = async ({ reason, comment }) => {
    const { targetItem } = cancelModalState;
    setCancelModalState((prev) => ({ ...prev, isLoading: true }));
    try {
      const payload = {
        ...(targetItem?._id ? { itemId: targetItem._id } : {}),
        reason,
        comment,
      };
      const response = await axios.put(`/orders/cancel/${order._id}`, payload, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) {
        toast.success(
          response.data.message ||
            (targetItem ? "Item cancelled successfully" : "Order cancelled successfully")
        );
        setCancelModalState({ isOpen: false, targetItem: null, isLoading: false });
        const updated = await axios.get(`/orders/${orderId}`, {
          headers: getAuthHeaders(),
        });
        if (updated.data.success) {
          setOrder(updated.data.data);
        }
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (targetItem ? "Failed to cancel item" : "Failed to cancel order")
      );
      setCancelModalState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleCopyOrderId = () => {
    if (!order) return;
    const idToCopy = `#${order.orderId || order._id}`;
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    toast.success("Order ID copied to clipboard!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Helper date formatter matching: "12 Sep 2026, 10:24 AM"
  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      const datePart = d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const timePart = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return `${datePart}, ${timePart}`;
    } catch {
      return dateString || "";
    }
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  // Invoice generator & printer
  const handleDownloadInvoice = () => {
    if (!order) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to download your invoice");
      return;
    }

    const itemsHtml = (order.items || [])
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <strong>${item.product?.title || "Product"}</strong>
            <div style="font-size: 11px; color: #666; margin-top: 2px;">Brand: ${item.product?.brand?.name || "SwagSync"} | Qty: ${item.quantity || 1}</div>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.sellingPrice || item.price || 0).toLocaleString("en-IN")}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">₹${((item.sellingPrice || item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}</td>
        </tr>`
      )
      .join("");

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order.orderId || order._id} - SwagSync</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #1e293b; max-width: 760px; margin: 0 auto; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #FD7100; padding-bottom: 16px; margin-bottom: 24px; }
          .logo { font-size: 26px; font-weight: 900; color: #FD7100; }
          .invoice-title { font-size: 18px; font-weight: bold; text-align: right; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
          th { background: #f8fafc; padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0; font-weight: bold; }
          .totals { margin-left: auto; width: 320px; font-size: 12px; }
          .totals div { display: flex; justify-content: space-between; padding: 5px 0; }
          .grand-total { font-size: 16px; font-weight: 900; color: #FD7100; border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">SwagSync</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Official Tax Invoice & Customer Receipt</div>
          </div>
          <div class="invoice-title">
            <div>Order #${order.orderId || order._id}</div>
            <div style="font-size: 12px; color: #64748b; font-weight: normal; margin-top: 4px;">Placed on: ${formatDateTime(order.createdAt)}</div>
          </div>
        </div>

        <div class="details-grid">
          <div>
            <strong style="display:block; margin-bottom: 4px; font-size: 13px;">Delivery Address:</strong>
            <div>${order.shippingAddress?.name || "Customer"}</div>
            <div>${order.shippingAddress?.address || ""}, ${order.shippingAddress?.city || ""}</div>
            <div>${order.shippingAddress?.state || ""} - ${order.shippingAddress?.pincode || ""}, ${order.shippingAddress?.country || "India"}</div>
            <div>Phone: +91 ${order.shippingAddress?.phone || "—"}</div>
          </div>
          <div style="text-align: right;">
            <strong style="display:block; margin-bottom: 4px; font-size: 13px;">Payment Information:</strong>
            <div>Payment Method: ${(order.paymentMethod || "COD").toUpperCase()}</div>
            <div>Payment Status: ${(order.paymentStatus || "Pending").toUpperCase()}</div>
            <div>Fulfillment Status: ${(order.status || "Pending").toUpperCase()}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div><span>Items Subtotal:</span><span>₹${Number(order.subtotal || 0).toLocaleString("en-IN")}</span></div>
          ${order.discountAmount ? `<div style="color: #16a34a;"><span>Promo Discount:</span><span>-₹${Number(order.discountAmount).toLocaleString("en-IN")}</span></div>` : ""}
          <div><span>Delivery Charges:</span><span>${Number(order.shippingAmount || 0) === 0 ? "FREE" : `₹${Number(order.shippingAmount).toLocaleString("en-IN")}`}</span></div>
          <div class="grand-total"><span>Total Paid Amount:</span><span>₹${Number(order.totalAmount || 0).toLocaleString("en-IN")}</span></div>
        </div>

        <div style="margin-top: 48px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          This is a computer-generated customer receipt for SwagSync marketplace order #${order.orderId || order._id}.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#FD7100] animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  // Pricing calculations
  const orderSubtotal =
    Number(order.subtotal || 0) ||
    (order.items || []).reduce(
      (acc, i) =>
        acc + Number(i.sellingPrice ?? i.price ?? i.mrp ?? 0) * (i.quantity || 1),
      0
    );
  const computedMRP =
    Number(order.totalMRP || 0) ||
    (order.items || []).reduce(
      (acc, i) =>
        acc + Number(i.mrp ?? i.sellingPrice ?? i.price ?? 0) * (i.quantity || 1),
      0
    );
  const totalPaidAmount = Number(order.totalAmount || orderSubtotal);
  const totalDiscount = Math.max(0, computedMRP - totalPaidAmount);
  const totalSavings = totalDiscount;
  const shippingAmount = Number(order.shippingAmount || 0);

  const totalItemCount = (order.items || []).reduce(
    (acc, i) => acc + (Number(i.quantity) || 1),
    0
  );

  const orderStatus = (order.status || "pending").toLowerCase();
  const isCancelled = orderStatus === "cancelled";
  const isDelivered = orderStatus === "delivered";
  const isShipped = ["shipped", "on_the_way", "delivered"].includes(orderStatus);
  const isPacked = ["packed", "processing", "shipped", "on_the_way", "delivered"].includes(orderStatus);

  // Estimated delivery date: 3 days after createdAt
  const estDeliveryObj = new Date(
    new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000
  );
  const estArrivalDate = formatDateShort(order.deliveredAt || estDeliveryObj);

  const paymentMethodStr = (order.paymentMethod || "cod").toLowerCase();
  const isRazorpay =
    paymentMethodStr === "razorpay" ||
    Boolean(order.razorpayPaymentId) ||
    (paymentMethodStr !== "cod" && paymentMethodStr !== "cash");

  // Milestones for Tracking Status
  const getTimelineDate = (typeKeyword) => {
    const ev = (order.timeline || []).find((e) =>
      String(e.type || "").toLowerCase().includes(typeKeyword)
    );
    return ev?.timestamp ? formatDateTime(ev.timestamp) : null;
  };

  const trackingSteps = [
    {
      id: "placed",
      title: "Order Placed",
      description: "Your order has been successfully placed.",
      timestamp: formatDateTime(order.createdAt),
      isCompleted: true,
      isActive: orderStatus === "pending",
    },
    {
      id: "packed",
      title: "Packed",
      description: "Your item has been packed and verified.",
      timestamp: isPacked ? getTimelineDate("pack") || formatDateTime(order.createdAt) : "-",
      isCompleted: isPacked,
      isActive: orderStatus === "packed" || orderStatus === "processing",
    },
    {
      id: "shipped",
      title: "Shipped",
      description: "Your item has been shipped from the seller.",
      timestamp: isShipped ? getTimelineDate("ship") || formatDateTime(order.createdAt) : "-",
      isCompleted: isShipped,
      isActive: orderStatus === "shipped",
    },
    {
      id: "on_the_way",
      title: "Out for Delivery",
      description: "Your item is out for delivery.",
      timestamp:
        orderStatus === "on_the_way" || isDelivered
          ? getTimelineDate("out") || getTimelineDate("on_the_way") || formatDateTime(order.updatedAt)
          : "-",
      isCompleted: orderStatus === "on_the_way" || isDelivered,
      isActive: orderStatus === "on_the_way",
    },
    {
      id: "delivered",
      title: "Delivered",
      description: isDelivered ? "Your item has been delivered." : "Your item will be delivered soon.",
      timestamp: isDelivered ? formatDateTime(order.deliveredAt || order.updatedAt) : "-",
      isCompleted: isDelivered,
      isActive: isDelivered,
    },
  ];

  // Dynamic timeline generator for "See All Updates" popup modal
  // Strictly renders only applicable events that have actually occurred.
  const getUpdatesTimeline = () => {
    const returnRequests = Array.isArray(order.returnRequests) ? order.returnRequests : [];
    const activeReturn = returnRequests.length > 0 ? returnRequests[0] : null;

    if (activeReturn) {
      const isExchange = activeReturn.type === "exchange";
      const reqStatus = (activeReturn.status || "pending").toLowerCase();
      const timelineEvents = Array.isArray(activeReturn.timeline) ? activeReturn.timeline : [];

      const findEventDate = (keywords) => {
        const ev = timelineEvents.find((e) =>
          keywords.some((kw) => String(e.type || "").toLowerCase().includes(kw))
        );
        return ev?.timestamp ? formatDateTime(ev.timestamp) : null;
      };

      if (isExchange) {
        // Exchange: Delivered → Exchange Requested → Exchange Approved → Pickup → Item Received → Replacement Shipped → Replacement Delivered
        const steps = [
          {
            id: "delivered_orig",
            title: "Delivered",
            description: "Original item was delivered to your address.",
            timestamp: formatDateTime(order.deliveredAt || order.updatedAt),
            icon: CheckCircle2,
            isCompleted: true,
          },
          {
            id: "exch_requested",
            title: "Exchange Requested",
            description: activeReturn.reason
              ? `Reason: ${activeReturn.reason}${activeReturn.additionalDetails ? ` - "${activeReturn.additionalDetails}"` : ""}`
              : "Exchange request submitted.",
            timestamp: formatDateTime(activeReturn.createdAt),
            icon: RefreshCw,
            isCompleted: true,
          },
        ];

        const isApproved = [
          "approved",
          "pickup_scheduled",
          "pickup",
          "pickup_replace",
          "replace_and_exchange",
          "picked_up",
          "received",
          "packed",
          "shipped",
          "completed",
          "exchanged",
        ].includes(reqStatus);

        if (isApproved) {
          steps.push({
            id: "exch_approved",
            title: "Exchange Approved",
            description: "Your exchange request was reviewed and approved.",
            timestamp: findEventDate(["approve"]) || formatDateTime(activeReturn.updatedAt),
            icon: CheckCircle2,
            isCompleted: true,
          });
        }

        const isPickup = [
          "pickup_scheduled",
          "pickup",
          "pickup_replace",
          "replace_and_exchange",
          "picked_up",
          "received",
          "packed",
          "shipped",
          "completed",
          "exchanged",
        ].includes(reqStatus);

        if (isPickup) {
          const isPickedUp = ["picked_up", "received", "packed", "shipped", "completed", "exchanged"].includes(reqStatus);
          steps.push({
            id: "exch_pickup",
            title: isPickedUp ? "Pickup Completed" : "Pickup Scheduled",
            description: isPickedUp
              ? "The return item has been collected by our courier agent."
              : "Courier scheduled to pick up the item from your delivery address.",
            timestamp: findEventDate(["pickup", "picked"]) || formatDateTime(activeReturn.updatedAt),
            icon: Truck,
            isCompleted: true,
          });
        }

        const isReceived = ["received", "packed", "shipped", "completed", "exchanged"].includes(reqStatus);
        if (isReceived) {
          steps.push({
            id: "exch_received",
            title: "Item Received",
            description: "Item safely received at fulfillment center.",
            timestamp: findEventDate(["received"]) || formatDateTime(activeReturn.updatedAt),
            icon: Package,
            isCompleted: true,
          });
        }

        const isReplShipped = ["shipped", "completed", "exchanged"].includes(reqStatus);
        if (isReplShipped) {
          steps.push({
            id: "exch_repl_shipped",
            title: "Replacement Shipped",
            description: "Your replacement item has been packed and dispatched.",
            timestamp: findEventDate(["ship", "replacement"]) || formatDateTime(activeReturn.updatedAt),
            icon: Truck,
            isCompleted: true,
          });
        }

        const isReplDelivered = ["completed", "exchanged"].includes(reqStatus);
        if (isReplDelivered) {
          steps.push({
            id: "exch_repl_delivered",
            title: "Replacement Delivered",
            description: "Replacement item successfully delivered. Exchange closed.",
            timestamp: findEventDate(["deliver", "complete"]) || formatDateTime(activeReturn.updatedAt),
            icon: CheckCircle2,
            isCompleted: true,
          });
        }

        return steps;
      } else {
        // Return: Delivered → Return Requested → Return Approved → Pickup → Item Received → Refund/Return Completed
        const steps = [
          {
            id: "delivered_orig",
            title: "Delivered",
            description: "Original item was delivered to your address.",
            timestamp: formatDateTime(order.deliveredAt || order.updatedAt),
            icon: CheckCircle2,
            isCompleted: true,
          },
          {
            id: "ret_requested",
            title: "Return Requested",
            description: activeReturn.reason
              ? `Reason: ${activeReturn.reason}${activeReturn.additionalDetails ? ` - "${activeReturn.additionalDetails}"` : ""}`
              : "Return request submitted.",
            timestamp: formatDateTime(activeReturn.createdAt),
            icon: RefreshCw,
            isCompleted: true,
          },
        ];

        const isApproved = [
          "approved",
          "pickup_scheduled",
          "pickup",
          "picked_up",
          "received",
          "completed",
          "refunded",
        ].includes(reqStatus);

        if (isApproved) {
          steps.push({
            id: "ret_approved",
            title: "Return Approved",
            description: "Return request verified and accepted.",
            timestamp: findEventDate(["approve"]) || formatDateTime(activeReturn.updatedAt),
            icon: CheckCircle2,
            isCompleted: true,
          });
        }

        const isPickup = [
          "pickup_scheduled",
          "pickup",
          "picked_up",
          "received",
          "completed",
          "refunded",
        ].includes(reqStatus);

        if (isPickup) {
          const isPickedUp = ["picked_up", "received", "completed", "refunded"].includes(reqStatus);
          steps.push({
            id: "ret_pickup",
            title: isPickedUp ? "Pickup Completed" : "Pickup Scheduled",
            description: isPickedUp
              ? "Returned item collected by logistics courier."
              : "Courier agent assigned to collect returned item.",
            timestamp: findEventDate(["pickup", "picked"]) || formatDateTime(activeReturn.updatedAt),
            icon: Truck,
            isCompleted: true,
          });
        }

        const isReceived = ["received", "completed", "refunded"].includes(reqStatus);
        if (isReceived) {
          steps.push({
            id: "ret_received",
            title: "Item Received",
            description: "Returned item safely received at return facility.",
            timestamp: findEventDate(["received"]) || formatDateTime(activeReturn.updatedAt),
            icon: Package,
            isCompleted: true,
          });
        }

        const isCompleted = ["completed", "refunded"].includes(reqStatus);
        if (isCompleted) {
          const refundAmount = activeReturn.refundAmount || order.totalAmount;
          steps.push({
            id: "ret_completed",
            title: "Refund / Return Completed",
            description: `Return processed successfully.${refundAmount ? ` Refund of ₹${Number(refundAmount).toLocaleString("en-IN")} credited to your account.` : " Return closed."}`,
            timestamp: formatDateTime(activeReturn.refundProcessedAt || activeReturn.updatedAt),
            icon: DollarSign,
            isCompleted: true,
          });
        }

        return steps;
      }
    }

    if (isCancelled) {
      // Cancelled: Order Confirmed → Cancelled → Refund (if applicable)
      const steps = [
        {
          id: "placed",
          title: "Order Confirmed",
          description: "Your order was placed and confirmed.",
          timestamp: formatDateTime(order.createdAt),
          icon: CheckCircle2,
          isCompleted: true,
        },
        {
          id: "cancelled",
          title: "Cancelled",
          description: order.cancellationReason
            ? `Order cancelled. Reason: ${order.cancellationReason}`
            : "Your order has been cancelled.",
          timestamp: formatDateTime(order.updatedAt),
          icon: XCircle,
          isCompleted: true,
        },
      ];

      const isOnlinePaid = isRazorpay || ["paid", "refunded"].includes(order.paymentStatus);
      if (isOnlinePaid) {
        steps.push({
          id: "refund",
          title: order.paymentStatus === "refunded" ? "Refund Completed" : "Refund Processing",
          description:
            order.paymentStatus === "refunded"
              ? `Refund of ₹${totalPaidAmount.toLocaleString("en-IN")} has been credited to your payment method.`
              : `Refund of ₹${totalPaidAmount.toLocaleString("en-IN")} is being processed and will reflect within 5-7 business days.`,
          timestamp: formatDateTime(order.updatedAt),
          icon: DollarSign,
          isCompleted: true,
        });
      }

      return steps;
    }

    // Standard Journey: Order Confirmed → Packed → Shipped → Out for Delivery → Delivered
    // Strictly display ONLY statuses that have actually occurred. Do NOT display future steps.
    const steps = [
      {
        id: "placed",
        title: "Order Confirmed",
        description: "Your order has been placed and confirmed.",
        timestamp: formatDateTime(order.createdAt),
        icon: CheckCircle2,
        isCompleted: true,
      },
    ];

    if (["packed", "processing", "shipped", "on_the_way", "delivered"].includes(orderStatus)) {
      steps.push({
        id: "packed",
        title: "Packed",
        description: "Seller has verified and packed your item.",
        timestamp: getTimelineDate("pack") || formatDateTime(order.createdAt),
        icon: Package,
        isCompleted: true,
      });
    }

    if (["shipped", "on_the_way", "delivered"].includes(orderStatus)) {
      steps.push({
        id: "shipped",
        title: "Shipped",
        description: order.trackingNumber
          ? `Dispatched via courier partner (AWB: ${order.trackingNumber}).`
          : "Your item has been dispatched from the warehouse.",
        timestamp: getTimelineDate("ship") || formatDateTime(order.createdAt),
        icon: Truck,
        isCompleted: true,
      });
    }

    if (["on_the_way", "delivered"].includes(orderStatus)) {
      steps.push({
        id: "on_the_way",
        title: "Out for Delivery",
        description: "Package is out for delivery with courier in your local area.",
        timestamp: getTimelineDate("out") || getTimelineDate("on_the_way") || formatDateTime(order.updatedAt),
        icon: Truck,
        isCompleted: true,
      });
    }

    if (orderStatus === "delivered") {
      steps.push({
        id: "delivered",
        title: "Delivered",
        description: "Package was safely delivered to your address.",
        timestamp: formatDateTime(order.deliveredAt || order.updatedAt),
        icon: CheckCircle2,
        isCompleted: true,
      });
    }

    return steps;
  };

  return (
    <div className="w-full min-h-screen bg-[#F8F9FA] pt-20 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Breadcrumb & Header Row */}
        <div>
          <button
            type="button"
            onClick={() => navigate("/account/orders")}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 mb-2 transition-colors font-semibold text-xs sm:text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </button>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Order Details
          </h1>

          <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium mt-1 flex-wrap">
            <span>Order placed on {formatDateTime(order.createdAt)}</span>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span>Order ID:</span>
              <span className="font-mono font-bold text-slate-800">
                #{order.orderId || order._id}
              </span>
              <button
                type="button"
                onClick={handleCopyOrderId}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Copy Order ID"
              >
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN (8 cols): Items & Tracking ================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Items in this Order Card */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FD7100] flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                    Order Item
                  </h2>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-500">
                  Order: #{order.orderId || order._id}
                </span>
              </div>

              {/* Items List - All products belonging to this single order */}
              <div className="divide-y divide-gray-100">
                {(order.items || []).map((item, index) => {
                  let color = "";
                  let size = "";

                  if (item.variant && item.variant.attributes) {
                    item.variant.attributes.forEach((attr) => {
                      const name = attr.attribute?.name?.toLowerCase();
                      if (
                        name === "color" ||
                        name === "colour" ||
                        name === "color / shade" ||
                        name === "shade" ||
                        attr.attribute?.fieldType === "color"
                      ) {
                        color = attr.option?.displayName || attr.option?.storedValue || color;
                      }
                      if (name === "size" || name === "size / net quantity") {
                        size = attr.option?.displayName || attr.option?.storedValue || size;
                      }
                    });
                  }

                  const brandName = item.product?.brand?.name || item.product?.brand;
                  const unitSellingPrice = Number(
                    item.sellingPrice ?? item.price ?? item.mrp ?? 0
                  );
                  const unitMRP = Number(item.mrp ?? item.price ?? unitSellingPrice);
                  const discountPercent =
                    unitMRP > unitSellingPrice
                      ? Math.round(((unitMRP - unitSellingPrice) / unitMRP) * 100)
                      : 0;

                  const vendorStoreName =
                    item.vendor?.vendorProfile?.storeName ||
                    item.vendor?.storeName ||
                    "SwagSync Official";

                  const itemStatus = (
                    order.status === "cancelled"
                      ? "cancelled"
                      : item.status || order.status || "pending"
                  ).toLowerCase();

                  const canCancelItem =
                    !isCancelled &&
                    itemStatus !== "cancelled" &&
                    ["pending", "processing", "packed"].includes(itemStatus);

                  // Return & exchange requests for this item
                  const itemRequests = (
                    Array.isArray(order.returnRequests) ? order.returnRequests : []
                  )
                    .filter(
                      (req) =>
                        String(req.product?._id || req.product) ===
                        String(item.product?._id || item.product)
                    )
                    .sort(
                      (a, b) =>
                        new Date(b.updatedAt || b.createdAt || 0) -
                        new Date(a.updatedAt || a.createdAt || 0)
                    );

                  const latestRequest = itemRequests[0] || null;
                  const activeRequest =
                    latestRequest &&
                    !["rejected", "cancelled", "completed", "refunded"].includes(
                      latestRequest.status
                    );
                  const eligibility = getReturnEligibility(order, item, latestRequest);

                  const imageUrl =
                    item.variant?.mainImage?.url ||
                    item.product?.images?.[0]?.url ||
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect fill="%23f1f5f9" width="150" height="150"/><path fill="%23cbd5e1" d="M45 60a15 15 0 1030 0 15 15 0 00-30 0zm67 52H38a7 7 0 01-6-11l22-29a7 7 0 0111 0l10 13 15-19a7 7 0 0111 0l22 29a7 7 0 01-6 17z"/></svg>';

                  return (
                    <div
                      key={item._id || index}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Left: Product Thumbnail & Details */}
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center shrink-0 shadow-2xs">
                          <img
                            src={imageUrl}
                            alt={item.product?.title || "Product"}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          {brandName && (
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                              {brandName}
                            </span>
                          )}

                          <h3
                            className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1"
                            title={item.product?.title}
                          >
                            {item.product?.title || "Product Item"}
                          </h3>

                          {/* Attributes Row */}
                          <div className="text-xs text-slate-500 font-medium flex items-center gap-2 flex-wrap">
                            {color && (
                              <span>
                                Color: <strong className="text-slate-700">{color}</strong>
                              </span>
                            )}
                            {color && size && <span className="text-slate-300">|</span>}
                            <span>{size ? `Size: ${size}` : "1 Piece"}</span>
                            <span className="text-slate-300">|</span>
                            <span>
                              Qty: <strong className="text-slate-700">{item.quantity || 1}</strong>
                            </span>
                          </div>

                          {/* Price Row */}
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-lg font-black text-slate-900 font-mono">
                              ₹{unitSellingPrice.toLocaleString("en-IN")}
                            </span>
                            {unitMRP > unitSellingPrice && (
                              <span className="text-xs text-slate-400 line-through font-mono">
                                ₹{unitMRP.toLocaleString("en-IN")}
                              </span>
                            )}
                            {discountPercent > 0 && (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md">
                                {discountPercent}% OFF
                              </span>
                            )}
                          </div>

                          {/* Seller / Store Name */}
                          <p className="text-xs text-slate-500">
                            Sold by: <span className="font-medium text-slate-700">{vendorStoreName}</span>
                          </p>

                          {/* Return Claim Status Tag (if any) */}
                          {latestRequest && (
                            <div className="pt-1">
                              {latestRequest.status === "rejected" ? (
                                <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] border border-rose-200">
                                  <XCircle className="w-3.5 h-3.5" />
                                  {latestRequest.type === "exchange"
                                    ? "Exchange Rejected"
                                    : "Return Rejected"}
                                </span>
                              ) : latestRequest.status === "refunded" ? (
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Returned & Refunded
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  {latestRequest.type === "exchange"
                                    ? "Exchange Claim:"
                                    : "Return Claim:"}{" "}
                                  {String(latestRequest.status).replace(/_/g, " ").toUpperCase()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col items-start sm:items-end gap-2.5 shrink-0 self-start sm:self-center">
                        {canCancelItem && (
                          <button
                            type="button"
                            onClick={() => handleOpenCancelModal(item)}
                            className="px-4 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                          >
                            <XCircle size={15} />
                            <span>
                              {order.items?.length > 1 ? "Cancel Item" : "Cancel Order"}
                            </span>
                          </button>
                        )}

                        {isDelivered && (
                          <div className="flex flex-col items-end gap-2">
                            <ReturnExchangeButton
                              orderId={order._id || orderId}
                              productId={item.product?._id || item.product}
                              item={item}
                              eligibility={eligibility}
                            />
                            {!activeRequest && (
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <span className="text-[11px]">Rate product:</span>
                                <div className="flex gap-0.5 text-amber-400 text-sm">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      className="hover:scale-125 transition-transform cursor-pointer"
                                      onClick={() => toast.success("Review recorded!")}
                                    >
                                      ★
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Order Tracking Status Card */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 sm:p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FD7100] flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                    Order Tracking Status
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1 pl-10.5">
                  Real-time fulfillment progress for this item
                </p>
              </div>

              {/* Cancelled State banner (if order is cancelled) */}
              {isCancelled ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-red-900">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Order Cancelled</span>
                  </div>
                  <p className="text-red-700">
                    This order was cancelled on {formatDateTime(order.updatedAt)}. If any amount was paid, it will be refunded to your original payment method.
                  </p>
                </div>
              ) : (
                /* Standard Vertical Tracking Timeline matching reference image */
                <div className="relative pl-3 sm:pl-4 space-y-8">
                  {trackingSteps.map((step, idx) => {
                    const isLast = idx === trackingSteps.length - 1;
                    const isStepCompleted = step.isCompleted;

                    return (
                      <div key={step.id} className="relative flex items-start gap-4">
                        {/* Connecting Line between steps */}
                        {!isLast && (
                          <div
                            className={`absolute left-[13px] top-[26px] w-[2px] h-[calc(100%+8px)] -z-0 transition-colors ${
                              trackingSteps[idx + 1].isCompleted
                                ? "bg-emerald-500"
                                : "bg-slate-200"
                            }`}
                          />
                        )}

                        {/* Step Circle Node */}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                            isStepCompleted
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-slate-300 text-transparent"
                          }`}
                        >
                          {isStepCompleted ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                          )}
                        </div>

                        {/* Step Details */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-1 min-w-0">
                          <div>
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                              {step.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {step.description}
                            </p>
                            <span className="text-[11px] text-slate-500 font-medium block mt-1">
                              {step.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* See All Updates Action Link */}
              <div className="pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsUpdatesModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FD7100] hover:text-[#e06400] transition-colors cursor-pointer group"
                >
                  <span>See All Updates</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN (4 cols): Collapsible Accordions & Invoice ================= */}
          <div className="lg:col-span-4 space-y-4">
            {/* Card 1: Delivery Details Accordion */}
            {order.shippingAddress && (
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setIsDeliveryExpanded((prev) => !prev)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FD7100] flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900">Delivery Details</h3>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {isDelivered
                          ? `Delivered to ${order.shippingAddress.city || ""}${order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}`
                          : isCancelled
                          ? `Destination: ${order.shippingAddress.city || ""}${order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}`
                          : `Delivering to ${order.shippingAddress.city || ""}${order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}`}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-3">
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isDeliveryExpanded ? "rotate-180 text-slate-700" : ""
                      }`}
                    />
                  </div>
                </button>

                {isDeliveryExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-3 text-xs bg-slate-50/40">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {order.shippingAddress.name || "Customer"}
                      </h4>
                      <p className="text-slate-600 leading-relaxed font-medium">
                        {[
                          order.shippingAddress.address,
                          order.shippingAddress.city,
                          order.shippingAddress.state
                            ? `${order.shippingAddress.state} - ${order.shippingAddress.pincode}`
                            : order.shippingAddress.pincode,
                          order.shippingAddress.country || "India",
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-200/70 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 font-mono font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>+91 {order.shippingAddress.phone || "—"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          toast(
                            "Address change requested. If your order hasn't shipped, our support team will update it.",
                            { icon: "ℹ️" }
                          )
                        }
                        className="border border-orange-300 text-[#FD7100] hover:bg-orange-50 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        Change Address
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Card 2: Price Summary Accordion */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setIsPriceExpanded((prev) => !prev)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FD7100] flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900">Price Summary</h3>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      ₹{totalPaidAmount.toLocaleString("en-IN")} • {isRazorpay ? "Razorpay" : paymentMethodStr.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="font-black text-sm font-mono text-[#FD7100]">
                    ₹{totalPaidAmount.toLocaleString("en-IN")}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isPriceExpanded ? "rotate-180 text-slate-700" : ""
                    }`}
                  />
                </div>
              </button>

              {isPriceExpanded && (
                <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-3 text-xs bg-slate-50/40">
                  {/* Detailed Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Item Total</span>
                      <span className="font-mono font-semibold text-slate-800">
                        ₹{computedMRP.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {totalDiscount > 0 && (
                      <div className="flex items-center justify-between text-emerald-600 font-medium">
                        <span>Discount</span>
                        <span className="font-mono font-bold">
                          - ₹{totalDiscount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}

                    {order.coupon?.code && (
                      <div className="flex items-center justify-between text-emerald-600 font-medium">
                        <span>Coupon ({order.coupon.code})</span>
                        <span className="font-mono font-bold">
                          - ₹{Number(order.discountAmount || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Delivery Charges</span>
                      <div className="flex items-center gap-1.5 font-semibold">
                        {shippingAmount === 0 ? (
                          <>
                            <span className="line-through text-slate-400 font-mono font-normal">
                              ₹40
                            </span>
                            <span className="text-emerald-600 font-bold">FREE</span>
                          </>
                        ) : (
                          <span className="font-mono text-slate-800">
                            ₹{shippingAmount.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Taxes</span>
                      <span className="font-medium text-slate-700">
                        {order.taxAmount ? `₹${Number(order.taxAmount).toLocaleString("en-IN")}` : "Included in price"}
                      </span>
                    </div>
                  </div>

                  {/* Highlighted Total Amount Row */}
                  <div className="bg-[#FFF6F0] rounded-xl p-3 flex items-center justify-between border border-orange-100 mt-2">
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">
                      {isRazorpay ? "Total Amount Paid" : "Total Amount to Pay (COD)"}
                    </span>
                    <span className="font-black text-lg text-[#FD7100] font-mono">
                      ₹{totalPaidAmount.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Payment Method & Status */}
                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-700 font-medium">
                        {isRazorpay ? "Online Payment (Razorpay)" : "Cash on Delivery (COD)"}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        order.paymentStatus === "paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : order.paymentStatus === "refunded"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {order.paymentStatus || (isRazorpay ? "Paid" : "Pending")}
                    </span>
                  </div>

                  {/* Savings Banner */}
                  {totalSavings > 0 && (
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl py-2 px-3 text-xs font-bold text-center mt-2">
                      🎉 You saved ₹{totalSavings.toLocaleString("en-IN")} on this order!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card 3: Download Invoice (Preserved & Fully Functional) */}
            <div
              onClick={handleDownloadInvoice}
              className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 hover:border-orange-300 hover:bg-orange-50/20 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FD7100] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-slate-800 group-hover:text-[#FD7100] transition-colors">
                  Download Invoice
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#FD7100] transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* See All Updates Scrollable Popup Modal */}
      {isUpdatesModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          onClick={() => setIsUpdatesModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FD7100] flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    All Tracking Updates
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Order #{order.orderId || order._id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUpdatesModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Scrollable Journey Timeline */}
            <div className="p-5 sm:p-6 overflow-y-auto max-h-[60vh] space-y-6">
              {(() => {
                const updates = getUpdatesTimeline();
                if (updates.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 text-center py-8">
                      No tracking updates recorded yet.
                    </p>
                  );
                }

                return (
                  <div className="relative pl-3 space-y-6">
                    {updates.map((step, idx) => {
                      const isLast = idx === updates.length - 1;

                      return (
                        <div key={step.id || idx} className="relative flex items-start gap-4">
                          {/* Connecting line */}
                          {!isLast && (
                            <div className="absolute left-[13px] top-[26px] w-[2px] h-[calc(100%+16px)] bg-emerald-500 -z-0" />
                          )}

                          {/* Step Node */}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                              step.id === "cancelled"
                                ? "bg-rose-600 text-white shadow-xs"
                                : step.id === "refund"
                                ? "bg-purple-600 text-white shadow-xs"
                                : "bg-emerald-600 text-white shadow-xs"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>

                          {/* Step Content */}
                          <div className="flex-1 min-w-0 bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                {step.title}
                              </h4>
                              <span className="text-[11px] font-mono text-slate-500">
                                {step.timestamp}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50/80 border-t border-gray-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsUpdatesModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order / Item Confirmation Modal */}
      <CancelOrderModal
        isOpen={cancelModalState.isOpen}
        onClose={() =>
          setCancelModalState({ isOpen: false, targetItem: null, isLoading: false })
        }
        onConfirm={handleConfirmCancel}
        order={order}
        targetItem={cancelModalState.targetItem}
        isLoading={cancelModalState.isLoading}
      />
    </div>
  );
};

export default OrderDetails;
