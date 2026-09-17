import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Loader2, ArrowLeft, CheckCircle2, Truck, Clock, X, MapPin, Receipt, Phone, Mail, Package } from "lucide-react";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import toast from "react-hot-toast";
import CustomerTrackingCard from "./CustomerTrackingCard";
import ReturnExchangeButton from "../returnexchange/ReturnExchangeButton";
import { getReturnEligibility } from "../../../../utils/returnEligibility";

const OrderDetails = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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

  // Auto-scroll to tracking section when navigated via "Return Requested" button
  useEffect(() => {
    if (order && location.state?.scrollToTracking) {
      setTimeout(() => {
        const elem = document.getElementById("customer-order-tracking");
        if (elem) {
          elem.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [order, location.state]);

  const getStatusBannerColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-green-600";
      case "on_the_way":
      case "shipped":
        return "bg-purple-600";
      case "packed":
      case "processing":
        return "bg-blue-600";
      case "cancelled":
        return "bg-red-600";
      default:
        return "bg-amber-600";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#FD7100] animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const statusDisplayMap = {
    pending: "Order Confirmed",
    processing: "Packed",
    packed: "Packed",
    shipped: "Shipped",
    on_the_way: "Out for delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    delayed: "⚠️ Delayed • Slight Shipping Delay"
  };
  const statusDisplay = statusDisplayMap[order.status?.toLowerCase()] || (order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/_/g, " "));

  const calculateItemPaid = (item, orderData) => {
    const unitPrice = Number(item?.sellingPrice ?? item?.price ?? item?.mrp ?? item?.variant?.price ?? 0) || 0;
    const qty = Number(item?.quantity || 1);
    const grossTotal = unitPrice * qty;
    const gst = Number(item?.gstAmount || 0) * qty;
    
    const orderSubtotal = Number(orderData?.subtotal || 0) || (orderData?.items || []).reduce((acc, i) => acc + (Number(i.sellingPrice ?? i.price ?? i.mrp ?? 0) * (i.quantity || 1)), 0);
    const shipping = Number(orderData?.shippingAmount || 0);
    const weight = orderSubtotal > 0 ? (grossTotal / orderSubtotal) : 1;
    const proportionalShipping = Math.round(shipping * weight);
    
    const totalPaidByOrder = Number(orderData?.totalAmount || orderSubtotal);
    const orderTotalGst = Number(orderData?.taxAmount || 0) || (orderData?.items || []).reduce((acc, i) => acc + (Number(i.gstAmount || 0) * (i.quantity || 1)), 0);
    
    const expectedGross = orderSubtotal + orderTotalGst + shipping;
    const actualCouponDiscount = Math.max(0, Math.round(expectedGross - totalPaidByOrder));
    const proportionalDiscount = Math.round(actualCouponDiscount * weight);
    
    const netPaid = Math.max(0, grossTotal + gst + proportionalShipping - proportionalDiscount);
    
    return { unitPrice, qty, grossTotal, proportionalDiscount, proportionalShipping, netPaid, gst };
  };

  return (
    <div className="max-w-full lg:max-w-[1150px] mx-auto pt-24 sm:pt-32 pb-6 px-4 sm:px-6 md:px-8">
      <button 
        onClick={() => navigate("/account/orders")}
        className="flex items-center gap-2 text-gray-500 hover:text-slate-700 mb-6 transition-colors font-medium text-sm cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </button>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column (Items & Tracking) */}
        <div className="flex-1 w-full space-y-6">
          {/* Compact Items Table Container */}
          <div className="bg-white border border-gray-200 rounded-none overflow-hidden shadow-xs">
          <div className="bg-gray-50 px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#FD7100]" />
              Items in this Order ({order.items?.length || 0})
            </h3>
            <span className="text-xs font-semibold text-gray-500 font-mono">
              Order #{order.orderId || order._id}
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {order.items.map((item, index) => {
              let color = "";
              let size = "";
              
              if (item.variant && item.variant.attributes) {
                item.variant.attributes.forEach(attr => {
                  if (attr.attribute?.name?.toLowerCase() === "color") {
                    color = attr.option?.displayName || color;
                  }
                  if (attr.attribute?.name?.toLowerCase() === "size") {
                    size = attr.option?.displayName || size;
                  }
                });
              }

              const brandName = item.product?.brand?.name;

              // Compute Return/Exchange eligibility & active item requests
              const activeRequest = Array.isArray(order.returnRequests) ? order.returnRequests.find(req => 
                (req.product?._id || req.product) === (item.product?._id || item.product) &&
                !["rejected", "refunded", "exchanged"].includes(req.status)
              ) : null;
              const itemRequest = Array.isArray(order.returnRequests) ? order.returnRequests.find(req => 
                (req.product?._id || req.product) === (item.product?._id || item.product)
              ) : null;
              const eligibility = getReturnEligibility(order, item, activeRequest);
              const itemFin = calculateItemPaid(item, order);

              const currentItemStatus = (item.status || order.status || "pending").toLowerCase();
              const itemStatusDisplay = statusDisplayMap[currentItemStatus] || (currentItemStatus.charAt(0).toUpperCase() + currentItemStatus.slice(1).replace(/_/g, " "));
              const statusDotColor = currentItemStatus === "delayed" ? "bg-amber-500" : currentItemStatus === "cancelled" ? "bg-rose-500" : "bg-emerald-500";
              const statusTextColor = currentItemStatus === "delayed" ? "text-amber-800 font-extrabold" : currentItemStatus === "cancelled" ? "text-rose-700 font-extrabold" : "text-slate-700";

              return (
                <div key={index} className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Item Thumbnail & Specifications */}
                    <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                      <div className="w-14 h-16 sm:w-16 sm:h-20 bg-gray-100 rounded-none overflow-hidden border border-gray-200 shrink-0 shadow-2xs">
                        <img 
                          src={item.variant?.mainImage?.url || item.product?.images?.[0]?.url || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"><rect fill="%23f1f5f9" width="150" height="150"/><path fill="%23cbd5e1" d="M45 60a15 15 0 1030 0 15 15 0 00-30 0zm67 52H38a7 7 0 01-6-11l22-29a7 7 0 0111 0l10 13 15-19a7 7 0 0111 0l22 29a7 7 0 01-6 17z"/></svg>'} 
                          alt={item.product?.title || "Product"} 
                          className="w-full h-full object-cover"
                         loading="lazy" decoding="async" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {brandName && <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{brandName}</p>}
                        <h4 className="text-sm font-bold text-slate-700 truncate">{item.product?.title || "Product"}</h4>
                        <div className="text-xs text-gray-600 flex flex-wrap items-center gap-x-2 mt-1">
                          {color && <span>Color: <strong className="text-slate-700">{color}</strong></span>}
                          {color && size && <span className="text-gray-300">•</span>}
                          {size && <span>Size: <strong className="text-slate-700">{size}</strong></span>}
                          <span className="text-gray-300">•</span>
                          <span>Qty: <strong className="text-slate-700">{item.quantity}</strong></span>
                        </div>
                        {/* Status / Claim Subtext */}
                        <div className="mt-1.5 flex items-center gap-2 text-xs">
                          {itemRequest ? (
                            <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {itemRequest.type === "exchange" ? "⇄ Exchange Claim:" : "↩ Return Claim:"} {String(itemRequest.status).replace(/_/g, " ").toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-gray-600 font-medium flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${statusDotColor}`}></span>
                              Status: <strong className={statusTextColor}>{itemStatusDisplay}</strong>
                            </span>
                          )}
                        </div>
                        {(order.status === "delivered" || currentItemStatus === "delivered") && !itemRequest && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                            <span>Rate product:</span>
                            <div className="flex gap-0.5 text-amber-400 text-sm">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} className="hover:scale-125 transition-transform cursor-pointer">
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price & Actions Right Column */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 shrink-0">
                        <div className="text-sm font-extrabold text-slate-700">
                          Paid: ₹{itemFin.netPaid.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </div>

                      <div className="shrink-0">
                        <ReturnExchangeButton 
                          orderId={order._id || orderId} 
                          productId={item.product?._id || item.product} 
                          item={item}
                          eligibility={eligibility}
                          onClick={activeRequest ? () => {
                            const elem = document.getElementById("customer-order-tracking");
                            if (elem) elem.scrollIntoView({ behavior: "smooth" });
                          } : null}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dedicated Customer Lifecycle Tracking Dashboard (Phase 3 Enhancement) */}
        <CustomerTrackingCard order={order} />

        {/* Delivery Details Block */}
        </div>

        {/* Right Column (Info Blocks) */}
        <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 space-y-6">
          {order.shippingAddress && (
            <div className="bg-white border border-gray-100 rounded-none p-5 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[14px] text-slate-700">Delivery To</h3>
                <p className="text-[13px] text-gray-500 font-semibold">{order.shippingAddress.name}</p>
              </div>
            </div>
            
            <div className="pl-13 space-y-4 ml-2 border-l-2 border-gray-50">
              <div className="flex gap-3 pl-4">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[12px] text-slate-700 font-medium">Contact Details</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">{order.shippingAddress.phone}</p>
                </div>
              </div>
              <div className="flex gap-3 pl-4">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 relative">
                  <p className="text-[12px] text-slate-700 font-medium">Delivery Address</p>
                  <p className="text-[12px] text-gray-500 mt-0.5 pr-12 leading-relaxed">
                    {order.shippingAddress.address}, {order.shippingAddress.city}
                  </p>
                  <div className="absolute right-0 top-0 w-10 h-10 bg-[#FFF5ED] rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#FD7100]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Block */}
        <div className="bg-white border border-gray-100 rounded-none p-5 shadow-xs">
          <h3 className="font-bold text-[14px] text-slate-700 mb-3">Order Bill Details</h3>
          
          {(() => {
            const shipping = Number(order.shippingAmount || 0);
            const totalPaid = Number(order.totalAmount || 0);
            const subtotal = Number(order.subtotal || 0) || (order.items || []).reduce((acc, i) => acc + (Number(i.sellingPrice ?? i.price ?? i.mrp ?? 0) * (i.quantity || 1)), 0);
            const gst = Math.round(order.taxAmount || (order.items || []).reduce((acc, i) => acc + (Number(i.gstAmount || 0) * (i.quantity || 1)), 0));
            
            const actualCoupon = Math.max(0, Math.round((subtotal + gst + shipping) - totalPaid));
            const computedMRP = Number(order.totalMRP || (subtotal + Math.max(0, Number(order.discountAmount || 0) - actualCoupon))) || subtotal;
            const mrpSavings = Math.max(0, Math.round(computedMRP - subtotal));
            const totalSavings = mrpSavings + actualCoupon;
            const itemCount = order.items?.length || 0;

            return (
              <div className="space-y-3 mb-4">
                <div className="space-y-2 text-[13px] text-gray-600 font-medium pb-3 border-b border-gray-100">
                  {computedMRP > subtotal && (
                    <div className="flex justify-between text-gray-500">
                      <span>Total MRP (Gross Item Value)</span>
                      <span className="font-mono">₹{computedMRP.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {mrpSavings > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount on MRP</span>
                      <span className="font-mono">-₹{mrpSavings.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Items Selling Price ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                    <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {gst > 0 && (
                    <div className="flex justify-between text-slate-600 font-medium py-0.5">
                      <span>GST Amount</span>
                      <span className="font-mono">+₹{gst.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {actualCoupon > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Coupon Discount</span>
                      <span className="font-mono">-₹{actualCoupon.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span>Delivery & Shipping</span>
                    <span>{shipping === 0 ? <span className="text-emerald-600 font-bold">FREE (₹0)</span> : <span className="font-bold text-slate-700">₹{shipping.toLocaleString('en-IN')}</span>}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-0.5">
                  <h3 className="font-extrabold text-[15px] text-slate-700">Total Amount Paid</h3>
                  <p className="font-black text-[18px] text-[#FD7100] font-mono">₹{totalPaid.toLocaleString('en-IN')}</p>
                </div>
                {totalSavings > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold px-3 py-2 rounded-none text-center shadow-2xs mt-2">
                    🎉 You saved ₹{totalSavings.toLocaleString('en-IN')} on this order!
                  </div>
                )}
              </div>
            );
          })()}
          
          <div className="bg-gray-50 rounded-none p-3 flex items-center gap-3 text-[13px] text-gray-700 border border-gray-100 font-medium">
            <div className="bg-white px-2 py-1 rounded-none text-[10px] font-extrabold text-gray-500 border border-gray-200 uppercase tracking-wider">
              {order.paymentMethod === "cod" ? "COD" : "UPI"}
            </div>
            <span>Paid by {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-4 mb-3 font-medium">Item sold by: SwagSync Retail</p>
          <button className="w-full py-2.5 border border-gray-200 rounded-none text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
            Get Invoice
          </button>
        </div>

        {/* Updates Sent To Block */}
        <div className="bg-white border border-gray-100 rounded-none p-5 shadow-xs">
          <h3 className="font-bold text-[13px] text-slate-700 mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            Updates sent to
          </h3>
          <div className="grid grid-cols-2 gap-4 pl-6 text-[12px]">
            <div>
              <p className="text-gray-400 mb-1 font-medium">Call</p>
              <p className="font-bold text-slate-700">{order.shippingAddress?.phone || order.user?.phone || "-"}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1 font-medium">Email</p>
              <p className="font-bold text-slate-700 truncate pr-2">{order.user?.email}</p>
            </div>
          </div>
        </div>

        {/* Order Details Timestamps */}
        <div className="bg-white border border-gray-100 rounded-none p-5 shadow-xs">
          <h3 className="font-bold text-[13px] text-slate-700 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-400" />
            Order details
          </h3>
          <div className="grid grid-cols-2 gap-4 pl-6 text-[12px]">
            <div>
              <p className="text-gray-400 mb-1 font-medium">Ordered On</p>
              <p className="font-bold text-slate-700">
                {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1 font-medium">Order ID</p>
              <p className="font-mono font-bold text-slate-700 uppercase">
                #{order.orderId || order._id}
              </p>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
