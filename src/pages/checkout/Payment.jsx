import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import CheckoutTracker from '../../components/bag/CheckoutTracker';

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
  
  useEffect(() => {
    const fetchAddress = async () => {
      const addressId = localStorage.getItem('checkout_address_id');
      if (!addressId) {
        toast.error('Please select an address first');
        navigate('/checkout/address');
        return;
      }
      
      try {
        const response = await axios.get('/addresses', { headers: getAuthHeaders() });
        if (response.data.success) {
          const address = response.data.addresses.find(a => a._id === addressId);
          if (address) {
            setSelectedAddress(address);
          } else {
            toast.error('Selected address not found');
            navigate('/checkout/address');
          }
        }
      } catch (error) {
        toast.error('Failed to load address details');
      }
    };
    
    fetchAddress();
  }, [getAuthHeaders, navigate]);

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

      if (selectedMethod === 'razorpay') {
        const res = await loadRazorpayScript();
        if (!res) {
          toast.error('Razorpay SDK failed to load. Are you online?');
          setIsProcessing(false);
          return;
        }

        const payload = { shippingAddress };
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
                  paymentMethod: 'razorpay',
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature
                };
                
                const verifyRes = await axios.post('/orders', verifyPayload, { headers: getAuthHeaders() });
                if (verifyRes.data.success) {
                  toast.success('Order placed successfully!');
                  updateCartCount(0);
                  refreshCart();
                  navigate('/');
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
          paymentMethod: selectedMethod
        };

        const response = await axios.post('/orders', payload, { headers: getAuthHeaders() });
        
        if (response.data.success) {
          toast.success('Order placed successfully!');
          
          // Clear cart globally
          updateCartCount(0);
          refreshCart();
          
          // Redirect to success page or home
          navigate('/');
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

          {/* Right Column (Proceed Button Block) */}
          <div className="w-full lg:w-[440px] xl:w-[460px] shrink-0 lg:sticky lg:top-[76px] sm:lg:top-[82px] lg:self-start">
             <div className="bg-white rounded-xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] p-6 border border-gray-100">
                <h3 className="font-bold text-[16px] text-[#111827] mb-4">Payment Summary</h3>
                <p className="text-[#535766] text-[13px] mb-6">
                  {selectedMethod === 'razorpay' ? (
                    <>You are selecting <strong>Razorpay</strong> for secure online payment.</>
                  ) : (
                    <>You are selecting <strong>{paymentMethods.find(m => m.id === selectedMethod)?.title}</strong> for this order.</>
                  )}
                </p>
                <button 
                  onClick={handleConfirmOrder}
                  disabled={isProcessing}
                  className={`w-full text-white font-bold text-[14px] py-3.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 ${
                    isProcessing ? 'bg-[#E06400] opacity-70 cursor-not-allowed' : 'bg-[#FD7100] hover:bg-[#E06400]'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      {selectedMethod === 'razorpay' ? 'Pay with Razorpay' : 'Confirm Order'}
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

export default Payment;
