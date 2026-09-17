import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { 
  CreditCard, 
  Banknote, 
  ShieldCheck, 
  Loader2, 
  ChevronRight, 
  ArrowLeft,
  ArrowRight,
  Package,
  AlertCircle
} from 'lucide-react';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const ExchangePayment = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { getAuthHeaders, user } = useAuth();

  const exchangeData = location.state;
  const [selectedMethod, setSelectedMethod] = useState('razorpay'); // 'razorpay' | 'cod'
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!exchangeData || !exchangeData.requestedVariantId) {
      toast.error('Exchange details missing. Please re-select your exchange option.');
      navigate(`/account/orders/${orderId}`);
    }
  }, [exchangeData, navigate, orderId]);

  if (!exchangeData || !exchangeData.requestedVariantId) return null;

  const {
    productId,
    orderItem,
    selectedVariant,
    quantity = 1,
    reason,
    additionalDetails,
    images = [],
    priceDifference = 0,
    totalCurrentPrice = 0,
    totalSelectedPrice = 0,
  } = exchangeData;

  const handleConfirmExchange = async () => {
    setIsProcessing(true);
    try {
      const prodId = typeof orderItem.product === 'object' ? (orderItem.product?._id || productId) : (orderItem.product || productId);
      const varId = typeof orderItem.variant === 'object' ? (orderItem.variant?._id || orderItem.variant) : orderItem.variant;

      if (selectedMethod === 'razorpay') {
        const sdkLoaded = await loadRazorpayScript();
        if (!sdkLoaded) {
          toast.error('Razorpay SDK failed to load. Please check your internet connection.');
          setIsProcessing(false);
          return;
        }

        // 1. Initialize Razorpay Order on server
        const initRes = await axios.post(
          '/return-requests/razorpay/init',
          {
            orderId,
            productId: prodId,
            requestedExchangeVariantId: selectedVariant._id,
            quantity,
          },
          { headers: getAuthHeaders() }
        );

        if (!initRes.data.success) {
          toast.error(initRes.data.message || 'Failed to initialize payment');
          setIsProcessing(false);
          return;
        }

        const { order_id, amount, currency, key_id } = initRes.data.data;

        // 2. Open Razorpay Checkout Modal
        const options = {
          key: key_id,
          amount,
          currency,
          name: 'SwagSync',
          description: `Exchange Difference Payment (Order #${orderId.slice(-6).toUpperCase()})`,
          order_id,
          handler: async function (response) {
            try {
              const payload = {
                orderId,
                productId: prodId,
                variantId: varId,
                quantity,
                type: 'exchange',
                reason,
                additionalDetails,
                images,
                requestedExchangeVariantId: selectedVariant._id,
                paymentMethod: 'razorpay',
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              };

              const createRes = await axios.post('/return-requests', payload, {
                headers: getAuthHeaders(),
              });

              if (createRes.data.success) {
                toast.success('Exchange request submitted & paid successfully!');
                navigate('/account/orders');
              }
            } catch (err) {
              console.error(err);
              toast.error(err.response?.data?.message || 'Failed to finalize exchange request');
              setIsProcessing(false);
            }
          },
          prefill: {
            name: user?.name || user?.username || '',
            email: user?.email || '',
            contact: user?.mobileNo || user?.phone || '',
          },
          theme: {
            color: '#FD7100',
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          toast.error(response.error?.description || 'Payment was unsuccessful. Please retry.');
          setIsProcessing(false);
        });
        rzp.open();
      } else {
        // Cash on Delivery (Doorstep Swap)
        const payload = {
          orderId,
          productId: prodId,
          variantId: varId,
          quantity,
          type: 'exchange',
          reason,
          additionalDetails,
          images,
          requestedExchangeVariantId: selectedVariant._id,
          paymentMethod: 'cod',
        };

        const response = await axios.post('/return-requests', payload, {
          headers: getAuthHeaders(),
        });

        if (response.data.success) {
          toast.success('Exchange request submitted! Pay difference upon doorstep delivery.');
          navigate('/account/orders');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to process exchange');
      setIsProcessing(false);
    }
  };

  const origImage = orderItem.variant?.mainImage?.url || orderItem.product?.images?.[0]?.url || '/placeholder-product.png';
  const reqImage = selectedVariant.mainImage?.url || origImage;

  return (
    <div className="bg-[#f9f9fb] min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center text-[13px] text-gray-500 mb-6 font-medium">
          <span className="hover:text-slate-700 cursor-pointer transition-colors" onClick={() => navigate('/account/orders')}>My Orders</span>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <span className="hover:text-slate-700 cursor-pointer transition-colors" onClick={() => navigate(-1)}>Return / Exchange</span>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <span className="text-slate-700 font-bold">Exchange Payment</span>
        </nav>

        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-slate-700 mb-6 transition-colors font-medium text-[13px] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Exchange Details</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Exchange Summary & Payment Options (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Exchange Item Comparison Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Exchange Summary</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                {/* Returning Item */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px] uppercase border border-rose-100">
                    Returning Item
                  </span>
                  <div className="flex items-center gap-3 pt-1">
                    <img src={origImage} alt="Original" className="w-14 h-16 object-cover rounded-lg border border-slate-200 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800 line-clamp-1">{orderItem.product?.title || 'Original Product'}</p>
                      <p className="text-slate-500 font-mono mt-0.5 font-bold">₹{totalCurrentPrice.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                {/* Replacement Item */}
                <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200/80 space-y-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase border border-emerald-100">
                    Replacement Item
                  </span>
                  <div className="flex items-center gap-3 pt-1">
                    <img src={reqImage} alt="Replacement" className="w-14 h-16 object-cover rounded-lg border border-indigo-100 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800 line-clamp-1">{orderItem.product?.title || 'Selected Product'}</p>
                      <p className="text-[#FD7100] font-mono mt-0.5 font-bold">₹{totalSelectedPrice.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Choose How to Pay the Difference</h3>
              
              <div className="space-y-3">
                {/* Option 1: Razorpay */}
                <div 
                  onClick={() => setSelectedMethod('razorpay')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    selectedMethod === 'razorpay'
                      ? 'border-[#FD7100] bg-[#FFF5ED]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-[#FD7100] flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">Pay Online via Razorpay</span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Instant
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Pay ₹{priceDifference.toLocaleString('en-IN')} instantly using UPI (GPay/PhonePe), Credit/Debit Card, or Netbanking.
                    </p>
                  </div>
                  <div className="mt-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedMethod === 'razorpay' ? 'border-[#FD7100]' : 'border-gray-300'
                    }`}>
                      {selectedMethod === 'razorpay' && <div className="w-2.5 h-2.5 rounded-full bg-[#FD7100]" />}
                    </div>
                  </div>
                </div>

                {/* Option 2: Cash on Delivery (Doorstep Swap) */}
                <div 
                  onClick={() => setSelectedMethod('cod')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                    selectedMethod === 'cod'
                      ? 'border-[#FD7100] bg-[#FFF5ED]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Banknote size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">Cash on Delivery (Doorstep Swap)</span>
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Pay on Swap
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Hand over ₹{priceDifference.toLocaleString('en-IN')} in cash or UPI directly to the delivery courier when receiving your replacement product.
                    </p>
                  </div>
                  <div className="mt-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedMethod === 'cod' ? 'border-[#FD7100]' : 'border-gray-300'
                    }`}>
                      {selectedMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-[#FD7100]" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Price Breakdown & Action (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xs space-y-4 sticky top-28">
              <h3 className="font-bold text-base text-slate-900">Payment Breakdown</h3>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Returning Item Value</span>
                  <span className="font-mono font-bold text-slate-800">₹{totalCurrentPrice.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Replacement Item Value</span>
                  <span className="font-mono font-bold text-slate-800">₹{totalSelectedPrice.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Doorstep Pickup & Swap Fee</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between font-bold text-sm text-slate-900">
                  <span>Net Payable Difference</span>
                  <span className="font-mono text-lg font-bold text-[#FD7100]">
                    ₹{priceDifference.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {selectedMethod === 'razorpay'
                    ? 'Your card/UPI will be charged the difference of ₹' + priceDifference.toLocaleString('en-IN') + ' immediately.'
                    : 'Please keep ₹' + priceDifference.toLocaleString('en-IN') + ' ready in cash or UPI for the courier upon doorstep exchange.'}
                </p>
              </div>

              <button
                onClick={handleConfirmExchange}
                disabled={isProcessing}
                className="w-full py-3.5 bg-[#FD7100] hover:bg-[#E06400] text-white font-bold text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{selectedMethod === 'razorpay' ? `Pay ₹${priceDifference.toLocaleString('en-IN')} via Razorpay` : 'Confirm Exchange Request'}</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ExchangePayment;
