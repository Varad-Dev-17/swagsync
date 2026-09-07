import React, { useState, useEffect } from 'react';
import { X, MapPin, Briefcase, HelpCircle } from 'lucide-react';

const AddressModal = ({ isOpen, onClose, onSave, address, isProcessing }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    label: 'Home',
    isDefault: false,
  });

  useEffect(() => {
    if (isOpen) {
      if (address) {
        setFormData({
          fullName: address.fullName || '',
          phone: address.phone || '',
          addressLine1: address.addressLine1 || '',
          addressLine2: address.addressLine2 || '',
          landmark: address.landmark || '',
          city: address.city || '',
          state: address.state || '',
          country: address.country || 'India',
          pincode: address.pincode || '',
          label: address.label || 'Home',
          isDefault: address.isDefault || false,
        });
      } else {
        // Reset form for new address
        setFormData({
          fullName: '',
          phone: '',
          addressLine1: '',
          addressLine2: '',
          landmark: '',
          city: '',
          state: '',
          country: 'India',
          pincode: '',
          label: 'Home',
          isDefault: false,
        });
      }
    }
  }, [isOpen, address]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto pt-20">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-700">
            {address ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-8">
            {/* Contact Details */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    disabled={isProcessing}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FD7100]/20 focus:border-[#FD7100] transition-colors disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit mobile number"
                    disabled={isProcessing}
                    placeholder="10-digit mobile number"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FD7100]/20 focus:border-[#FD7100] transition-colors disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* Address Details */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Address Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      required
                      pattern="[0-9]{6}"
                      title="Please enter a valid 6-digit pincode"
                      disabled={isProcessing}
                      placeholder="6-digit pincode"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FD7100]/20 focus:border-[#FD7100] transition-colors disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      disabled={isProcessing}
                      placeholder="City/District/Town"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FD7100]/20 focus:border-[#FD7100] transition-colors disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    required
                    disabled={isProcessing}
                    placeholder="House No., Building Name, Area, Colony"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FD7100]/20 focus:border-[#FD7100] transition-colors disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    disabled={isProcessing}
                    placeholder="Street, Sector, Village"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FD7100]/20 focus:border-[#FD7100] transition-colors disabled:opacity-60"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Landmark (Optional)</label>
                    <input
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleChange}
                      disabled={isProcessing}
                      placeholder="E.g. near Apollo Hospital"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FD7100]/20 focus:border-[#FD7100] transition-colors disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      disabled={isProcessing}
                      placeholder="State"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FD7100]/20 focus:border-[#FD7100] transition-colors disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Type & Settings */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Save Address As</h3>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setFormData((prev) => ({ ...prev, label: 'Home' }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                    formData.label === 'Home'
                      ? 'border-[#FD7100] bg-[#FFF5ED] text-[#FD7100]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                  }`}
                >
                  <MapPin size={16} /> Home
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setFormData((prev) => ({ ...prev, label: 'Work' }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                    formData.label === 'Work'
                      ? 'border-[#FD7100] bg-[#FFF5ED] text-[#FD7100]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                  }`}
                >
                  <Briefcase size={16} /> Work
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setFormData((prev) => ({ ...prev, label: 'Other' }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                    formData.label === 'Other'
                      ? 'border-[#FD7100] bg-[#FFF5ED] text-[#FD7100]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                  }`}
                >
                  <HelpCircle size={16} /> Other
                </button>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleChange}
                    disabled={isProcessing}
                    className="w-5 h-5 appearance-none border-2 border-gray-300 rounded cursor-pointer checked:bg-[#FD7100] checked:border-[#FD7100] transition-colors disabled:opacity-50"
                  />
                  {formData.isDefault && (
                    <svg
                      className="absolute w-3 h-3 text-white pointer-events-none"
                      viewBox="0 0 14 10"
                      fill="none"
                    >
                      <path
                        d="M1 5L4.5 8.5L13 1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-slate-700 transition-colors">
                  Make this my default address
                </span>
              </label>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white z-10">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#FD7100] rounded-lg hover:bg-[#E06400] transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[140px] justify-center"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Address'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressModal;
