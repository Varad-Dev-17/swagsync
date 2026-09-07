import React, { useState, useEffect } from 'react';
import { Package, Loader2, Filter, ChevronRight, X, CheckCircle2, Truck, Clock, ShoppingBag, ShieldCheck, RefreshCw, Star } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import ReturnExchangeButton from './returnexchange/ReturnExchangeButton';
import WriteReviewModal from '../../product-details/WriteReviewModal';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getReturnEligibility } from '../../../utils/returnEligibility';

const OrdersSection = () => {
  const [orders, setOrders] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [myReviews, setMyReviews] = useState({});
  const [reviewModalState, setReviewModalState] = useState({ isOpen: false, product: null, existingReview: null });
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [activeFilterStatus, setActiveFilterStatus] = useState('all');
  const [activeFilterTime, setActiveFilterTime] = useState('anytime');

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempStatus, setTempStatus] = useState('all');
  const [tempTime, setTempTime] = useState('anytime');

  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  const fetchOrdersAndRequests = async (status, time) => {
    setIsLoading(true);
    try {
      let endpoint = `/orders/my-orders?`;
      if (status && status !== 'all' && status !== 'return_exchange') endpoint += `status=${status}&`;
      if (time && time !== 'anytime') endpoint += `time=${time}&`;

      const [ordersRes, requestsRes, reviewsRes] = await Promise.all([
        axios.get(endpoint, { headers: getAuthHeaders() }),
        axios.get('/return-requests/my-requests', { headers: getAuthHeaders() }),
        axios.get('/reviews/my/all', { headers: getAuthHeaders() }).catch(() => ({ data: { success: false } }))
      ]);

      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data.orders);
      }
      if (requestsRes.data?.success) {
        setReturnRequests(requestsRes.data.data);
      }
      if (reviewsRes.data?.success && Array.isArray(reviewsRes.data.data)) {
        const revMap = {};
        reviewsRes.data.data.forEach(rev => {
          const pId = String(rev.product?._id || rev.product || '');
          const vId = String(rev.variant?._id || rev.variant || '');
          if (vId) {
            revMap[`${pId}_${vId}`] = rev;
          } else if (pId) {
            revMap[pId] = rev;
          }
        });
        setMyReviews(revMap);
      }
    } catch (error) {
      toast.error('Failed to load orders or requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndRequests(activeFilterStatus, activeFilterTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilterStatus, activeFilterTime]);

  const applyFilters = () => {
    setActiveFilterStatus(tempStatus);
    setActiveFilterTime(tempTime);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setTempStatus('all');
    setTempTime('anytime');
    setActiveFilterStatus('all');
    setActiveFilterTime('anytime');
    setIsFilterModalOpen(false);
  };

  const openFilterModal = () => {
    setTempStatus(activeFilterStatus);
    setTempTime(activeFilterTime);
    setIsFilterModalOpen(true);
  };

  const handleCancelOrder = async (e, orderId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        const response = await axios.put(`/orders/cancel/${orderId}`, {}, {
          headers: getAuthHeaders()
        });
        if (response.data.success) {
          toast.success("Order cancelled successfully");
          fetchOrdersAndRequests(activeFilterStatus, activeFilterTime);
        }
      } catch (error) {
        toast.error("Failed to cancel order");
      }
    }
  };

  // Flatten orders into individual items for the list view
  const orderItems = [];
  orders.forEach(order => {
    order.items.forEach(item => {
      const returnRequest = returnRequests.find(req => 
        (req.order?._id || req.order) === order._id && 
        (req.product?._id || req.product) === (item.product?._id || item.product) &&
        (req.originalVariant?._id || req.originalVariant) === (item.variant?._id || item.variant)
      );

      if (activeFilterStatus === 'return_exchange' && !returnRequest) {
        return;
      }

      orderItems.push({ order, item });
    });
  });

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'on_the_way':
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-600" />;
      case 'packed':
      case 'processing':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'cancelled':
        return <X className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'text-green-600';
      case 'on_the_way':
      case 'shipped':
        return 'text-purple-600';
      case 'packed':
      case 'processing':
        return 'text-blue-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-[#d97706]';
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-700 tracking-tight">Order History & Returns</h2>
      </div>

      {/* Status Filter Tabs with Inline Filters Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 mb-6">
        <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto no-scrollbar -mb-px">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' },
            { id: 'return_exchange', label: 'Return / Exchange' }
          ].map((tab) => {
            const isActive = activeFilterStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveFilterStatus(tab.id);
                  setTempStatus(tab.id);
                }}
                className={`pb-3 px-1 text-sm sm:text-[15px] transition-all duration-200 whitespace-nowrap cursor-pointer relative ${
                  isActive 
                    ? 'text-[#FD7100] font-bold border-b-2 border-[#FD7100]' 
                    : 'text-gray-500 hover:text-slate-700 font-medium border-b-2 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={openFilterModal}
          className="flex items-center gap-1.5 px-4 py-2 mb-2 border border-gray-300 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-700 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Filter className="w-3.5 h-3.5 text-[#FD7100]" />
          <span>Filters</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-80">
          <Loader2 className="w-10 h-10 text-[#FD7100] animate-spin" />
        </div>
      ) : orderItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-gray-200 shadow-xs text-center px-4">
          <div className="w-16 h-16 bg-[#FFF5ED] flex items-center justify-center mb-5 border border-[#FD7100]/20">
            <Package className="w-8 h-8 text-[#FD7100]" />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">No Orders Found</h2>
          <p className="text-gray-500 max-w-md text-sm leading-relaxed">
            We couldn't find any orders matching your current filter selection. Try adjusting your filters to see more results.
          </p>
          <button
            onClick={clearFilters}
            className="mt-6 px-6 py-3 bg-[#FD7100] hover:bg-[#E06400] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {orderItems.map(({ order, item }, index) => {
            let color = '';
            let size = '';

            if (item.variant && item.variant.attributes) {
              item.variant.attributes.forEach(attr => {
                if (attr.attribute?.name?.toLowerCase() === 'color') {
                  color = attr.option?.displayName || color;
                }
                if (attr.attribute?.name?.toLowerCase() === 'size') {
                  size = attr.option?.displayName || size;
                }
              });
            }

            const brandName = item.product?.brand?.name;
            const statusDisplay = order.status.charAt(0).toUpperCase() + order.status.slice(1);
            
            const activeRequest = returnRequests.find(req => 
              (req.order?._id || req.order) === order._id && 
              (req.product?._id || req.product) === (item.product?._id || item.product) &&
              (req.originalVariant?._id || req.originalVariant) === (item.variant?._id || item.variant) &&
              !['rejected', 'refunded', 'exchanged'].includes(req.status)
            );
            
            const completedRequest = returnRequests.find(req => 
              (req.order?._id || req.order) === order._id && 
              (req.product?._id || req.product) === (item.product?._id || item.product) &&
              (req.originalVariant?._id || req.originalVariant) === (item.variant?._id || item.variant) &&
              ['refunded', 'exchanged'].includes(req.status)
            );
            
            const eligibility = getReturnEligibility(order, item, activeRequest);
            const deliveryDate = order.deliveredAt || order.updatedAt || order.createdAt;

            const unitPrice = Number(item?.sellingPrice ?? item?.price ?? item?.mrp ?? item?.variant?.price ?? 0) || 0;
            const itemQty = Number(item?.quantity || 1);
            const grossTotal = unitPrice * itemQty;
            const orderSubtotal = Number(order?.subtotal || 0) || (order?.totalAmount ? Number(order.totalAmount) : grossTotal);
            const shipping = Number(order?.shippingAmount || 0);
            const totalPaid = Number(order?.totalAmount || orderSubtotal);
            const actualCouponDiscount = Math.max(0, Math.round((orderSubtotal + shipping) - totalPaid));
            const proportionalDiscount = orderSubtotal > 0 && grossTotal > 0 && actualCouponDiscount > 0
              ? Math.round((grossTotal / orderSubtotal) * actualCouponDiscount) 
              : 0;
            const itemNetPaid = Math.max(0, grossTotal - proportionalDiscount);
            const itemGst = Number(item?.gstAmount || 0) * itemQty;
            const effStatus = (item.status || order.status || 'pending').toLowerCase();
            const prodId = String(item.product?._id || item.product || "");
            const varId = String(typeof item.variant === 'object' ? (item.variant?._id || '') : (item.variant || ''));
            const existingRev = varId ? (myReviews[`${prodId}_${varId}`] || null) : (myReviews[prodId] || null);

            return (
              <div
                key={`${order._id}-${index}`}
                className="bg-white border border-gray-200 overflow-hidden hover:border-gray-400 transition-all duration-300 cursor-pointer w-full shadow-xs"
                onClick={() => navigate(`/account/orders/${order._id}`)}
              >
                {/* Card Header Row: Order ID, Placed Date & Status */}
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <div>
                      <span className="font-medium text-gray-600">Order ID: </span>
                      <span className="font-bold text-[#FD7100]">#{order.orderId || order._id}</span>
                    </div>
                    <div className="text-gray-500">
                      Placed on: <span className="text-gray-700 font-medium">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Far-right Status Indicator */}
                  <div className="flex items-center gap-2 font-medium text-xs sm:text-sm">
                    {effStatus === 'delivered' ? (
                      <div className="flex items-center gap-1.5 text-green-700 font-bold">
                        <span>Delivered on: {new Date(deliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                      </div>
                    ) : effStatus === 'on_the_way' ? (
                      <div className="flex items-center gap-1.5 text-orange-700 font-bold">
                        <span>On The Way (Out for Delivery)</span>
                        <Truck className="w-4 h-4 shrink-0" />
                      </div>
                    ) : effStatus === 'shipped' ? (
                      <div className="flex items-center gap-1.5 text-orange-600 font-bold">
                        <span>Shipped</span>
                        <Truck className="w-4 h-4 shrink-0" />
                      </div>
                    ) : effStatus === 'cancelled' ? (
                      <div className="flex items-center gap-1.5 text-red-700 font-bold">
                        <span>Cancelled on: {new Date(order.updatedAt || order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <X className="w-4 h-4 shrink-0" />
                      </div>
                    ) : effStatus === 'delayed' ? (
                      <div className="flex items-center gap-1.5 text-amber-700 font-extrabold">
                        <span>⚠️ Delayed • Slight Shipping Delay</span>
                      </div>
                    ) : effStatus === 'packed' || effStatus === 'processing' ? (
                      <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                        <span>Packed</span>
                        <Package className="w-4 h-4 shrink-0" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                        <span>Order Confirmed</span>
                        <Clock className="w-4 h-4 shrink-0 animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Body: Product Info & Action Stack */}
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative">
                  {/* Left & Center: Product Image + Specs */}
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6 flex-1 min-w-0">
                    <div className="w-20 h-28 sm:w-24 sm:h-32 bg-gray-100 border border-gray-200 shrink-0 overflow-hidden relative group">
                      <img
                        src={item.variant?.mainImage?.url || item.product?.images?.[0]?.url || 'https://via.placeholder.com/150'}
                        alt={item.product?.title || 'Product'}
                        className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                       loading="lazy" decoding="async" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Status Tag Pill Badge above title */}
                      <div className="mb-2">
                        {activeRequest ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-[#FFF5ED] text-[#FD7100] border border-orange-200">
                            <RefreshCw className="w-3 h-3 animate-spin-slow text-[#FD7100]" />
                            {activeRequest.type === 'exchange' ? 'Exchange' : 'Return'} Requested
                          </span>
                        ) : completedRequest ? (
                          <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border ${
                            completedRequest.status === 'exchanged' 
                              ? 'bg-purple-50 text-purple-700 border-purple-300' 
                              : 'bg-green-50 text-green-700 border-green-300'
                          }`}>
                            {completedRequest.status === 'exchanged' ? 'Exchanged' : 'Returned & Refunded'}
                          </span>
                        ) : effStatus === 'delivered' ? (
                          <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-300">
                            Delivered
                          </span>
                        ) : effStatus === 'on_the_way' ? (
                          <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-300">
                            On The Way
                          </span>
                        ) : effStatus === 'shipped' ? (
                          <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-300">
                            Shipped
                          </span>
                        ) : effStatus === 'delayed' ? (
                          <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                            ⚠️ Delayed
                          </span>
                        ) : effStatus === 'packed' || effStatus === 'processing' ? (
                          <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-300">
                            Packed
                          </span>
                        ) : effStatus === 'pending' ? (
                          <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-300">
                            Order Confirmed
                          </span>
                        ) : null}
                      </div>

                      {brandName && (
                        <h4 className="text-[16px] font-bold text-slate-700 tracking-tight mb-0.5 truncate">
                          {brandName}
                        </h4>
                      )}
                      <p className="text-[14px] text-[#334155] mb-2.5 truncate pr-4 font-medium">
                        {item.product?.title || 'Unknown Product'}
                      </p>

                      {/* Specifications with vertical divider */}
                      <div className="text-[13px] text-gray-600 flex flex-wrap items-center gap-x-2 gap-y-1 mb-2.5 font-medium">
                        {color && (
                          <span className="flex items-center gap-2">
                            <span>Color: {color}</span>
                            <span className="text-gray-300">|</span>
                          </span>
                        )}
                        {size && (
                          <span className="flex items-center gap-2">
                            <span>Size: {size}</span>
                            <span className="text-gray-300">|</span>
                          </span>
                        )}
                        <span>Qty: {item.quantity}</span>
                      </div>

                      {/* Price Display */}
                      <div className="mt-1.5">
                        <span className="text-[16px] font-bold text-slate-700">
                          Price: ₹{itemNetPaid.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions Column - Button Stack */}
                  <div className="w-full sm:w-52 shrink-0 flex flex-col gap-2.5 justify-center border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100">
                    {(effStatus === 'pending' || effStatus === 'processing' || effStatus === 'packed') && (
                      <button
                        onClick={(e) => handleCancelOrder(e, order._id)}
                        className="w-full py-2 px-4 text-xs font-bold uppercase tracking-wider text-red-600 border border-red-300 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}

                    {effStatus === 'delivered' && !completedRequest && (
                      <>
                        <ReturnExchangeButton 
                          orderId={order._id} 
                          productId={item.product?._id || item.product} 
                          item={item}
                          eligibility={eligibility}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewModalState({
                              isOpen: true,
                              product: item.product,
                              variant: item.variant,
                              existingReview: existingRev
                            });
                          }}
                          className={`w-full flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer shadow-xs ${
                            existingRev
                              ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                              : "bg-[#FFF5ED] text-[#FD7100] border-[#FD7100]/40 hover:bg-[#FD7100] hover:text-white hover:border-[#FD7100]"
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-[#FFB800] text-[#FFB800] shrink-0" />
                          <span>
                            {existingRev ? "Reviewed (Edit)" : "Rate & Review"}
                          </span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const pId = item.product?._id || item.product;
                        if (pId && typeof pId === 'string') {
                          navigate(`/product/${pId}`);
                        } else {
                          navigate(`/account/orders/${order._id}`);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-bold uppercase tracking-wider text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#FD7100] transition-colors shrink-0" />
                      <span>Buy Again</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md overflow-hidden shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wide">Filter Orders</h3>
              <button onClick={() => setIsFilterModalOpen(false)} className="p-1 hover:bg-gray-100 transition-colors cursor-pointer">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Status Filters */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Status</h4>
                <div className="space-y-3">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'delivered', label: 'Delivered' },
                    { id: 'cancelled', label: 'Cancelled' },
                    { id: 'return_exchange', label: 'Return / Exchange' }
                  ].map((option) => (
                    <label key={option.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${tempStatus === option.id ? 'border-[#FD7100] bg-[#FD7100]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                        {tempStatus === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{option.label}</span>
                      <input
                        type="radio"
                        name="status"
                        value={option.id}
                        checked={tempStatus === option.id}
                        onChange={() => setTempStatus(option.id)}
                        className="hidden"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="h-px bg-gray-200 my-5" />

              {/* Time Filters */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Time</h4>
                <div className="space-y-3">
                  {[
                    { id: 'anytime', label: 'Anytime' },
                    { id: 'last_30_days', label: 'Last 30 days' },
                    { id: 'last_6_months', label: 'Last 6 months' },
                    { id: 'last_year', label: 'Last year' }
                  ].map((option) => (
                    <label key={option.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${tempTime === option.id ? 'border-[#FD7100] bg-[#FD7100]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                        {tempTime === option.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{option.label}</span>
                      <input
                        type="radio"
                        name="time"
                        value={option.id}
                        checked={tempTime === option.id}
                        onChange={() => setTempTime(option.id)}
                        className="hidden"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 flex gap-4 bg-gray-50">
              <button
                onClick={clearFilters}
                className="flex-1 py-3 px-4 border border-gray-300 text-xs font-bold uppercase tracking-wider text-gray-700 bg-white hover:bg-gray-100 transition-colors cursor-pointer"
              >
                CLEAR FILTERS
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 py-3 px-4 bg-[#FD7100] hover:bg-[#E06400] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
              >
                APPLY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Write / Edit Review Modal */}
      <WriteReviewModal
        isOpen={reviewModalState.isOpen}
        onClose={() => setReviewModalState({ isOpen: false, product: null, variant: null, existingReview: null })}
        product={reviewModalState.product}
        variant={reviewModalState.variant}
        existingReview={reviewModalState.existingReview}
        onSuccess={(updatedRev) => {
          const prodId = String(reviewModalState.product?._id || reviewModalState.product || "");
          const varId = String(typeof reviewModalState.variant === 'object' ? (reviewModalState.variant?._id || '') : (reviewModalState.variant || ''));
          const key = varId ? `${prodId}_${varId}` : prodId;
          if (key) {
            setMyReviews(prev => ({ ...prev, [key]: updatedRev }));
          }
        }}
      />
    </div>
  );
};

export default OrdersSection;

