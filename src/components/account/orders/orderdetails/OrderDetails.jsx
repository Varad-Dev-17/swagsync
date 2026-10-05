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
  Star,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import toast from "react-hot-toast";
import { CustomerTimelineAccordion } from "./CustomerTrackingCard";
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
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();

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
      badge: isShipped ? (
        <div className="bg-emerald-50 border border-emerald-200/90 rounded-xl px-4 py-2.5 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-800 block">
              {isDelivered ? "Delivered" : "Shipped"}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">
              {isDelivered
                ? `Delivered on ${formatDateShort(order.deliveredAt || order.updatedAt)}`
                : `Arriving by ${estArrivalDate}`}
            </span>
          </div>
        </div>
      ) : null,
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
                    Items in this Order ({order.items?.length || 0})
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

                        {/* Step Details & Optional Far-Right Badge */}
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

                          {step.badge && <div>{step.badge}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Expandable Journey History Accordion (for return/exchange claims or logistics updates) */}
              <CustomerTimelineAccordion order={order} defaultOpen={false} />
            </div>
          </div>

          {/* ================= RIGHT COLUMN (4 cols): Summary & Metadata ================= */}
          <div className="lg:col-span-4 space-y-5">
            {/* Card 1: Delivery To */}
            {order.shippingAddress && (
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 space-y-3">
                <div className="flex items-center gap-2.5 pb-1">
                  <div className="w-7 h-7 rounded-full bg-orange-50 text-[#FD7100] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-800">Delivery To</h3>
                </div>

                <div className="space-y-1 text-xs">
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

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
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

            {/* Card 2: Order Summary */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 space-y-3.5">
              <div className="flex items-center gap-2.5 pb-1">
                <div className="w-7 h-7 rounded-full bg-orange-50 text-[#FD7100] flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">Order Summary</h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Order ID</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-800">
                      #{order.orderId || order._id}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyOrderId}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Copy Order ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Order Date</span>
                  <span className="font-semibold text-slate-800">
                    {formatDateTime(order.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Total Items</span>
                  <span className="font-semibold text-slate-800">{totalItemCount}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Item Total</span>
                  <span className="font-mono font-semibold text-slate-800">
                    ₹{computedMRP.toLocaleString("en-IN")}
                  </span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-medium">
                    <span>Discount (Promo Code)</span>
                    <span className="font-mono font-bold">
                      - ₹{totalDiscount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Delivery Charges</span>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="line-through text-slate-400 font-mono font-normal">
                      ₹40
                    </span>
                    <span className="text-emerald-600 font-bold">FREE</span>
                  </div>
                </div>
              </div>

              {/* Total Row */}
              <div className="bg-[#FFF6F0] rounded-xl p-3.5 flex items-center justify-between border border-orange-100">
                <span className="font-bold text-slate-800 text-xs sm:text-sm">
                  {isRazorpay ? "Total Amount Paid" : "Total Amount to Pay (COD)"}
                </span>
                <span className="font-black text-xl text-[#FD7100] font-mono">
                  ₹{totalPaidAmount.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Savings Banner */}
              {totalSavings > 0 && (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl py-2 px-3 text-xs font-bold text-center">
                  🎉 You saved ₹{totalSavings.toLocaleString("en-IN")} on this order!
                </div>
              )}
            </div>

            {/* Card 3: Payment Information */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 space-y-3">
              <div className="flex items-center gap-2.5 pb-1">
                <div className="w-7 h-7 rounded-full bg-orange-50 text-[#FD7100] flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">Payment Information</h3>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      {isRazorpay ? "Online Payment (Razorpay)" : "Cash on Delivery (COD)"}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isRazorpay
                        ? "Paid securely via Cards / UPI / Netbanking"
                        : "Pay in cash at the time of delivery"}
                    </p>
                  </div>
                </div>
                <span className="font-black text-slate-900 text-base font-mono">
                  ₹{totalPaidAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Card 4: Order Details */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 space-y-3">
              <div className="flex items-center gap-2.5 pb-1">
                <div className="w-7 h-7 rounded-full bg-orange-50 text-[#FD7100] flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-800">Order Details</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Ordered On</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {formatDateTime(order.createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Order ID</span>
                  <span className="font-mono font-bold text-slate-900 block mt-0.5">
                    #{order.orderId || order._id}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 5: Download Invoice */}
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
