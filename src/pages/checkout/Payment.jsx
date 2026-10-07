import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, Loader2, ShieldCheck, Tag, Check, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import CheckoutTracker from '../../components/bag/CheckoutTracker';
import { calculateBagTotals } from '../../utils/BagUtils';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Payment = () => {
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  const { updateCartCount, refreshCart } = useCart();
  
  const [selectedMethod, setSelectedMethod] = useState('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Applied Coupon state from Bag
  const [appliedCoupon] = useState(() => {
    try {
      const saved = sessionStorage.getItem("swagsync_applied_coupon");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [couponDiscount] = useState(() => {
    try {
      const saved = sessionStorage.getItem("swagsync_coupon_discount");
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  const [cartItems, setCartItems] = useState([]);
  const [cartTotals, setCartTotals] = useState(null);
  
  useEffect(() => {
    const fetchAddressAndCart = async () => {
      const addressId = localStorage.getItem('checkout_address_id');
      if (!addressId) {
        toast.error('Please select an address first');
        navigate('/checkout/address');
        return;
      }
      
      try {
        const [addrRes, cartRes] = await Promise.all([
          axios.get('/addresses', { headers: getAuthHeaders() }),
          axios.get('/cart', { headers: getAuthHeaders() }).catch(() => null),
        ]);

        if (addrRes.data.success) {
          const address = addrRes.data.addresses.find(a => a._id === addressId);
          if (address) {
            setSelectedAddress(address);
          } else {
            toast.error('Selected address not found');
            navigate('/checkout/address');
            return;
          }
        }

        if (cartRes?.data?.success && Array.isArray(cartRes.data.data?.items)) {
          const items = cartRes.data.data.items;
          setCartItems(items);
          const computed = calculateBagTotals(items, couponDiscount);
          setCartTotals(computed);
        }
      } catch (error) {
        toast.error('Failed to load checkout details');
      }
    };
    
    fetchAddressAndCart();
  }, [getAuthHeaders, navigate, couponDiscount]);

  const paymentMethods = [
    {
      id: 'cod',
      title: 'Cash on Delivery',
      description: 'Pay in cash when your order is delivered to your doorstep.',
      icon: <Banknote size={24} className="text-[#FD7100]" />
    },
    {
      id: 'razorpay',
      title: 'Pay with Razorpay',
      description: 'Pay securely using UPI, cards, net banking, and other Razorpay payment options.',
      icon: <ShieldCheck size={24} className="text-[#FD7100]" />
    }
  ];

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleConfirmOrder = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }
    
    if (!selectedAddress) {
      toast.error('Address details missing');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const shippingAddress = {
        name: selectedAddress.fullName,
        address: `${selectedAddress.addressLine1} ${selectedAddress.addressLine2 || ''}`.trim(),
        city: selectedAddress.city,
        phone: selectedAddress.phone
      };

      const couponCode = appliedCoupon?.code || undefined;

      if (selectedMethod === 'razorpay') {
        const res = await loadRazorpayScript();
        if (!res) {
          toast.error('Razorpay SDK failed to load. Are you online?');
          setIsProcessing(false);
          return;
        }

        const payload = { 
          shippingAddress,
          couponCode
        };
        const initResponse = await axios.post('/orders/razorpay/init', payload, { headers: getAuthHeaders() });
        
        if (initResponse.data.success) {
          const { order_id, amount, currency, key_id } = initResponse.data.data;
          
          const options = {
            key: key_id,
            amount: amount,
            currency: currency,
            name: "SwagSync",
            description: "Secure Payment",
            order_id: order_id,
            handler: async function (response) {
              try {
                const verifyPayload = {
                  shippingAddress,
                  couponCode,
                  paymentMethod: 'razorpay',
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature
                };
                
                const verifyRes = await axios.post('/orders', verifyPayload, { headers: getAuthHeaders() });
                if (verifyRes.data.success) {
                  toast.success('Order placed successfully!');
                  sessionStorage.removeItem("swagsync_applied_coupon");
                  sessionStorage.removeItem("swagsync_coupon_discount");
                  localStorage.removeItem('checkout_address_id');
                  updateCartCount(0);
                  refreshCart();
                  const newOrderId = verifyRes.data.data?._id;
                  navigate(newOrderId ? `/account/orders/${newOrderId}` : '/account/orders');
                }
              } catch (err) {
                toast.error(err.response?.data?.message || 'Payment verification failed');
                setIsProcessing(false);
              }
            },
            prefill: {
              name: selectedAddress.fullName,
              contact: selectedAddress.phone
            },
            theme: {
              color: "#FD7100"
            },
            modal: {
              ondismiss: function() {
                setIsProcessing(false);
              }
            }
          };
          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (response){
            toast.error(response.error.description || 'Payment failed');
            setIsProcessing(false);
          });
          rzp.open();
        }
      } else {
        const payload = {
          shippingAddress,
          couponCode,
          paymentMethod: selectedMethod
        };

        const response = await axios.post('/orders', payload, { headers: getAuthHeaders() });
        
        if (response.data.success) {
          toast.success('Order placed successfully!');
          sessionStorage.removeItem("swagsync_applied_coupon");
          sessionStorage.removeItem("swagsync_coupon_discount");
          localStorage.removeItem('checkout_address_id');
          
          // Clear cart globally
          updateCartCount(0);
          refreshCart();
          
          const newOrderId = response.data.data?._id;
          navigate(newOrderId ? `/account/orders/${newOrderId}` : '/account/orders');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process order');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9fb] pt-[76px] sm:pt-[82px] pb-12 sm:pb-24">
      <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto max-w-[1360px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 mt-0 items-start">
          {/* Main Content Area */}
          <div className="flex-grow lg:flex-1 min-w-0 space-y-4 w-full">
            <div className="pb-1">
              <CheckoutTracker currentStep="payment" />
            </div>

            <h2 className="text-2xl font-bold text-[#111827] mb-6">How would you like to pay?</h2>
            
            <div className="bg-white rounded-xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`flex items-start gap-4 p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedMethod === method.id ? 'bg-[#EEF2FF]/50' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mt-1">
                      {method.icon}
                    </div>
                    
                    <div className="flex-grow pt-1">
                      <h4 className="text-[16px] font-bold text-[#111827] mb-1">
                        {method.title}
                      </h4>
                      <p className="text-[13px] text-[#535766] max-w-md leading-relaxed">
                        {method.description}
                      </p>
                    </div>

                    <div className="flex-shrink-0 pt-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedMethod === method.id 
                          ? 'border-[#03a685]' 
                          : 'border-gray-300'
                      }`}>
                        {selectedMethod === method.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#03a685]"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (Price Summary & Confirm Button Block) */}
          <div className="w-full lg:w-[440px] xl:w-[460px] shrink-0 lg:sticky lg:top-[76px] sm:lg:top-[82px] lg:self-start">
             <div className="bg-white rounded-2xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[#FD7100] to-[#E06400] px-6 py-4 flex justify-between items-center text-white">
                  <h3 className="font-bold text-[16px]">Payment & Price Summary</h3>
                  <div className="flex items-center gap-1 text-xs opacity-90 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    <span>100% Secure</span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {cartTotals && (
                    <div className="space-y-3 pb-4 border-b border-gray-100 text-[13.5px]">
                      <div className="flex justify-between items-center text-[#282c3f]">
                        <span className="text-slate-500 font-medium">Item Total (MRP)</span>
                        <span className="font-semibold text-slate-800">{formatPrice(cartTotals.totalMRP)}</span>
                      </div>

                      {cartTotals.discountOnMRP - cartTotals.couponDiscount > 0 && (
                        <div className="flex justify-between items-center text-[#03a685] font-medium">
                          <span>Discount on MRP</span>
                          <span className="font-semibold">
                            - {formatPrice(cartTotals.discountOnMRP - cartTotals.couponDiscount)}
                          </span>
                        </div>
                      )}

                      {appliedCoupon && couponDiscount > 0 && (
                        <div className="flex justify-between items-center text-[#03a685] font-medium bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                          <span className="inline-flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            <span>Coupon Discount</span>
                            <span className="bg-emerald-200/70 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                              {appliedCoupon.code}
                            </span>
                          </span>
                          <span className="font-bold">
                            - {formatPrice(couponDiscount)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[#282c3f]">
                        <span className="text-slate-500 font-medium">Delivery Charges</span>
                        <span className="font-semibold">
                          {cartTotals.shipping === 0 ? (
                            <span className="text-[#03a685]">FREE</span>
                          ) : (
                            formatPrice(cartTotals.shipping)
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[#282c3f]">
                        <div>
                          <span className="text-slate-500 font-medium">Estimated GST</span>
                          <span className="text-[11px] text-emerald-600 block">
                            Included in item price
                          </span>
                        </div>
                        <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          Included ({formatPrice(cartTotals.totalTax)})
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                        <span className="font-bold text-slate-900 text-sm">
                          {selectedMethod === 'razorpay' ? 'Total Amount (Online)' : 'Total Amount to Pay (COD)'}
                        </span>
                        <span className="font-extrabold text-lg text-[#FD7100] font-mono">
                          {formatPrice(cartTotals.grandTotal)}
                        </span>
                      </div>

                      {cartTotals.discountOnMRP > 0 && (
                        <div className="bg-[#E6F6F1] text-[#03a685] text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 justify-center">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>You are saving {formatPrice(cartTotals.discountOnMRP)} on this order!</span>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-[#535766] text-xs">
                    {selectedMethod === 'razorpay' ? (
                      <>You are selecting <strong>Razorpay</strong> for online payment.</>
                    ) : (
                      <>You are selecting <strong>{paymentMethods.find(m => m.id === selectedMethod)?.title}</strong> for this order.</>
                    )}
                  </p>

                  <button 
                    onClick={handleConfirmOrder}
                    disabled={isProcessing}
                    className={`w-full text-white font-bold text-[14px] py-3.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                      isProcessing ? 'bg-[#E06400] opacity-70 cursor-not-allowed' : 'bg-[#FD7100] hover:bg-[#E06400]'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing Order...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>{selectedMethod === 'razorpay' ? 'Pay with Razorpay' : 'Confirm Order'}</span>
                      </>
                    )}
                  </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
