import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ticket, Calendar, DollarSign, Percent, Info, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const CouponModal = ({ isOpen, onClose, onSave, couponToEdit, isLoading }) => {
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minimumOrderAmount: "",
    maximumDiscount: "",
    usageLimit: "",
    startDate: "",
    expiryDate: "",
    status: "active",
  });

  useEffect(() => {
    if (couponToEdit) {
      setFormData({
        code: couponToEdit.code || "",
        description: couponToEdit.description || "",
        discountType: couponToEdit.discountType || "percentage",
        discountValue: couponToEdit.discountValue ?? "",
        minimumOrderAmount: couponToEdit.minimumOrderAmount ?? "",
        maximumDiscount: couponToEdit.maximumDiscount ?? "",
        usageLimit: couponToEdit.usageLimit ?? "",
        startDate: couponToEdit.startDate
          ? new Date(couponToEdit.startDate).toISOString().split("T")[0]
          : "",
        expiryDate: couponToEdit.expiryDate
          ? new Date(couponToEdit.expiryDate).toISOString().split("T")[0]
          : "",
        status: couponToEdit.status || "active",
      });
    } else {
      // Default dates for new coupon
      const today = new Date().toISOString().split("T")[0];
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      setFormData({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: "",
        minimumOrderAmount: "",
        maximumDiscount: "",
        usageLimit: "",
        startDate: today,
        expiryDate: nextMonth,
        status: "active",
      });
    }
  }, [couponToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "code") {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase().replace(/\s+/g, "") }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }

    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      toast.error("Please provide a valid discount value greater than 0");
      return;
    }

    if (formData.discountType === "percentage" && Number(formData.discountValue) > 100) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }

    if (!formData.expiryDate) {
      toast.error("Expiry date is required");
      return;
    }

    if (formData.startDate && formData.expiryDate && formData.startDate > formData.expiryDate) {
      toast.error("Expiry date must be after start date");
      return;
    }

    onSave({
      ...formData,
      discountValue: Number(formData.discountValue),
      minimumOrderAmount: Number(formData.minimumOrderAmount) || 0,
      maximumDiscount: Number(formData.maximumDiscount) || 0,
      usageLimit: Number(formData.usageLimit) || 0,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4648d4]/10 text-[#4648d4] flex items-center justify-center">
                  <Ticket size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {couponToEdit ? "Edit Coupon" : "Create New Coupon"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {couponToEdit
                      ? "Update existing coupon parameters & limits"
                      : "Create a verified promo code for shoppers"}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-200/60 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Coupon Code */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    required
                    placeholder="e.g. FESTIVE20"
                    value={formData.code}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono font-bold uppercase focus:outline-none focus:border-[#4648d4] focus:bg-white transition-colors"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4648d4] focus:bg-white transition-colors"
                  >
                    <option value="active">Active (Available)</option>
                    <option value="inactive">Inactive (Disabled)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Description / Title
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="e.g. Flat ₹200 OFF on your first purchase above ₹999"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4648d4] focus:bg-white transition-colors"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Discount Type *
                  </label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4648d4] focus:bg-white transition-colors"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Discount Value * ({formData.discountType === "percentage" ? "%" : "₹"})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="discountValue"
                      required
                      min="1"
                      max={formData.discountType === "percentage" ? "100" : undefined}
                      placeholder={formData.discountType === "percentage" ? "15" : "200"}
                      value={formData.discountValue}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4648d4] focus:bg-white transition-colors"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none font-bold">
                      {formData.discountType === "percentage" ? "%" : "₹"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Min Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="minimumOrderAmount"
                    min="0"
                    placeholder="0 (No minimum)"
                    value={formData.minimumOrderAmount}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4648d4] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    name="maximumDiscount"
                    min="0"
                    placeholder="0 (No cap)"
                    value={formData.maximumDiscount}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4648d4] focus:bg-white transition-colors"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Useful for % discount capping</p>
                </div>
              </div>

              {/* Start Date & Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4648d4] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    required
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4648d4] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Usage Limit */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Total Usage Limit
                </label>
                <input
                  type="number"
                  name="usageLimit"
                  min="0"
                  placeholder="0 = Unlimited uses"
                  value={formData.usageLimit}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4648d4] focus:bg-white transition-colors"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl bg-[#4648d4] hover:bg-[#3b3dbf] text-white font-bold transition-all shadow-md shadow-[#4648d4]/20 active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : couponToEdit ? "Update Coupon" : "Create Coupon"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CouponModal;
