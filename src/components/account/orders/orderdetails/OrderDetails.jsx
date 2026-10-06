import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const selectedItemId =
    searchParams.get("item") ||
    searchParams.get("itemId") ||
    location.state?.selectedItemId;
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

    const itemsHtml = displayedItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <strong>${item.product?.title || "Product"}</strong>
            <div style="font-size: 11px; color: #666; margin-top: 2px;">Brand: ${item.product?.brand?.name || item.product?.brand || "SwagSync"} | Qty: ${item.quantity || 1}</div>
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
            <div>Fulfillment Status: ${(currentItemStatus || order.status || "Pending").toUpperCase()}</div>
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
          <div><span>Items Subtotal:</span><span>₹${Number(displaySubtotal || 0).toLocaleString("en-IN")}</span></div>
          ${displayCouponDiscount ? `<div style="color: #16a34a;"><span>Promo Discount:</span><span>-₹${Number(displayCouponDiscount).toLocaleString("en-IN")}</span></div>` : ""}
          <div><span>Delivery Charges:</span><span>${Number(displayShipping || 0) === 0 ? "FREE" : `₹${Number(displayShipping || 0).toLocaleString("en-IN")}`}</span></div>
          <div class="grand-total"><span>Total Paid Amount:</span><span>₹${Number(displayTotalPaid || 0).toLocaleString("en-IN")}</span></div>
        </div>

        <div style="margin-top: 48px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          This is a computer-generated customer receipt for SwagSync marketplace order #${order.orderId || order._id}${selectedItem ? ` (${selectedItem.product?.title || "Item"})` : ""}.
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

  // Order items resolution
  const allOrderItems = Array.isArray(order.items) ? order.items : [];
  const selectedItem = selectedItemId
    ? allOrderItems.find(
        (i) =>
          String(i._id) === String(selectedItemId) ||
          String(i.product?._id || i.product) === String(selectedItemId)
      ) || null
    : null;

  const displayedItems = selectedItem ? [selectedItem] : allOrderItems;

  // Whole-order calculations
  const orderSubtotal =
    Number(order.subtotal || 0) ||
    allOrderItems.reduce(
      (acc, i) =>
        acc + Number(i.sellingPrice ?? i.price ?? i.mrp ?? 0) * (i.quantity || 1),
      0
    );
  const computedMRP =
    Number(order.totalMRP || 0) ||
    allOrderItems.reduce(
      (acc, i) =>
        acc + Number(i.mrp ?? i.sellingPrice ?? i.price ?? 0) * (i.quantity || 1),
      0
    );
  const totalPaidAmount = Number(order.totalAmount || orderSubtotal);
  const shippingAmount = Number(order.shippingAmount || 0);

  // Proportional item-level pricing when an individual product/item is selected
  const unitSellingPrice = selectedItem
    ? Number(selectedItem.sellingPrice ?? selectedItem.price ?? selectedItem.mrp ?? 0)
    : 0;
  const unitMRP = selectedItem
    ? Number(selectedItem.mrp ?? selectedItem.sellingPrice ?? selectedItem.price ?? 0)
    : 0;
  const selectedQty = selectedItem ? Number(selectedItem.quantity || 1) : 1;
  const itemGrossSelling = unitSellingPrice * selectedQty;
  const itemGrossMRP = unitMRP * selectedQty;

  // Coupon calculation
  const calculatedCouponDiff = Math.max(
    0,
    Math.round((orderSubtotal + shippingAmount) - totalPaidAmount)
  );

  const orderCouponDiscount =
    calculatedCouponDiff > 0
      ? calculatedCouponDiff
      : (order.coupon?.value
          ? (order.coupon.type === "percentage"
              ? Math.round((orderSubtotal * Number(order.coupon.value)) / 100)
              : Number(order.coupon.value))
          : (order.coupon?.code ? Number(order.discountAmount || 0) : 0));

  const proportionalCouponDiscount =
    selectedItem && orderSubtotal > 0 && itemGrossSelling > 0 && orderCouponDiscount > 0
      ? Math.round((itemGrossSelling / orderSubtotal) * orderCouponDiscount)
      : (selectedItem ? 0 : orderCouponDiscount);

  const proportionalShipping =
    selectedItem && orderSubtotal > 0 && itemGrossSelling > 0 && shippingAmount > 0
      ? Math.round((itemGrossSelling / orderSubtotal) * shippingAmount)
      : (selectedItem ? 0 : shippingAmount);

  // Effective display values (switches to item-specific when user clicked a specific product)
  const displaySubtotal = selectedItem ? itemGrossSelling : orderSubtotal;
  const displayMRP = selectedItem ? itemGrossMRP : computedMRP;
  const displayMRPDiscount = Math.max(0, displayMRP - displaySubtotal);
  const displayShipping = proportionalShipping;
  const displayCouponDiscount = proportionalCouponDiscount;
  const displayTotalPaid = selectedItem
    ? Math.max(0, itemGrossSelling - proportionalCouponDiscount + proportionalShipping)
    : Math.max(0, orderSubtotal - orderCouponDiscount + shippingAmount);
  const displaySavings = displayMRPDiscount + displayCouponDiscount;
  const displayTax = selectedItem
    ? (selectedItem.gstAmount ? Number(selectedItem.gstAmount) * selectedQty : null)
    : (order.taxAmount ? Number(order.taxAmount) : null);
  const displayGstRate = selectedItem?.gstRate ? Number(selectedItem.gstRate) : null;

  const totalItemCount = displayedItems.reduce(
    (acc, i) => acc + (Number(i.quantity) || 1),
    0
  );

  // Item-specific status & milestones (as vendor and admin manage each item status separately)
  const currentItemStatus = (
    selectedItem
      ? selectedItem.status || order.status || "pending"
      : order.status || "pending"
  ).toLowerCase();

  const isCancelled = currentItemStatus === "cancelled";
  const isDelivered = currentItemStatus === "delivered";
  const isShipped = ["shipped", "on_the_way", "out_for_delivery", "delivered"].includes(currentItemStatus);
  const isPacked = ["packed", "processing", "shipped", "on_the_way", "out_for_delivery", "delivered"].includes(currentItemStatus);

  const activeCourier =
    selectedItem?.courier ||
    order.courierPartner ||
    order.shippingDetails?.courierPartner ||
    null;
  const activeTrackingNumber =
    selectedItem?.trackingNumber ||
    order.trackingNumber ||
    order.shippingDetails?.trackingNumber ||
    null;

  const itemReturnRequests = (
    Array.isArray(order.returnRequests) ? order.returnRequests : []
  ).filter((req) => {
    if (!selectedItem) return true;
    const reqProdId = String(req.product?._id || req.product || "");
    const targetProdId = String(selectedItem.product?._id || selectedItem.product || "");
    const reqItemId = String(req.orderItemId || req.item?._id || req.item || "");
    const targetItemId = String(selectedItem._id || "");
    return (reqItemId && reqItemId === targetItemId) || (reqProdId && reqProdId === targetProdId);
  });

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

  // 1. Single Current Tracking Status (Main Page view)
  // STRICT: Main page ALWAYS shows ONLY the current/latest status, never the full journey flow
  const getCurrentTrackingStatusName = () => {
    const activeReturn = itemReturnRequests.length > 0 ? itemReturnRequests[0] : null;

    if (activeReturn) {
      const isExchange = activeReturn.type === "exchange";
      const reqStatus = (activeReturn.status || "pending").toLowerCase();

      if (isExchange) {
        if (reqStatus === "rejected") return "Exchange Rejected";
        if (["completed", "exchanged"].includes(reqStatus)) return "Replacement Delivered";
        if (reqStatus === "shipped") return "Replacement Shipped";
        if (reqStatus === "received") return "Item Received";
        if (reqStatus === "picked_up") return "Pickup Completed";
        if (["pickup_scheduled", "pickup", "pickup_replace"].includes(reqStatus)) return "Pickup Scheduled";
        if (reqStatus === "approved") return "Exchange Approved";
        return "Exchange Requested";
      } else {
        if (reqStatus === "rejected") return "Return Rejected";
        if (["refunded", "completed"].includes(reqStatus)) return "Refund / Return Completed";
        if (reqStatus === "received") return "Item Received";
        if (reqStatus === "picked_up") return "Pickup Completed";
        if (["pickup_scheduled", "pickup"].includes(reqStatus)) return "Pickup Scheduled";
        if (reqStatus === "approved") return "Return Approved";
        return "Return Requested";
      }
    }

    if (isCancelled) {
      return "Cancelled";
    }

    if (currentItemStatus === "delivered") {
      return "Delivered";
    }

    if (["out_for_delivery", "on_the_way"].includes(currentItemStatus)) {
      return "Out for Delivery";
    }

    if (currentItemStatus === "shipped") {
      return "Shipped";
    }

    if (["packed", "processing"].includes(currentItemStatus)) {
      return "Packed";
    }

    if (["pending", "placed", "confirmed", "order_confirmed"].includes(currentItemStatus)) {
      return "Order Confirmed";
    }

    return currentItemStatus.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // 2. Complete Expected Timeline for "See All Updates" Popup Modal
  // Shows full expected journey: completed stages are highlighted, upcoming stages stay inactive/pending
  const getUpdatesTimeline = () => {
    const activeReturn = itemReturnRequests.length > 0 ? itemReturnRequests[0] : null;

    const parseDateTime = (d) => {
      if (!d) return { date: "-", time: "" };
      try {
        const dateObj = new Date(d);
        if (isNaN(dateObj.getTime())) return { date: "-", time: "" };
        return {
          date: dateObj.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          time: dateObj.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        };
      } catch {
        return { date: "-", time: "" };
      }
    };

    const courierName = activeCourier;
    const awbNumber = activeTrackingNumber;
    const itemCancellationReason = selectedItem?.cancellationReason || order.cancellationReason || "";

    // 1. EXCHANGE JOURNEY:
    // Delivered → Exchange Requested → Exchange Approved → Pickup → Item Received → Replacement Shipped → Replacement Delivered
    if (activeReturn && activeReturn.type === "exchange") {
      const reqStatus = (activeReturn.status || "pending").toLowerCase();
      const timelineEvents = Array.isArray(activeReturn.timeline) ? activeReturn.timeline : [];

      const findEventDate = (keywords) => {
        const ev = timelineEvents.find((e) =>
          keywords.some((kw) => String(e.type || "").toLowerCase().includes(kw))
        );
        return ev?.timestamp || activeReturn.updatedAt;
      };

      const dtDelivered = parseDateTime(order.deliveredAt || order.updatedAt);
      const dtExchReq = parseDateTime(activeReturn.createdAt);

      if (reqStatus === "rejected") {
        const dtRej = parseDateTime(findEventDate(["reject"]));
        return [
          {
            id: "delivered_orig",
            title: "Delivered",
            description: "Original order item was delivered to your address.",
            date: dtDelivered.date,
            time: dtDelivered.time,
            icon: CheckCircle2,
            isCompleted: true,
          },
          {
            id: "exch_requested",
            title: "Exchange Requested",
            description: activeReturn.reason
              ? `Exchange requested: ${activeReturn.reason}${activeReturn.additionalDetails ? ` - "${activeReturn.additionalDetails}"` : ""}.`
              : "Exchange request submitted by customer.",
            date: dtExchReq.date,
            time: dtExchReq.time,
            icon: RefreshCw,
            isCompleted: true,
          },
          {
            id: "exch_rejected",
            title: "Exchange Rejected",
            description: activeReturn.adminComments || activeReturn.rejectionReason || "Exchange request was not approved by seller verification.",
            date: dtRej.date,
            time: dtRej.time,
            icon: XCircle,
            isCompleted: true,
          },
        ];
      }

      const isApproved = [
        "approved", "pickup_scheduled", "pickup", "pickup_replace",
        "replace_and_exchange", "picked_up", "received", "packed",
        "shipped", "completed", "exchanged"
      ].includes(reqStatus);

      const isPickup = [
        "picked_up", "received", "packed", "shipped", "completed", "exchanged"
      ].includes(reqStatus);

      const isReceived = [
        "received", "packed", "shipped", "completed", "exchanged"
      ].includes(reqStatus);

      const isReplShipped = [
        "shipped", "completed", "exchanged"
      ].includes(reqStatus);

      const isReplDelivered = [
        "completed", "exchanged"
      ].includes(reqStatus);

      const dtAppr = isApproved ? parseDateTime(findEventDate(["approve"])) : { date: "", time: "" };
      const dtPickup = isPickup ? parseDateTime(findEventDate(["pickup", "picked"])) : { date: "", time: "" };
      const dtRecv = isReceived ? parseDateTime(findEventDate(["received"])) : { date: "", time: "" };
      const dtReplShip = isReplShipped ? parseDateTime(findEventDate(["ship", "replacement"])) : { date: "", time: "" };
      const dtReplDelv = isReplDelivered ? parseDateTime(findEventDate(["deliver", "complete"])) : { date: "", time: "" };

      return [
        {
          id: "delivered_orig",
          title: "Delivered",
          description: "Original order item was delivered to your address.",
          date: dtDelivered.date,
          time: dtDelivered.time,
          icon: CheckCircle2,
          isCompleted: true,
        },
        {
          id: "exch_requested",
          title: "Exchange Requested",
          description: activeReturn.reason
            ? `Exchange requested: ${activeReturn.reason}${activeReturn.additionalDetails ? ` - "${activeReturn.additionalDetails}"` : ""}.`
            : "Exchange request submitted by customer.",
          date: dtExchReq.date,
          time: dtExchReq.time,
          icon: RefreshCw,
          isCompleted: true,
        },
        {
          id: "exch_approved",
          title: "Exchange Approved",
          description: isApproved
            ? "Exchange request has been approved by the seller and support team."
            : "Awaiting seller inspection and verification to approve exchange.",
          date: dtAppr.date,
          time: dtAppr.time,
          icon: CheckCircle2,
          isCompleted: isApproved,
        },
        {
          id: "exch_pickup",
          title: "Pickup",
          description: isPickup
            ? "The return item has been collected by our courier executive."
            : "Courier agent will be dispatched to collect the item from your doorstep.",
          date: dtPickup.date,
          time: dtPickup.time,
          courier: isPickup ? courierName : null,
          icon: Truck,
          isCompleted: isPickup,
        },
        {
          id: "exch_received",
          title: "Item Received",
          description: isReceived
            ? "Item safely received at fulfillment center and inspected."
            : "Package will be inspected upon arrival at the seller hub.",
          date: dtRecv.date,
          time: dtRecv.time,
          icon: Package,
          isCompleted: isReceived,
        },
        {
          id: "exch_repl_shipped",
          title: "Replacement Shipped",
          description: isReplShipped
            ? "Your replacement item has been dispatched and is in transit."
            : "Replacement item will be packed and handed over to courier.",
          date: dtReplShip.date,
          time: dtReplShip.time,
          courier: isReplShipped ? courierName : null,
          awb: isReplShipped ? awbNumber : null,
          icon: Truck,
          isCompleted: isReplShipped,
        },
        {
          id: "exch_repl_delivered",
          title: "Replacement Delivered",
          description: isReplDelivered
            ? "Replacement item successfully delivered to your doorstep. Exchange closed."
            : "Replacement item will be delivered to your delivery address.",
          date: dtReplDelv.date,
          time: dtReplDelv.time,
          icon: CheckCircle2,
          isCompleted: isReplDelivered,
        },
      ];
    }

    // 2. RETURN JOURNEY:
    // Delivered → Return Requested → Return Approved → Pickup → Item Received → Refund/Return Completed
    if (activeReturn && activeReturn.type !== "exchange") {
      const reqStatus = (activeReturn.status || "pending").toLowerCase();
      const timelineEvents = Array.isArray(activeReturn.timeline) ? activeReturn.timeline : [];

      const findEventDate = (keywords) => {
        const ev = timelineEvents.find((e) =>
          keywords.some((kw) => String(e.type || "").toLowerCase().includes(kw))
        );
        return ev?.timestamp || activeReturn.updatedAt;
      };

      const dtDelivered = parseDateTime(order.deliveredAt || order.updatedAt);
      const dtRetReq = parseDateTime(activeReturn.createdAt);

      if (reqStatus === "rejected") {
        const dtRej = parseDateTime(findEventDate(["reject"]));
        return [
          {
            id: "delivered_orig",
            title: "Delivered",
            description: "Original order item was delivered to your address.",
            date: dtDelivered.date,
            time: dtDelivered.time,
            icon: CheckCircle2,
            isCompleted: true,
          },
          {
            id: "ret_requested",
            title: "Return Requested",
            description: activeReturn.reason
              ? `Return requested: ${activeReturn.reason}${activeReturn.additionalDetails ? ` - "${activeReturn.additionalDetails}"` : ""}.`
              : "Return request submitted by customer.",
            date: dtRetReq.date,
            time: dtRetReq.time,
            icon: RefreshCw,
            isCompleted: true,
          },
          {
            id: "ret_rejected",
            title: "Return Rejected",
            description: activeReturn.adminComments || activeReturn.rejectionReason || "Return request was not approved by seller verification.",
            date: dtRej.date,
            time: dtRej.time,
            icon: XCircle,
            isCompleted: true,
          },
        ];
      }

      const isApproved = [
        "approved", "pickup_scheduled", "pickup", "picked_up",
        "received", "completed", "refunded"
      ].includes(reqStatus);

      const isPickup = [
        "picked_up", "received", "completed", "refunded"
      ].includes(reqStatus);

      const isReceived = [
        "received", "completed", "refunded"
      ].includes(reqStatus);

      const isCompleted = [
        "completed", "refunded"
      ].includes(reqStatus);

      const dtAppr = isApproved ? parseDateTime(findEventDate(["approve"])) : { date: "", time: "" };
      const dtPickup = isPickup ? parseDateTime(findEventDate(["pickup", "picked"])) : { date: "", time: "" };
      const dtRecv = isReceived ? parseDateTime(findEventDate(["received"])) : { date: "", time: "" };
      const dtCompl = isCompleted ? parseDateTime(activeReturn.refundProcessedAt || findEventDate(["refund", "complete"])) : { date: "", time: "" };

      return [
        {
          id: "delivered_orig",
          title: "Delivered",
          description: "Original order item was delivered to your address.",
          date: dtDelivered.date,
          time: dtDelivered.time,
          icon: CheckCircle2,
          isCompleted: true,
        },
        {
          id: "ret_requested",
          title: "Return Requested",
          description: activeReturn.reason
            ? `Return requested: ${activeReturn.reason}${activeReturn.additionalDetails ? ` - "${activeReturn.additionalDetails}"` : ""}.`
            : "Return request submitted by customer.",
          date: dtRetReq.date,
          time: dtRetReq.time,
          icon: RefreshCw,
          isCompleted: true,
        },
        {
          id: "ret_approved",
          title: "Return Approved",
          description: isApproved
            ? "Return request has been verified and accepted by the seller."
            : "Return approval pending seller verification.",
          date: dtAppr.date,
          time: dtAppr.time,
          icon: CheckCircle2,
          isCompleted: isApproved,
        },
        {
          id: "ret_pickup",
          title: "Pickup",
          description: isPickup
            ? "Return item collected from your doorstep by logistics executive."
            : "Logistics courier will be assigned to collect return item.",
          date: dtPickup.date,
          time: dtPickup.time,
          courier: isPickup ? courierName : null,
          icon: Truck,
          isCompleted: isPickup,
        },
        {
          id: "ret_received",
          title: "Item Received",
          description: isReceived
            ? "Returned item safely received at fulfillment center and inspected."
            : "Item will be inspected upon arrival at fulfillment center.",
          date: dtRecv.date,
          time: dtRecv.time,
          icon: Package,
          isCompleted: isReceived,
        },
        {
          id: "ret_completed",
          title: "Refund/Return Completed",
          description: isCompleted
            ? `Return closed successfully.${activeReturn.refundAmount ? ` Refund of ₹${Number(activeReturn.refundAmount).toLocaleString("en-IN")} credited to your payment account.` : " Refund processed."}`
            : "Refund will be initiated once item is verified at warehouse.",
          date: dtCompl.date,
          time: dtCompl.time,
          icon: DollarSign,
          isCompleted: isCompleted,
        },
      ];
    }

    // 3. CANCELLED JOURNEY:
    // Order Confirmed → Cancelled → Refund (show Refund only when applicable)
    if (isCancelled) {
      const dtPlaced = parseDateTime(order.createdAt);
      const dtCancel = parseDateTime(order.updatedAt);
      const isOnlinePaid = isRazorpay || ["paid", "refunded"].includes(order.paymentStatus);

      const steps = [
        {
          id: "placed",
          title: "Order Confirmed",
          description: "Your order was successfully placed and verified.",
          date: dtPlaced.date,
          time: dtPlaced.time,
          icon: CheckCircle2,
          isCompleted: true,
        },
        {
          id: "cancelled",
          title: "Cancelled",
          description: itemCancellationReason
            ? `Item cancelled. Reason: ${itemCancellationReason}`
            : "This item has been cancelled.",
          date: dtCancel.date,
          time: dtCancel.time,
          icon: XCircle,
          isCompleted: true,
        },
      ];

      if (isOnlinePaid) {
        const isRefundDone = order.paymentStatus === "refunded";
        const dtRefund = isRefundDone ? parseDateTime(order.updatedAt) : { date: "", time: "" };

        steps.push({
          id: "refund",
          title: isRefundDone ? "Refund Completed" : "Refund Processing",
          description: isRefundDone
            ? `Refund of ₹${displayTotalPaid.toLocaleString("en-IN")} has been credited to your original payment mode.`
            : `Refund of ₹${displayTotalPaid.toLocaleString("en-IN")} is being processed by the payment gateway.`,
          date: dtRefund.date,
          time: dtRefund.time,
          icon: DollarSign,
          isCompleted: isRefundDone,
        });
      }

      return steps;
    }

    // 4. NORMAL DELIVERY JOURNEY (All 5 expected stages):
    // Order Confirmed → Packed → Shipped → Out for Delivery → Delivered
    const isPackedStep = ["packed", "processing", "shipped", "on_the_way", "out_for_delivery", "delivered"].includes(currentItemStatus);
    const isShippedStep = ["shipped", "on_the_way", "out_for_delivery", "delivered"].includes(currentItemStatus);
    const isOutStep = ["on_the_way", "out_for_delivery", "delivered"].includes(currentItemStatus);
    const isDeliveredStep = currentItemStatus === "delivered";

    const dtPlaced = parseDateTime(order.createdAt);

    const packDate = isPackedStep
      ? (order.timeline || []).find((e) => String(e.type || "").toLowerCase().includes("pack"))?.timestamp || order.createdAt
      : null;
    const dtPack = isPackedStep ? parseDateTime(packDate) : { date: "", time: "" };

    const shipDate = isShippedStep
      ? (order.timeline || []).find((e) => String(e.type || "").toLowerCase().includes("ship"))?.timestamp || order.updatedAt
      : null;
    const dtShip = isShippedStep ? parseDateTime(shipDate) : { date: "", time: "" };

    const outDate = isOutStep
      ? (order.timeline || []).find((e) => ["out", "on_the_way"].some((kw) => String(e.type || "").toLowerCase().includes(kw)))?.timestamp || order.updatedAt
      : null;
    const dtOut = isOutStep ? parseDateTime(outDate) : { date: "", time: "" };

    const delvDate = isDeliveredStep ? order.deliveredAt || order.updatedAt : null;
    const dtDelv = isDeliveredStep ? parseDateTime(delvDate) : { date: "", time: "" };

    return [
      {
        id: "placed",
        title: "Order Confirmed",
        description: "Your order has been confirmed and verified by SwagSync.",
        date: dtPlaced.date,
        time: dtPlaced.time,
        icon: CheckCircle2,
        isCompleted: true,
      },
      {
        id: "packed",
        title: "Packed",
        description: isPackedStep
          ? "Item has been inspected, quality-checked, and safely packed by merchant."
          : "Item will be inspected, quality-checked, and safely packed by merchant.",
        date: dtPack.date,
        time: dtPack.time,
        icon: Package,
        isCompleted: isPackedStep,
      },
      {
        id: "shipped",
        title: "Shipped",
        description: isShippedStep
          ? "Your package has been dispatched from the seller hub and is in transit."
          : "Your package will be dispatched from the seller hub via courier.",
        date: dtShip.date,
        time: dtShip.time,
        courier: isShippedStep ? courierName : null,
        awb: isShippedStep ? awbNumber : null,
        icon: Truck,
        isCompleted: isShippedStep,
      },
      {
        id: "on_the_way",
        title: "Out for Delivery",
        description: isOutStep
          ? "Courier delivery executive is out for delivery to your doorstep today."
          : "Package will be assigned to a local delivery executive for doorstep delivery.",
        date: dtOut.date,
        time: dtOut.time,
        courier: isOutStep ? courierName : null,
        awb: isOutStep ? awbNumber : null,
        icon: Truck,
        isCompleted: isOutStep,
      },
      {
        id: "delivered",
        title: "Delivered",
        description: isDeliveredStep
          ? "Package was safely delivered to recipient. Thank you for shopping with SwagSync!"
          : "Package will be delivered to your delivery address.",
        date: dtDelv.date,
        time: dtDelv.time,
        icon: CheckCircle2,
        isCompleted: isDeliveredStep,
      },
    ];
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

              {/* Items List - Displays only the selected item if item param was provided, or all items */}
              <div className="divide-y divide-gray-100">
                {displayedItems.map((item, index) => {
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
                              hideTrackButton={true}
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

              {/* Quick switcher to other items in the same order if multi-item */}
              {allOrderItems.length > 1 && selectedItem && (
                <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500 font-medium">
                    Other items in Order #{order.orderId || order._id}:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {allOrderItems
                      .filter(
                        (other) =>
                          String(other._id) !== String(selectedItem._id) &&
                          String(other.product?._id || other.product) !==
                            String(selectedItem.product?._id || selectedItem.product)
                      )
                      .map((other, idx) => {
                        const itemParam = other._id || other.product?._id || other.product;
                        return (
                          <button
                            key={other._id || idx}
                            type="button"
                            onClick={() => {
                              navigate(`/account/orders/${order._id}?item=${itemParam}`, {
                                state: { selectedItemId: itemParam },
                              });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#FD7100] font-bold transition-colors cursor-pointer text-xs inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <span className="truncate max-w-[140px] sm:max-w-[200px]">
                              {other.product?.title || `Item ${idx + 1}`}
                            </span>
                            <span>→</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Compact Order Tracking Status Card */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FD7100] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                    Order Tracking Status
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Order fulfillment progress
                  </p>
                </div>
              </div>

              {/* Compact Tracking Summary: ALWAYS show only the single current/latest status */}
              <div className="py-2">
                {(() => {
                  const currentStatus = getCurrentTrackingStatusName();
                  const isCancelOrReject =
                    currentStatus.toLowerCase().includes("cancel") ||
                    currentStatus.toLowerCase().includes("reject");
                  const isReturnOrExchange =
                    currentStatus.toLowerCase().includes("return") ||
                    currentStatus.toLowerCase().includes("exchange") ||
                    currentStatus.toLowerCase().includes("pickup");

                  return (
                    <span
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs border ${
                        isCancelOrReject
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : isReturnOrExchange
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-300"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isCancelOrReject
                            ? "bg-rose-500"
                            : isReturnOrExchange
                            ? "bg-amber-500"
                            : "bg-emerald-500 animate-pulse"
                        }`}
                      />
                      {currentStatus}
                    </span>
                  );
                })()}
              </div>

              {/* See All Updates Link */}
              <div className="pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsUpdatesModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FD7100] hover:text-[#e06400] transition-colors cursor-pointer group"
                >
                  <span>See All Updates</span>
                  <span className="transition-transform group-hover:translate-x-0.5 font-bold">→</span>
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
                      ₹{displayTotalPaid.toLocaleString("en-IN")} • {isRazorpay ? "Razorpay" : paymentMethodStr.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="font-black text-sm font-mono text-[#FD7100]">
                    ₹{displayTotalPaid.toLocaleString("en-IN")}
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
                      <span className="text-slate-500 font-medium">
                        Item Total (MRP){totalItemCount > 1 ? ` (${totalItemCount} items)` : ""}
                      </span>
                      <span className="font-mono font-semibold text-slate-800">
                        ₹{displayMRP.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {displayMRPDiscount > 0 && (
                      <div className="flex items-center justify-between text-emerald-600 font-medium">
                        <span>Discount on MRP</span>
                        <span className="font-mono font-bold">
                          - ₹{displayMRPDiscount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}

                    {displayCouponDiscount > 0 && (
                      <div className="flex items-center justify-between text-emerald-600 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <span>Coupon Discount</span>
                          {order.coupon?.code && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                              {order.coupon.code}
                            </span>
                          )}
                        </span>
                        <span className="font-mono font-bold">
                          - ₹{displayCouponDiscount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Delivery Charges</span>
                      <div className="flex items-center gap-1.5 font-semibold">
                        {displayShipping === 0 ? (
                          <>
                            <span className="line-through text-slate-400 font-mono font-normal">
                              ₹40
                            </span>
                            <span className="text-emerald-600 font-bold">FREE</span>
                          </>
                        ) : (
                          <span className="font-mono text-slate-800">
                            ₹{displayShipping.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* GST / Taxes Row (Clarified Inclusive Status) */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-500 font-medium">
                          {displayGstRate ? `Estimated GST (${displayGstRate}%)` : "Estimated GST / Taxes"}
                        </span>
                        <span className="text-[10px] text-emerald-600 block font-medium">
                          ✓ Included in item selling price
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 font-mono font-semibold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded text-[11px] border border-slate-200/80">
                          Included {displayTax ? `(₹${Math.round(Number(displayTax)).toLocaleString("en-IN")})` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Highlighted Total Amount Row */}
                  <div className="bg-[#FFF6F0] rounded-xl p-3 border border-orange-100 mt-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">
                        {isRazorpay ? "Total Amount Paid" : "Total Amount to Pay (COD)"}
                      </span>
                      <span className="font-black text-lg text-[#FD7100] font-mono">
                        ₹{displayTotalPaid.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium flex items-center justify-between pt-1 border-t border-orange-200/50">
                      <span>Inclusive of all taxes & GST</span>
                      {displayTax > 0 && (
                        <span className="font-mono text-slate-500">
                          (₹{Math.round(Number(displayTax)).toLocaleString("en-IN")} GST)
                        </span>
                      )}
                    </div>
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
                  {displaySavings > 0 && (
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl py-2 px-3 text-xs font-bold text-center mt-2">
                      🎉 You saved ₹{displaySavings.toLocaleString("en-IN")} on this {selectedItem ? "item" : "order"}!
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
                      const IconComp = step.icon || CheckCircle2;
                      const isCompleted = !!step.isCompleted;
                      const nextStepCompleted = !isLast && !!updates[idx + 1]?.isCompleted;
                      const isCancelled = step.id === "cancelled" || step.id.includes("reject");
                      const isRefund = step.id === "refund";

                      return (
                        <div key={step.id || idx} className="relative flex items-start gap-4">
                          {/* Connecting line */}
                          {!isLast && (
                            <div
                              className={`absolute left-[13px] top-[26px] w-[2px] h-[calc(100%+24px)] -z-0 transition-colors ${
                                nextStepCompleted ? "bg-emerald-500" : "bg-slate-200"
                              }`}
                            />
                          )}

                          {/* Step Node */}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                              isCancelled
                                ? "bg-rose-600 text-white shadow-xs"
                                : isRefund && isCompleted
                                ? "bg-purple-600 text-white shadow-xs"
                                : isCompleted
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-slate-100 text-slate-400 border-2 border-slate-300"
                            }`}
                          >
                            <IconComp className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>

                          {/* Step Card with Status, Date, Time, Message, Courier & AWB */}
                          <div
                            className={`flex-1 min-w-0 rounded-xl p-3.5 space-y-2 transition-all ${
                              isCompleted
                                ? "bg-white border border-slate-200/90 shadow-2xs"
                                : "bg-slate-50/50 border border-dashed border-slate-200 opacity-60"
                            }`}
                          >
                            {/* Status Title + Date/Time */}
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <h4
                                  className={`text-xs sm:text-sm font-bold ${
                                    isCompleted ? "text-slate-900" : "text-slate-500"
                                  }`}
                                >
                                  {step.title}
                                </h4>
                                {!isCompleted && (
                                  <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                    Pending
                                  </span>
                                )}
                              </div>
                              {isCompleted && (step.date || step.time) && (
                                <div className="text-right">
                                  <span className="text-[11px] font-semibold text-slate-700 block">
                                    {step.date}
                                  </span>
                                  {step.time && step.time !== "-" && (
                                    <span className="text-[10px] text-slate-500 block font-mono">
                                      {step.time}
                                    </span>
                                  )}
                                </div>
                              )}
                              {!isCompleted && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Upcoming
                                </span>
                              )}
                            </div>

                            {/* Detailed Status Message */}
                            <p
                              className={`text-xs leading-relaxed ${
                                isCompleted
                                  ? "text-slate-600 font-medium"
                                  : "text-slate-400 font-normal"
                              }`}
                            >
                              {step.description}
                            </p>

                            {/* Courier & AWB / Tracking info if available */}
                            {isCompleted && (step.courier || step.awb) && (
                              <div className="pt-2 mt-1 border-t border-slate-200/60 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                                {step.courier && (
                                  <span className="text-slate-600 inline-flex items-center gap-1">
                                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                                    <strong className="text-slate-700 font-semibold">Courier:</strong>{" "}
                                    <span>{step.courier}</span>
                                  </span>
                                )}
                                {step.awb && (
                                  <span className="text-slate-600 inline-flex items-center gap-1">
                                    <strong className="text-slate-700 font-semibold">AWB / Tracking:</strong>{" "}
                                    <span className="font-mono font-medium text-slate-800 bg-slate-200/60 px-1.5 py-0.5 rounded text-[11px]">
                                      {step.awb}
                                    </span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer: Clear Close/Back controls */}
            <div className="p-4 bg-slate-50/80 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsUpdatesModalOpen(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <span>← Back to Order</span>
              </button>

              <button
                type="button"
                onClick={() => setIsUpdatesModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
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
