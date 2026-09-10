import React, { useState } from 'react';
import { ShoppingBag, Truck, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import SectionCard from '../components/SectionCard';
import PriceRow from '../components/PriceRow';
import TimelineItem from '../components/TimelineItem';

const ProductPriceSection = ({ 
  items = [], 
  order = {}, 
  isReturnItemOnly = false, 
  returnItem = null,
  returnRequest = null,
  isReturnView = false,
  onUpdateStatus = null,
  onUpdateItemStatus = null,
  hideAuditLog = false
}) => {
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showRetainedItems, setShowRetainedItems] = useState(false);
  const [showItemBreakdown, setShowItemBreakdown] = useState(false);

  // In return/exchange view, locate specific returning item vs retained items
  const targetItem = returnRequest ? (items.find(i => 
    ((i.product?._id || i.product) === (returnRequest.product?._id || returnRequest.product)) &&
    ((i.variant?._id || i.variant) === (returnRequest.originalVariant?._id || returnRequest.originalVariant))
  ) || items.find(i => (i.product?._id || i.product) === (returnRequest.product?._id || returnRequest.product)) || returnItem) : null;

  const retainedItems = returnRequest && Array.isArray(items) ? items.filter(i => (i.product?._id || i.product) !== (targetItem?.product?._id || targetItem?.product)) : [];
  const displayItems = (isReturnView && targetItem) || (isReturnItemOnly && returnItem) ? [targetItem || returnItem] : items;
  const totalAmount = order.totalAmount || displayItems.reduce((acc, item) => acc + ((item.sellingPrice || item.price || 0) * (item.quantity || 1)), 0);

  const calculateItemFinancials = (item, orderData) => {
    const unitPrice = Number(item?.sellingPrice ?? item?.price ?? item?.mrp ?? item?.variant?.price ?? returnRequest?.originalPrice ?? 0) || 0;
    const qty = Number(item?.quantity || item?.qty || 1) || 1;
    const grossTotal = unitPrice * qty;
    
    const orderSubtotal = Number(orderData?.subtotal || 0) || (orderData?.totalAmount ? Number(orderData.totalAmount) : grossTotal);
    const shipping = Number(orderData?.shippingAmount || 0);
    const totalPaid = Number(orderData?.totalAmount || orderSubtotal);
    
    // In backend schema, orderData.discountAmount includes MRP savings ((totalMRP - subtotal) + coupon).
    // Since unitPrice here is already the sellingPrice (after MRP savings), we strictly isolate ONLY coupon discount!
    const actualCouponDiscount = Math.max(0, Math.round((orderSubtotal + shipping) - totalPaid));
    const proportionalDiscount = orderSubtotal > 0 && grossTotal > 0 && actualCouponDiscount > 0
      ? Math.round((grossTotal / orderSubtotal) * actualCouponDiscount) 
      : 0;
      
    const netPaid = Math.max(0, grossTotal - proportionalDiscount);
    return { unitPrice, qty, grossTotal, proportionalDiscount, netPaid, gstAmount: Number(item?.gstAmount || 0) * qty };
  };

  // Timeline & Audit Log calculations
  const status = (order.status || "pending").toLowerCase();
  const isCancelled = status === "cancelled";

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return String(dateString);
    }
  };

  const stepsOrder = ["pending", "packed", "shipped", "on_the_way", "delivered"];
  const normalizedStatus = status === "processing" ? "packed" : status;
  const currentIndex = stepsOrder.indexOf(normalizedStatus);

  const milestoneSteps = [
    {
      title: "Order Confirmed",
      date: formatDate(order.createdAt),
      subtitle: "Verified & approved.",
      isCompleted: !isCancelled && (currentIndex >= 0 || status === "delivered"),
      isCurrent: status === "pending",
      actionValue: "pending",
    },
    {
      title: "Packed",
      date: currentIndex >= 1 ? formatDate(order.updatedAt) : "",
      subtitle: "Inspected & ready.",
      isCompleted: !isCancelled && currentIndex >= 1,
      isCurrent: status === "packed" || status === "processing",
      actionValue: "packed",
    },
    {
      title: "Shipped",
      date: currentIndex >= 2 ? formatDate(order.updatedAt) : "",
      subtitle: order.trackingNumber ? `AWB: ${order.trackingNumber}` : "Handed over.",
      isCompleted: !isCancelled && currentIndex >= 2,
      isCurrent: status === "shipped",
      actionValue: "shipped",
    },
    {
      title: "On The Way",
      date: currentIndex >= 3 ? formatDate(order.updatedAt) : "",
      subtitle: "Out for delivery.",
      isCompleted: !isCancelled && currentIndex >= 3,
      isCurrent: status === "on_the_way",
      actionValue: "on_the_way",
    },
    {
      title: "Delivered",
      date: formatDate(order.deliveredAt || (status === "delivered" ? order.updatedAt : null)),
      subtitle: "Delivered to recipient.",
      isCompleted: !isCancelled && status === "delivered",
      isCurrent: status === "delivered",
      actionValue: "delivered",
    },
  ];

  if (isCancelled) {
    milestoneSteps.push({
      title: "Cancelled",
      date: formatDate(order.updatedAt),
      subtitle: "Order cancelled.",
      isCurrent: true,
      isError: true,
    });
  }

  const orderEvents = Array.isArray(order.timeline) ? order.timeline : [];
  const returnEvents = returnRequest && Array.isArray(returnRequest.timeline) ? returnRequest.timeline : [];
  const combinedEvents = [...orderEvents, ...returnEvents].sort((a, b) => {
    return new Date(a.timestamp || 0) - new Date(b.timestamp || 0);
  });

  const auditSteps = combinedEvents.map((ev, i) => ({
    eventId: ev.eventId || `audit-${i}`,
    title: ev.type || "System Event",
    date: formatDate(ev.timestamp),
    subtitle: ev.description || "",
    performedBy: ev.performedBy || ev.createdBy || "System",
    isCompleted: true,
  }));

  return (
    <SectionCard icon={ShoppingBag} title={isReturnView || isReturnItemOnly ? "Returned Item & Order Fulfillment Tracking" : "Ordered Items & Order Tracking"} className="">
      <div className="space-y-5">
        
        {/* Top Section: Compact Horizontal Order Tracking Strip (Zero vertical whitespace) */}
        <div className="w-full pb-2 border-b border-slate-100">
          <TimelineItem
            steps={milestoneSteps}
            currentStatus={status}
            isCancelled={isCancelled}
            onStepClick={(val) => {
              if (!isCancelled && onUpdateStatus && val !== status && !isReturnView) {
                onUpdateStatus(val);
              }
            }}
          />
        </div>

        {/* Side-by-Side Widescreen Architecture: Items List (Left) & Bill Summary (Right) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Left Side: Product Items (Spans 7 of 12 columns) */}
          <div className="xl:col-span-7 divide-y divide-gray-100 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar space-y-3 xl:border-r border-gray-200 xl:pr-5">
            {displayItems.map((item, index) => {
              const product = item.product || item;
              const variant = item.variant || item.originalVariant || {};
              const title = product.title || product.name || "Product";
              const brand = product.brand?.name || (typeof product.brand === "string" ? product.brand : null) || item.brand?.name || (typeof item.brand === "string" ? item.brand : null) || "";
              const img = variant.mainImage?.url || (typeof variant.mainImage === "string" ? variant.mainImage : null) || product.images?.[0]?.url || (typeof product.images?.[0] === "string" ? product.images[0] : null) || null;
              const fin = calculateItemFinancials(item, order);

              let color = "";
              let size = "";
              if (Array.isArray(variant.attributes) && variant.attributes.length > 0) {
                variant.attributes.forEach((attr) => {
                  const attrName = attr.attribute?.name?.toLowerCase() || "";
                  const optValue = attr.option?.displayName || attr.option?.storedValue || attr.option?.value || attr.value || "";
                  if (attrName.includes("color") && optValue) color = optValue;
                  if (attrName.includes("size") && optValue) size = optValue;
                });
              }
              if (!color) color = item.color || variant.color || "";
              if (!size) size = item.size || variant.size || "";

              return (
                <div key={index} className="flex items-start gap-3.5 pt-3 first:pt-0">
                  <div className="w-16 h-20 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 shadow-2xs flex items-center justify-center">
                    {img ? (
                      <img src={img} alt={title} className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                    ) : (
                      <ShoppingBag size={20} className="text-gray-300" />
                    )}
                  </div>

                  <div className="grow flex flex-col justify-between min-h-[5rem]">
                    <div>
                      {brand && (
                        <span className="block text-xs font-semibold text-[#4F46E5] mb-0.5">
                          {brand}
                        </span>
                      )}
                      <h5 className="font-bold text-slate-700 text-sm hover:text-[#4F46E5] transition-colors line-clamp-1">
                        {title}
                      </h5>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600 font-medium mt-1.5">
                      {color && (
                        <span className="bg-indigo-50/60 text-[#4F46E5] px-2 py-0.5 rounded-md border border-indigo-100/70 text-[11px] font-semibold">
                          Color: <strong className="font-bold text-indigo-900">{color}</strong>
                        </span>
                      )}
                      {size && (
                        <span className="bg-purple-50/60 text-purple-700 px-2 py-0.5 rounded-md border border-purple-100/70 text-[11px] font-semibold">
                          Size: <strong className="font-bold text-purple-900">{size}</strong>
                        </span>
                      )}
                      <span className="bg-gray-100/70 text-gray-700 px-2 py-0.5 rounded-md text-[11px] font-bold border border-gray-200/60">
                        Qty: {fin.qty}
                      </span>
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[11px] font-bold border border-slate-200/80">
                        Price: <strong className="font-mono text-slate-900">₹{fin.unitPrice.toLocaleString("en-IN")}</strong>
                      </span>
                      {returnRequest && items.length > 1 && (
                        <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md text-[11px] font-bold border border-amber-200/70">
                          Item 1 of {items.length} in Order
                        </span>
                      )}
                      {!isReturnView && onUpdateItemStatus && (
                        <div className="w-full flex items-center justify-between bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1.5 mt-1.5 shadow-2xs">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#4F46E5]"></span>
                            Item Status:
                          </span>
                          <select
                            value={item.status || order.status || "pending"}
                            onChange={(e) => {
                              if (onUpdateItemStatus) {
                                onUpdateItemStatus(item._id || index, e.target.value);
                              }
                            }}
                            className="text-xs font-extrabold bg-white border border-slate-300 text-slate-800 rounded-md px-2.5 py-1 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs transition-colors hover:border-slate-400"
                          >
                            <option value="pending">1. Order Confirmed</option>
                            <option value="packed">2. Packed</option>
                            <option value="shipped">3. Shipped</option>
                            <option value="on_the_way">4. On The Way</option>
                            <option value="delivered">5. Delivered</option>
                            <option value="delayed">⚠️ Delayed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Side: Financial Accounting & Bill Details Box (Spans 5 of 12 columns, tight next to items) */}
          <div className="xl:col-span-5 w-full">
            {returnRequest || (isReturnView && targetItem) ? (
              <div className="bg-gray-50/90 p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Return / Exchange Details</span>
                  <span className="text-xs font-mono font-extrabold text-[#4648d4]">Order #{order.orderId || order._id || "Ref"}</span>
                </div>
                {(() => {
                  const f = calculateItemFinancials(targetItem || returnItem || displayItems[0], order);
                  return (
                    <div className="space-y-1.5 pt-1 text-xs font-medium text-slate-600">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Item Price ({f.qty} {f.qty === 1 ? 'unit' : 'units'})</span>
                        <span className="font-mono">₹{f.grossTotal.toLocaleString("en-IN")}</span>
                      </div>
                      {f.proportionalDiscount > 0 && (
                        <div className="flex justify-between text-rose-600 font-medium">
                          <span>Coupon Discount</span>
                          <span className="font-mono">-₹{f.proportionalDiscount.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Delivery Fee</span>
                        <span className="font-semibold text-slate-700">{order.shippingAmount > 0 ? `₹${order.shippingAmount} (Non-refundable)` : 'FREE Delivery (₹0)'}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-slate-800 text-sm">
                        <span>Total Refund Amount</span>
                        <span className="text-[#4F46E5] font-extrabold font-mono">₹{f.netPaid.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              displayItems.length > 0 && (() => {
                const shipping = Number(order.shippingAmount || 0);
                const computedGrandTotal = displayItems.reduce((acc, item) => {
                  const fin = calculateItemFinancials(item, order);
                  return acc + (Number(fin.grossTotal) || 0) + (Number(fin.gstAmount) || 0);
                }, 0) + shipping;
                
                const totalGrossTotal = displayItems.reduce((acc, item) => acc + (Number(calculateItemFinancials(item, order).grossTotal) || 0), 0);
                const totalGST = displayItems.reduce((acc, item) => acc + (Number(calculateItemFinancials(item, order).gstAmount) || 0), 0);

                return (
                  <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3.5">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Order Payment Details</span>
                    </div>
                    
                    <div className="space-y-2.5 pt-0.5 text-xs font-medium text-slate-600">
                      <div className="flex justify-between items-center text-slate-700">
                        <span className="font-semibold">Items ({displayItems.length})</span>
                        <span className="font-mono font-bold text-slate-800">₹{totalGrossTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex justify-between items-center text-slate-700">
                        <span className="font-semibold">Delivery Fee</span>
                        <span className="font-bold text-[#4F46E5]">{shipping > 0 ? `₹${shipping.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : 'FREE (₹0)'}</span>
                      </div>
                      
                      {totalGST > 0 && (
                        <>
                          <div className="pt-2 mt-2 border-t border-gray-100 border-dashed"></div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span className="font-semibold">Tax (Total GST)</span>
                            <span className="font-mono font-semibold text-amber-700">₹{totalGST.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                          </div>
                        </>
                      )}

                      <div className="pt-3 mt-2 border-t border-gray-200 flex flex-col gap-2">
                        <div className="flex justify-between items-center font-bold text-slate-900 text-sm">
                          <span>Total Amount Paid</span>
                          <span className="text-emerald-700 font-black text-base font-mono">₹{Number(computedGrandTotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Paid • {formatDate(order.createdAt)} • {order.paymentMethod?.toUpperCase() || 'ONLINE'}
                        </div>
                      </div>

                      {/* Expandable Breakdown */}
                      {displayItems.length > 1 && (
                        <div className="pt-2 mt-2 border-t border-gray-100">
                          <button
                            onClick={() => setShowItemBreakdown(!showItemBreakdown)}
                            className="w-full flex items-center justify-between text-[11px] font-bold text-[#4F46E5] hover:text-indigo-700 transition-colors cursor-pointer"
                          >
                            <span>View item price breakdown ({displayItems.length} items)</span>
                            {showItemBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          
                          {showItemBreakdown && (
                            <div className="mt-3 space-y-2 pl-2 border-l-2 border-indigo-100">
                              {displayItems.map((item, i) => {
                                const fin = calculateItemFinancials(item, order);
                                const itemGst = Number(fin.gstAmount || 0);
                                return (
                                  <div key={`breakdown-${i}`} className="space-y-1">
                                    <div className="flex justify-between items-center text-slate-600 text-[11px]">
                                      <span>Item {i + 1} Price</span>
                                      <span className="font-mono font-medium">₹{Number(fin.grossTotal).toLocaleString('en-IN')}</span>
                                    </div>
                                    {itemGst > 0 && (
                                      <div className="flex justify-between items-center text-slate-500 text-[10px]">
                                        <span>Item {i + 1} GST</span>
                                        <span className="font-mono">₹{itemGst.toLocaleString('en-IN')}</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>

        {/* Retained Items Accordion for Multi-Item Orders */}
        {returnRequest && retainedItems.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowRetainedItems(!showRetainedItems)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                <span>Other Items in Original Order ({retainedItems.length} retained by customer)</span>
              </div>
              {showRetainedItems ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showRetainedItems && (
              <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar pl-3 pt-3 bg-slate-50 rounded-xl p-3 border border-slate-200 mt-2 divide-y divide-slate-200 space-y-2">
                {retainedItems.map((ritem, rIdx) => {
                  const rprod = ritem.product || ritem;
                  const rtitle = rprod.title || rprod.name || "Product";
                  const rimg = ritem.variant?.mainImage?.url || rprod.images?.[0]?.url || null;
                  const rqty = ritem.quantity || 1;
                  const rfin = calculateItemFinancials(ritem, order);
                  return (
                    <div key={rIdx} className="flex items-center justify-between text-xs pt-2 first:pt-0 text-slate-700">
                      <div className="flex items-center gap-2.5">
                        {rimg && <img src={rimg} alt="retained" className="w-10 h-12 rounded object-cover border border-slate-200 shadow-2xs"  loading="lazy" decoding="async" />}
                        <div>
                          <p className="font-bold">{rtitle}</p>
                          <p className="text-[11px] text-slate-500">Qty: {rqty} • Retained (No active claim)</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-600">₹{rfin.netPaid.toLocaleString("en-IN")}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Activity History Log Section */}
        {!hideAuditLog && auditSteps.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={() => setShowAuditLog(!showAuditLog)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-gray-200/70 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-[#4F46E5] stroke-[2.25]" />
                <span>Activity History ({auditSteps.length} updates recorded)</span>
              </div>
              {showAuditLog ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showAuditLog && (
              <div className="max-h-[220px] overflow-y-auto pr-2 custom-scrollbar pl-1 pt-2 bg-slate-50/50 rounded-xl p-3 border border-gray-100 mt-2">
                <TimelineItem steps={auditSteps} isAuditLog={true} />
              </div>
            )}
          </div>
        )}

      </div>
    </SectionCard>
  );
};

export default ProductPriceSection;
