import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, MapPin } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import CheckoutTracker from '../../components/bag/CheckoutTracker';
import AddressModal from '../../components/account/addresses/AddressModal';

const Address = () => {
  const navigate = useNavigate();
  const { getAuthHeaders } = useAuth();
  
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAddresses = async () => {
    try {
      const response = await axios.get('/addresses', { headers: getAuthHeaders() });
      if (response.data.success) {
        const fetchedAddresses = response.data.addresses;
        setAddresses(fetchedAddresses);
        
        // Auto-select default address if none is currently selected
        if (!selectedAddressId && fetchedAddresses.length > 0) {
          const defaultAddress = fetchedAddresses.find(addr => addr.isDefault) || fetchedAddresses[0];
          setSelectedAddressId(defaultAddress._id);
        }
      }
    } catch (error) {
      toast.error('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveAddress = async (formData) => {
    setIsProcessing(true);
    try {
      const response = await axios.post('/addresses', formData, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) {
        toast.success('Address added successfully');
        setIsAddressModalOpen(false);
        fetchAddresses(); // This will also auto-select it if it's the first one
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add address');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address');
      return;
    }
    // You could also save the selected address ID to context/local storage here if needed for the final order placement
    localStorage.setItem('checkout_address_id', selectedAddressId);
    navigate('/checkout/payment');
  };

  return (
    <div className="min-h-screen bg-[#f9f9fb] pt-[76px] sm:pt-[82px] pb-12 sm:pb-24">
      <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto max-w-[1360px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 mt-0 items-start">
          {/* Main Content Area */}
          <div className="flex-grow lg:flex-1 min-w-0 space-y-4 w-full">
            <div className="pb-1">
              <CheckoutTracker currentStep="address" />
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-700">Select Delivery Address</h2>
              <button 
                onClick={() => setIsAddressModalOpen(true)}
                className="text-[13px] font-bold text-[#FD7100] border border-[#FD7100] px-4 py-2 rounded-lg hover:bg-[#FFF5ED] transition-colors flex items-center gap-2"
              >
                <Plus size={16} /> ADD NEW ADDRESS
              </button>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-xl shadow-sm p-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#FD7100] animate-spin" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-[#FFF5ED] rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin size={24} className="text-[#FD7100]" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">No addresses saved</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                  Add a delivery address to proceed with your checkout.
                </p>
                <button 
                  onClick={() => setIsAddressModalOpen(true)}
                  className="px-6 py-2.5 bg-[#FD7100] text-white rounded-lg font-bold hover:bg-[#E06400] transition-colors"
                >
                  ADD NEW ADDRESS
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div 
                    key={address._id} 
                    onClick={() => setSelectedAddressId(address._id)}
                    className={`border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow transition-all relative cursor-pointer ${
                      selectedAddressId === address._id 
                        ? 'border-[#03a685] ring-1 ring-[#03a685]' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="p-6 flex items-start gap-4">
                      {/* Radio button custom styling */}
                      <div className="mt-1 flex-shrink-0">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedAddressId === address._id 
                            ? 'border-[#03a685]' 
                            : 'border-gray-300'
                        }`}>
                          {selectedAddressId === address._id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#03a685]"></div>
                          )}
                        </div>
                      </div>

                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-[15px] font-bold text-slate-700 tracking-wide">
                            {address.fullName}
                          </h4>
                          <div className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                            {address.label}
                          </div>
                          {address.isDefault && (
                            <div className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded">
                              Default
                            </div>
                          )}
                        </div>
                        
                        <div className="text-[14px] text-gray-600 space-y-1">
                          <p>
                            {address.addressLine1}
                            {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                            {address.landmark ? `, ${address.landmark}` : ''}
                          </p>
                          <p>{address.city}, {address.state} - {address.pincode}</p>
                          <p className="pt-2 font-medium">Mobile: <span className="text-slate-700">{address.phone}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column (Proceed Button Block) */}
          <div className="w-full lg:w-[440px] xl:w-[460px] shrink-0 lg:sticky lg:top-[76px] sm:lg:top-[82px] lg:self-start">
             <div className="bg-white rounded-xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] p-6">
                <p className="text-[#535766] text-[13px] mb-6">
                  Please select a delivery address to proceed to the next step.
                </p>
                <button 
                  onClick={handleContinue}
                  disabled={!selectedAddressId}
                  className={`w-full text-white font-bold text-[14px] py-3.5 rounded-lg shadow-sm transition-colors flex items-center justify-center ${
                    selectedAddressId 
                      ? 'bg-[#FD7100] hover:bg-[#E06400] cursor-pointer' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continue to Payment
                </button>
             </div>
          </div>
        </div>
      </div>

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveAddress}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default Address;
