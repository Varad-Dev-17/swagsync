import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import AddressForm from './AddressForm';
import ConfirmationModal from '../../common/ConfirmationModal';

const SavedAddressSection = () => {
  const { getAuthHeaders } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Inline Form state (No popup modal)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAddresses = async () => {
    try {
      const response = await axios.get('/addresses', { headers: getAuthHeaders() });
      if (response.data.success) {
        setAddresses(response.data.addresses);
      }
    } catch (error) {
      toast.error('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSaveAddress = async (formData) => {
    setIsProcessing(true);
    try {
      if (editingAddress) {
        const response = await axios.put(`/addresses/${editingAddress._id}`, formData, {
          headers: getAuthHeaders(),
        });
        if (response.data.success) {
          toast.success('Address updated successfully');
        }
      } else {
        const response = await axios.post('/addresses', formData, {
          headers: getAuthHeaders(),
        });
        if (response.data.success) {
          toast.success('Address added successfully');
        }
      }
      setIsFormOpen(false);
      setEditingAddress(null);
      fetchAddresses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save address');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditClick = (address) => {
    setEditingAddress(address);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (address) => {
    setAddressToDelete(address);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!addressToDelete) return;
    setIsDeleting(true);
    try {
      const response = await axios.delete(`/addresses/${addressToDelete._id}`, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) {
        toast.success('Address removed successfully');
        setIsDeleteModalOpen(false);
        setAddressToDelete(null);
        fetchAddresses();
      }
    } catch (error) {
      toast.error('Failed to remove address');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const response = await axios.patch(`/addresses/${id}/default`, {}, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) {
        toast.success('Default address updated');
        fetchAddresses();
      }
    } catch (error) {
      toast.error('Failed to set default address');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#FD7100] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden w-full">
      {isFormOpen ? (
        <AddressForm
          address={editingAddress}
          onSave={handleSaveAddress}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingAddress(null);
          }}
          isProcessing={isProcessing}
        />
      ) : (
        <>
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-[#FD7100]" />
              <div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Saved Addresses</h3>
                <p className="text-sm text-gray-500 font-medium">Manage your delivery addresses</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setEditingAddress(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#FD7100] text-white rounded-lg hover:bg-[#E06400] transition-colors text-sm font-bold cursor-pointer"
            >
              <Plus size={16} />
              <span>Add New Address</span>
            </button>
          </div>
          
          <div className="p-6 md:p-8">
            {addresses.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-xl p-12 text-center bg-gray-50/50">
                <div className="w-16 h-16 bg-[#FFF5ED] rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin size={24} className="text-[#FD7100]" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">No addresses saved yet</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                  Add your home or work address for faster checkout on your next order.
                </p>
                <button
                  onClick={() => {
                    setEditingAddress(null);
                    setIsFormOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FD7100] text-white rounded-lg hover:bg-[#E06400] transition-colors text-sm font-bold cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Add First Address</span>
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                  {addresses.map((address) => (
                    <div 
                      key={address._id} 
                      className={`border border-gray-100 rounded-xl overflow-hidden transition-all relative shadow-sm hover:shadow-md flex flex-col justify-between ${
                        address.isDefault ? 'border-l-4 border-l-[#FD7100] bg-white' : 'border-l-4 border-l-transparent bg-white hover:border-l-gray-300'
                      }`}
                    >
                      <div className={`p-5 flex-1 ${address.isDefault ? 'bg-[#FFF5ED]/25' : 'bg-white'}`}>
                        {/* Header Row: Name & Badges */}
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-slate-800 tracking-tight">
                              {address.fullName}
                            </h4>
                            <span className="px-2.5 py-0.5 bg-[#FFF5ED] text-[#FD7100] text-[10px] font-bold rounded-md">
                              {address.label}
                            </span>
                          </div>
                          {address.isDefault && (
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md whitespace-nowrap">
                              Default Address
                            </span>
                          )}
                        </div>

                        {/* Address Details */}
                        <div className="text-[13px] text-gray-500 space-y-1 leading-relaxed">
                          <p className="line-clamp-2">
                            {address.addressLine1}
                            {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                            {address.landmark ? `, ${address.landmark}` : ''}
                          </p>
                          <p>{address.city}, {address.state} - {address.pincode}</p>
                          <p>{address.country}</p>
                          <p className="pt-2 font-medium text-slate-600">
                            Mobile: <span className="text-slate-800 font-semibold">{address.phone}</span>
                          </p>
                        </div>
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-white text-xs sm:text-sm">
                        <div className="flex items-center gap-5">
                          <button 
                            onClick={() => handleEditClick(address)}
                            className="flex items-center gap-1.5 font-bold text-[#FD7100] hover:text-[#E06400] transition-colors cursor-pointer"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(address)}
                            className="flex items-center gap-1.5 font-bold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                        {!address.isDefault && (
                          <button 
                            onClick={() => handleSetDefault(address._id)}
                            className="flex items-center gap-1.5 font-bold text-[#FD7100] hover:text-[#E06400] transition-colors cursor-pointer"
                          >
                            Set as Default
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Remove Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
        confirmText="Remove"
        isProcessing={isDeleting}
      />
    </div>
  );
};

export default SavedAddressSection;
