import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { Loader2, ChevronRight, ArrowLeft } from 'lucide-react';
import ProductInfo from './ReturnExchangeForm/ProductInfo';
import ActionSelector from './ReturnExchangeForm/ActionSelector';
import ReasonDropdown from './ReturnExchangeForm/ReasonDropdown';
import ImageUploadPlaceholder from './ReturnExchangeForm/ImageUploadPlaceholder';
import ExchangeSection from './ReturnExchangeForm/ExchangeSection';

const ReturnExchangeRequest = () => {
  const { orderId, productId } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [orderItem, setOrderItem] = useState(location.state?.orderItem || null);
  const [selectedQty, setSelectedQty] = useState(location.state?.orderItem?.quantity || 1);
  
  const [action, setAction] = useState('return'); // 'return' or 'exchange'
  const [reason, setReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [requestedVariantId, setRequestedVariantId] = useState('');
  const [productVariants, setProductVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await axios.get(`/orders/${orderId}`, {
          headers: getAuthHeaders(),
        });
        if (response.data.success) {
          const fetchedOrder = response.data.data;
          setOrder(fetchedOrder);
          
          // Find the specific product in the order
          const item = fetchedOrder.items.find(i => {
            const pId = typeof i.product === 'object' ? i.product?._id : i.product;
            return String(pId) === String(productId) || String(i._id) === String(productId);
          });
          
          if (item) {
            if (item.product?.slug) {
              try {
                const prodRes = await axios.get(`/products/slug/${item.product.slug}`);
                if (prodRes.data.success && prodRes.data.data.product?.variants) {
                  setProductVariants(prodRes.data.data.product.variants);
                  
                  // Ensure current item variant is populated
                  const currentVariantId = typeof item.variant === 'object' ? item.variant?._id : item.variant;
                  const populatedVariant = prodRes.data.data.product.variants.find(v => String(v._id) === String(currentVariantId));
                  
                  if (populatedVariant) {
                    item.variant = populatedVariant;
                  }
                }
              } catch (e) {
                console.error('Failed to fetch populated product variants', e);
              }
            }
            
            setOrderItem(item);
            setSelectedQty(item.quantity || 1);
          } else {
              toast.error('Product not found in this order');
              navigate(-1);
            }
        }
      } catch (error) {
        toast.error('Failed to load order details');
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId && productId) {
      fetchOrderDetails();
    }
  }, [orderId, productId, getAuthHeaders, navigate]);

  const selectedVariant = productVariants?.find(v => String(v._id) === String(requestedVariantId));
  const currentItemPrice = Number(orderItem?.sellingPrice ?? orderItem?.price ?? orderItem?.mrp ?? orderItem?.variant?.price ?? orderItem?.product?.sellingPrice ?? orderItem?.product?.price ?? 0) || 0;
  const currentVariantPrice = Number(currentItemPrice) || 0;
  const selectedVariantPrice = Number(selectedVariant?.price ?? 0) || 0;
  const qty = Number(selectedQty) || 1;
  const totalCurrentPrice = currentVariantPrice * qty;
  const totalSelectedPrice = selectedVariantPrice * qty;
  const priceDifference = action === 'exchange' && selectedVariant ? totalSelectedPrice - totalCurrentPrice : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }
    if (action === 'exchange' && !requestedVariantId) {
      toast.error('Please select an exchange variant');
      return;
    }
    
    const prodId = typeof orderItem.product === 'object' ? (orderItem.product?._id || productId) : (orderItem.product || productId);
    const varId = typeof orderItem.variant === 'object' ? (orderItem.variant?._id || orderItem.variant) : orderItem.variant;

    // If exchange requires additional payment, redirect to Exchange Payment screen
    if (action === 'exchange' && priceDifference > 0) {
      navigate(`/account/orders/${order._id}/exchange-payment`, {
        state: {
          orderId: order._id,
          productId: prodId,
          orderItem,
          selectedVariant,
          requestedVariantId,
          quantity: selectedQty || 1,
          reason,
          additionalDetails,
          images,
          priceDifference,
          totalCurrentPrice,
          totalSelectedPrice,
        }
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        orderId: order._id,
        productId: prodId,
        variantId: varId,
        quantity: selectedQty || 1,
        type: action,
        reason,
        additionalDetails,
        images,
      };

      if (action === 'exchange') {
        payload.requestedExchangeVariantId = requestedVariantId; 
      }

      const response = await axios.post('/return-requests', payload, {
        headers: getAuthHeaders(),
      });

      if (response.data.success) {
        toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} request submitted successfully`);
        navigate('/account/orders');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#FD7100] animate-spin" />
      </div>
    );
  }

  if (!orderItem) return null;

  return (
    <div className="bg-white min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center text-[13px] text-gray-500 mb-6 font-medium">
          <span className="hover:text-slate-700 cursor-pointer transition-colors" onClick={() => navigate('/account/profile')}>My Account</span>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <span className="hover:text-slate-700 cursor-pointer transition-colors" onClick={() => navigate('/account/orders')}>My Orders</span>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <span className="text-slate-700">Return / Exchange</span>
        </nav>

        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-slate-700 mb-6 transition-colors font-medium text-[13px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Order
        </button>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-700 tracking-tight">Request Return or Exchange</h1>
          <p className="text-[14px] text-gray-500 mt-2">Order #{order.orderId || order._id.toString().slice(-8)}</p>
        </div>

        {/* Product Info Section */}
        <div className="mb-10 border-t border-b border-gray-100 py-8">
          {(() => {
            let color = '';
            let size = '';
            
            if (orderItem.variant && orderItem.variant.attributes) {
              orderItem.variant.attributes.forEach(attr => {
                const name = attr.attribute?.name?.toLowerCase();
                if (name === 'color' || name === 'colour' || name === 'color / shade' || name === 'shade' || attr.attribute?.fieldType === 'color') {
                  color = attr.option?.displayName || attr.option?.storedValue || color;
                }
                if (name === 'size' || name === 'size / net quantity') {
                  size = attr.option?.displayName || attr.option?.storedValue || size;
                }
              });
            }

            const itemPrice = Number(orderItem.sellingPrice ?? orderItem.price ?? orderItem.mrp ?? orderItem.variant?.price ?? orderItem.product?.sellingPrice ?? orderItem.product?.price ?? 0) || 0;

            return (
              <ProductInfo 
                product={orderItem.product} 
                variant={orderItem.variant} 
                quantity={orderItem.quantity} 
                selectedQty={selectedQty}
                onQtyChange={setSelectedQty}
                price={itemPrice}
                color={color}
                size={size}
                attributes={orderItem.variant?.attributes || []}
              />
            );
          })()}
        </div>
          
        {/* Main Form Area */}
        <form onSubmit={handleSubmit} className="space-y-10">
          <ActionSelector action={action} setAction={setAction} />
          
          {action === 'exchange' && (
            <ExchangeSection 
              requestedVariantId={requestedVariantId} 
              setRequestedVariantId={setRequestedVariantId} 
              productVariants={productVariants}
              currentVariantId={orderItem.variant?._id || orderItem.variant} 
              selectedQty={selectedQty || 1}
              currentPrice={Number(orderItem.sellingPrice ?? orderItem.price ?? orderItem.mrp ?? orderItem.variant?.price ?? orderItem.product?.sellingPrice ?? orderItem.product?.price ?? 0) || 0}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="col-span-1">
               <ReasonDropdown reason={reason} setReason={setReason} />
             </div>
          </div>

          <div>
            <label className="block text-[14px] font-bold text-slate-700 mb-3">Additional Details</label>
            <textarea
              rows="4"
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="Please provide any additional details about your request..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[14px] text-slate-700 focus:outline-none focus:border-[#FD7100] focus:ring-1 focus:ring-[#FD7100] placeholder-gray-400 resize-none transition-colors"
            ></textarea>
          </div>
          
          <div>
            <ImageUploadPlaceholder images={images} setImages={setImages} />
          </div>

          <div className="pt-8 mt-8 border-t border-gray-100 flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 bg-[#FD7100] text-white rounded-lg text-[14px] font-bold hover:bg-[#E06400] transition-colors shadow-sm flex items-center justify-center min-w-[160px] cursor-pointer ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : action === 'exchange' && priceDifference > 0 ? (
                `Proceed to Pay Difference (₹${priceDifference.toLocaleString('en-IN')}) →`
              ) : (
                'Submit Request'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-8 py-3 bg-white border border-gray-300 rounded-lg text-[14px] font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnExchangeRequest;
