import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import AddressModal from './AddressModal';
import ConfirmationModal from '../../common/ConfirmationModal';

const SavedAddressSection = () => {
  const { getAuthHeaders } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
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
      setIsAddressModalOpen(false);
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
    setIsAddressModalOpen(true);
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
            setIsAddressModalOpen(true);
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
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Add your home or work address for faster checkout on your next order.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5">
            {addresses.map((address) => (
              <div 
                key={address._id} 
                className={`border border-gray-100 rounded-xl overflow-hidden transition-all relative shadow-sm ${
                  address.isDefault ? 'border-l-4 border-l-[#FD7100]' : 'border-l-4 border-l-transparent hover:border-l-gray-300'
                }`}
              >
                <div className={`p-5 md:p-6 pb-4 ${address.isDefault ? 'bg-[#FFF5ED]/30' : 'bg-white'}`}>
                  {/* Header Row: Name & Badge */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="text-base font-bold text-slate-800 tracking-tight">
                        {address.fullName}
                      </h4>
                      <div className="px-2.5 py-0.5 bg-[#FFF5ED] text-[#FD7100] text-[10px] font-bold rounded-md">
                        {address.label}
                      </div>
                    </div>
                    {address.isDefault && (
                      <div className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md">
                        Default Address
                      </div>
                    )}
                  </div>

                  {/* Address Details */}
                  <div className="text-[14px] text-gray-500 space-y-1">
                    <p>
                      {address.addressLine1}
                      {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                      {address.landmark ? `, ${address.landmark}` : ''}
                    </p>
                    <p>{address.city}, {address.state} - {address.pincode}</p>
                    <p>{address.country}</p>
                    <p className="pt-2 font-medium">Mobile: <span className="text-slate-800">{address.phone}</span></p>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-8 bg-white">
                  <button 
                    onClick={() => handleEditClick(address)}
                    className="flex items-center gap-1.5 text-sm font-bold text-[#FD7100] hover:text-[#E06400] transition-colors"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(address)}
                    className="flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                  {!address.isDefault && (
                    <button 
                      onClick={() => handleSetDefault(address._id)}
                      className="flex items-center gap-1.5 text-sm font-bold text-[#FD7100] hover:text-[#E06400] transition-colors ml-auto"
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

      {/* Address Form Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        address={editingAddress}
        isProcessing={isProcessing}
      />

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
