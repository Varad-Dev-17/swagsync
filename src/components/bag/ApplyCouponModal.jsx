import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Ticket, 
  Check, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  Info
} from "lucide-react";
import axios from "axios";
import api from "../../api/axiosConfig";
import toast from "react-hot-toast";

const ApplyCouponModal = ({
  isOpen,
  onClose,
  bagSubtotal = 0,
  appliedCoupon = null,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [expandedTerms, setExpandedTerms] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchAvailableCoupons();
    }
  }, [isOpen]);

  const fetchAvailableCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/coupons");
      if (res.data.success) {
        setCoupons(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch coupons", err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDiscount = (coupon) => {
    if (!coupon) return 0;
    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = Math.round((bagSubtotal * coupon.discountValue) / 100);
      if (coupon.maximumDiscount > 0) {
        discount = Math.min(discount, coupon.maximumDiscount);
      }
    } else {
      discount = Math.min(coupon.discountValue, bagSubtotal);
    }
    return discount;
  };

  const handleApplyCoupon = (coupon) => {
    const discount = calculateDiscount(coupon);
    onApplyCoupon(coupon, discount);
    toast.success(`Coupon "${coupon.code}" applied! You saved ₹${discount}`);
    onClose();
  };

  const handleManualApply = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setIsValidating(true);
    try {
      const res = await axios.post("/coupons/validate", {
        code: manualCode.trim().toUpperCase(),
        cartTotal: bagSubtotal,
      });

      if (res.data.success) {
        const { coupon, discountAmount } = res.data.data;
        onApplyCoupon(coupon, discountAmount);
        toast.success(res.data.message || `Coupon "${coupon.code}" applied!`);
        setManualCode("");
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid coupon code");
    } finally {
      setIsValidating(false);
    }
  };

  const toggleTerms = (id) => {
    setExpandedTerms((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

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
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col z-10"
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#FFFBF7]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF5ED] text-[#FD7100] border border-[#FD7100]/20 flex items-center justify-center">
                  <Ticket size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Apply Coupon</h3>
                  <p className="text-xs text-gray-500">
                    Your current bag value: <strong className="text-gray-800">{formatPrice(bagSubtotal)}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-200/60 rounded-full transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Manual Code Input Bar */}
            <div className="p-4 sm:p-5 border-b border-gray-100 bg-white">
              <form onSubmit={handleManualApply} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-mono font-bold uppercase focus:outline-none focus:border-[#FD7100] focus:bg-white transition-colors"
                  />
                  {manualCode && (
                    <button
                      type="button"
                      onClick={() => setManualCode("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isValidating || !manualCode.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#FD7100] hover:bg-[#E06400] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#FD7100]/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  {isValidating ? "Checking..." : "APPLY"}
                </button>
              </form>
            </div>

            {/* Coupons List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 bg-gray-50/50">
              {isLoading ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-3 border-[#FD7100] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="mt-3 text-xs text-gray-500">Checking available coupons...</p>
                </div>
              ) : coupons.length === 0 ? (
                <div className="py-10 text-center text-gray-400">
                  <Ticket size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-medium">No coupons currently available</p>
                </div>
              ) : (
                coupons.map((c) => {
                  const isUpcoming = Boolean(c.isUpcoming || (c.startDate && new Date(c.startDate) > new Date()));
                  const isApplicable =
                    !isUpcoming && (!c.minimumOrderAmount || bagSubtotal >= c.minimumOrderAmount);
                  const isApplied = appliedCoupon?.code === c.code;
                  const savings = calculateDiscount(c);
                  const remaining = c.minimumOrderAmount - bagSubtotal;
                  const isTermsOpen = !!expandedTerms[c._id];

                  return (
                    <div
                      key={c._id}
                      className={`bg-white rounded-xl border transition-all overflow-hidden ${
                        isApplied
                          ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-xs"
                          : isApplicable
                          ? "border-gray-200/90 hover:border-[#FD7100]/50 shadow-xs"
                          : "border-gray-200/60 bg-gray-50/70 opacity-75"
                      }`}
                    >
                      {/* Top bar with code and apply button */}
                      <div className="p-4 flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-extrabold text-sm px-2.5 py-1 rounded-md border tracking-wider ${
                                isApplicable
                                  ? "bg-[#FFF5ED] text-[#FD7100] border-[#FD7100]/30"
                                  : "bg-gray-100 text-gray-400 border-gray-200"
                              }`}
                            >
                              {c.code}
                            </span>

                            {isUpcoming ? (
                              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                Starts {new Date(c.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            ) : isApplicable && savings > 0 ? (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Save ₹{savings}
                              </span>
                            ) : null}
                          </div>

                          <p className="text-xs text-gray-700 font-medium leading-relaxed pt-1">
                            {c.description ||
                              (c.discountType === "percentage"
                                ? `Get ${c.discountValue}% OFF on your order`
                                : `Flat ₹${c.discountValue} discount`)}
                          </p>
                        </div>

                        {/* Apply / Applied Button */}
                        <div className="shrink-0">
                          {isUpcoming ? (
                            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
                              Upcoming
                            </span>
                          ) : isApplied ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <Check size={13} />
                                APPLIED
                              </span>
                              <button
                                onClick={onRemoveCoupon}
                                className="text-xs text-red-500 hover:text-red-700 font-bold hover:underline cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          ) : isApplicable ? (
                            <button
                              onClick={() => handleApplyCoupon(c)}
                              className="px-4 py-1.5 rounded-lg bg-[#FD7100] hover:bg-[#E06400] text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                            >
                              APPLY
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-4 py-1.5 rounded-lg bg-gray-200 text-gray-400 text-xs font-bold cursor-not-allowed"
                            >
                              APPLY
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Requirement & Details strip */}
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                        {isUpcoming ? (
                          <div className="flex items-center gap-1 text-purple-700 font-medium">
                            <Clock size={13} className="shrink-0" />
                            <span>Offer goes live on {new Date(c.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        ) : !isApplicable ? (
                          <div className="flex items-center gap-1 text-amber-700 font-medium">
                            <AlertCircle size={13} className="shrink-0" />
                            <span>
                              Add {formatPrice(remaining)} more to unlock this offer (Min. {formatPrice(c.minimumOrderAmount)})
                            </span>
                          </div>
                        ) : (
                          <div className="text-gray-500">
                            {c.minimumOrderAmount > 0
                              ? `Valid on orders above ${formatPrice(c.minimumOrderAmount)}`
                              : "No minimum spend required"}
                            {c.maximumDiscount > 0 && ` • Max discount ${formatPrice(c.maximumDiscount)}`}
                          </div>
                        )}

                        <div className="text-gray-400 flex items-center gap-1 shrink-0 self-start sm:self-auto">
                          <Clock size={11} />
                          <span>
                            Expires{" "}
                            {new Date(c.expiryDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {appliedCoupon && (
              <div className="p-4 border-t border-gray-100 bg-[#F0FDF4] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-800">
                  <Check size={16} className="text-emerald-600" />
                  <span>
                    Coupon <strong>{appliedCoupon.code}</strong> applied
                  </span>
                </div>
                <button
                  onClick={onRemoveCoupon}
                  className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Remove Coupon
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ApplyCouponModal;
