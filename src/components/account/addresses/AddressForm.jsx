import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Briefcase, HelpCircle, Loader2 } from 'lucide-react';

const AddressForm = ({ address, onSave, onCancel, isProcessing }) => {
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
  }, [address]);

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

  return (
    <div className="w-full">
      {/* Top Navigation / Breadcrumb */}
      <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between flex-wrap gap-3 bg-white">
        <div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-500 hover:text-[#FD7100] transition-colors mb-2 cursor-pointer disabled:opacity-50"
          >
            <ArrowLeft size={16} />
            <span>Back to Saved Addresses</span>
          </button>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">
            {address ? 'Edit Delivery Address' : 'Add New Delivery Address'}
          </h3>
          <p className="text-sm text-gray-500 font-medium">
            {address ? 'Update your shipping details below' : 'Please provide accurate delivery information for faster delivery'}
          </p>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8 bg-white">
        {/* Section 1: Contact Details */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#FD7100]" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Contact Details
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                disabled={isProcessing}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-2.5 bg-gray-50/60 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FD7100]/20 focus:border-[#FD7100] transition-all disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                10-Digit Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit mobile number"
                disabled={isProcessing}
                placeholder="e.g. 9876543210"
                className="w-full px-4 py-2.5 bg-gray-50/60 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FD7100]/20 focus:border-[#FD7100] transition-all disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Address Information */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#FD7100]" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Address Information
            </h4>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{6}"
                  title="Please enter a valid 6-digit pincode"
                  disabled={isProcessing}
                  placeholder="6-digit pincode (e.g. 411057)"
                  className="w-full px-4 py-2.5 bg-gray-50/60 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FD7100]/20 focus:border-[#FD7100] transition-all disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  City / Town <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  disabled={isProcessing}
                  placeholder="City or District"
                  className="w-full px-4 py-2.5 bg-gray-50/60 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FD7100]/20 focus:border-[#FD7100] transition-all disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Flat, House no., Building, Company, Apartment <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                required
                disabled={isProcessing}
                placeholder="e.g. Flat 402, Royal Palms, Tower B"
                className="w-full px-4 py-2.5 bg-gray-50/60 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FD7100]/20 focus:border-[#FD7100] transition-all disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Area, Street, Sector, Village <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                disabled={isProcessing}
                placeholder="e.g. Hinjawadi Phase 1, Main Road"
                className="w-full px-4 py-2.5 bg-gray-50/60 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FD7100]/20 focus:border-[#FD7100] transition-all disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Landmark <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  disabled={isProcessing}
                  placeholder="e.g. Near HP Petrol Pump"
                  className="w-full px-4 py-2.5 bg-gray-50/60 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FD7100]/20 focus:border-[#FD7100] transition-all disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  disabled={isProcessing}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-4 py-2.5 bg-gray-50/60 border border-gray-200 rounded-lg text-sm text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FD7100]/20 focus:border-[#FD7100] transition-all disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Save Address As & Default */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#FD7100]" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Address Label
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            {['Home', 'Work', 'Other'].map((label) => {
              const Icon = label === 'Home' ? MapPin : label === 'Work' ? Briefcase : HelpCircle;
              const isSelected = formData.label === label;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setFormData((prev) => ({ ...prev, label }))}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#FD7100] bg-[#FFF5ED] text-[#FD7100] shadow-xs'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Make Default Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer select-none group w-fit">
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
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-slate-900 transition-colors">
              Make this my default delivery address
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3 flex-wrap">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isProcessing}
            className="px-8 py-2.5 text-sm font-bold text-white bg-[#FD7100] rounded-lg hover:bg-[#E06400] transition-all disabled:opacity-50 cursor-pointer shadow-xs active:scale-95 flex items-center gap-2 min-w-[150px] justify-center"
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{address ? 'Update Address' : 'Save Address'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddressForm;
