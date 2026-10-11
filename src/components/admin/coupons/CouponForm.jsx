import { useState, useEffect } from "react";
import { ArrowLeft, Ticket, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const CouponForm = ({ onCancel, onSave, couponToEdit, isLoading }) => {
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
  }, [couponToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "code") {
      setFormData((prev) => ({
        ...prev,
        [name]: value.toUpperCase().replace(/\s+/g, ""),
      }));
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

    if (
      formData.discountType === "percentage" &&
      Number(formData.discountValue) > 100
    ) {
      toast.error("Percentage discount cannot exceed 100%");
      return;
    }

    if (!formData.expiryDate) {
      toast.error("Expiry date is required");
      return;
    }

    if (
      formData.startDate &&
      formData.expiryDate &&
      formData.startDate > formData.expiryDate
    ) {
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
    <div className="w-full space-y-6">
      {/* Top Header with Back button */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Back to Coupons"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#4648d4]/10 text-[#4648d4] flex items-center justify-center">
                <Ticket size={20} />
              </div>
              {couponToEdit ? "Edit Coupon" : "Create New Coupon"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {couponToEdit
                ? "Update coupon settings, discount values, and validity rules"
                : "Enter coupon details and configure promotional discount rules"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>

      {/* Main Unified Full-Width Multi-Column Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 lg:p-10 space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Coupon Code */}
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Coupon Code *
            </label>
            <input
              type="text"
              name="code"
              required
              placeholder="E.G. FESTIVE20"
              value={formData.code}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal uppercase focus:outline-none focus:border-[#4648d4] focus:bg-white focus:ring-2 focus:ring-[#4648d4]/10 transition-all"
            />
          </div>

          {/* 2. Status */}
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#4648d4] focus:bg-white focus:ring-2 focus:ring-[#4648d4]/10 transition-all cursor-pointer"
            >
              <option value="active">Active (Available)</option>
              <option value="inactive">Inactive (Disabled)</option>
            </select>
          </div>

          {/* 3. Description / Title (Spans 2 columns to fill row) */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Description / Title
            </label>
            <input
              type="text"
              name="description"
              placeholder="e.g. Flat ₹200 OFF on your first purchase above ₹999"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4648d4] focus:bg-white focus:ring-2 focus:ring-[#4648d4]/10 transition-all"
            />
          </div>

          {/* 4. Discount Type */}
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Discount Type *
            </label>
            <select
              name="discountType"
              value={formData.discountType}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#4648d4] focus:bg-white focus:ring-2 focus:ring-[#4648d4]/10 transition-all cursor-pointer"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>
          </div>

          {/* 5. Discount Value */}
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4648d4] focus:bg-white focus:ring-2 focus:ring-[#4648d4]/10 transition-all pr-10"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold pointer-events-none">
                {formData.discountType === "percentage" ? "%" : "₹"}
              </span>
            </div>
          </div>

          {/* 6. Min Order Amount */}
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Min Order Amount (₹)
            </label>
            <input
              type="number"
              name="minimumOrderAmount"
              min="0"
              placeholder="0 (No minimum)"
              value={formData.minimumOrderAmount}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4648d4] focus:bg-white focus:ring-2 focus:ring-[#4648d4]/10 transition-all"
            />
          </div>

          {/* 7. Max Discount Cap */}
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Max Discount Cap (₹)
            </label>
            <input
              type="number"
              name="maximumDiscount"
              min="0"
              placeholder="0 (No cap)"
              value={formData.maximumDiscount}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4648d4] focus:bg-white focus:ring-2 focus:ring-[#4648d4]/10 transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">Useful for % discount capping</p>
          </div>

          {/* 8. Start Date */}
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#4648d4] focus:bg-white focus:ring-2 focus:ring-[#4648d4]/10 transition-all cursor-pointer"
            />
          </div>

          {/* 9. Expiry Date */}
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Expiry Date *
            </label>
            <input
              type="date"
              name="expiryDate"
              required
              value={formData.expiryDate}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#4648d4] focus:bg-white focus:ring-2 focus:ring-[#4648d4]/10 transition-all cursor-pointer"
            />
          </div>

          {/* 10. Total Usage Limit (Spans 2 columns on desktop) */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Total Usage Limit
            </label>
            <input
              type="number"
              name="usageLimit"
              min="0"
              placeholder="0 = Unlimited uses"
              value={formData.usageLimit}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4648d4] focus:bg-white focus:ring-2 focus:ring-[#4648d4]/10 transition-all"
            />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-sm transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-8 py-2.5 rounded-xl bg-[#4648d4] hover:bg-[#3b3dbf] text-white font-bold text-sm shadow-md shadow-[#4648d4]/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span>Saving...</span>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{couponToEdit ? "Update Coupon" : "Create Coupon"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CouponForm;
