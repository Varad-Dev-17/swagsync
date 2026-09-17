import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, Check, X } from "lucide-react";

const BagSummary = ({
  totals,
  appliedCoupon,
  onOpenCouponModal,
  onRemoveCoupon,
}) => {
  const [isTermsAccepted, setIsTermsAccepted] = useState(true);
  const navigate = useNavigate();

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalItems = totals.items.reduce((acc, item) => acc + item.quantity, 0);
  const couponDiscount = totals.couponDiscount || 0;
  const totalSavings = (totals.discountOnMRP || 0);

  return (
    <div className="bg-white rounded-[12px] shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="bg-gradient-to-r from-[#FD7100] to-[#E06400] px-5 py-3.5 sm:px-6 sm:py-4 flex justify-between items-center relative overflow-hidden"> 
        <div className="absolute right-8 top-2 text-white/20 text-2xl">✨</div>
        <div className="absolute right-20 bottom-1 text-white/10 text-4xl">✦</div>
        
        <h2 className="text-[16px] sm:text-[17px] font-bold text-white z-10">
          Order Summary
        </h2>
        
        <div className="w-8 h-9.5 bg-white/10 backdrop-blur-sm rounded-t border-t-2 border-x-2 border-white/30 relative z-10 flex items-center justify-center">
          <div className="w-4.5 h-2.5 border-2 border-white/50 rounded-t-full absolute -top-2.5"></div>
          <span className="text-white font-bold text-xs">S</span>
        </div>
      </div>

      <div className="p-4.5 sm:p-5.5">
        <div className="space-y-3 mb-4.5 text-[13.5px] sm:text-[14px]">
          <div className="flex justify-between items-center text-[#282c3f]">
            <span>Total MRP</span>
            <span className="font-semibold text-slate-800">{formatPrice(totals.totalMRP)}</span>
          </div>

          <div className="flex justify-between items-center text-[#282c3f]">
            <span>Discount on MRP</span>
            <span className="text-[#03a685] font-semibold">
              {totals.discountOnMRP > 0 ? `- ${formatPrice(totals.discountOnMRP - couponDiscount)}` : formatPrice(0)}
            </span>
          </div>

          <div className="flex justify-between items-center text-[#282c3f]">
            <span>Coupon Discount</span>
            {appliedCoupon && couponDiscount > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-[#03a685] font-bold">
                  - {formatPrice(couponDiscount)}
                </span>
                <span className="font-mono text-[12px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  {appliedCoupon.code}
                </span>
                <button
                  onClick={onRemoveCoupon}
                  className="text-gray-400 hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                  title="Remove coupon"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenCouponModal}
                className="text-[#FD7100] font-bold hover:underline text-[13.5px] cursor-pointer"
              >
                Apply Coupon
              </button>
            )}
          </div>

          <div className="flex justify-between items-center text-[#282c3f]">
            <span>Estimated Tax</span>
            <span className="font-semibold text-slate-800">{formatPrice(totals.totalTax)}</span>
          </div>

          <div className="flex justify-between items-center text-[#282c3f]">
            <span>Delivery Fee</span>
            <span className="text-[#03a685] font-semibold">
              {totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}
            </span>
          </div>
        </div>

        {/* Applied Coupon Info Box */}
        {appliedCoupon && couponDiscount > 0 && (
          <div className="bg-[#E6F6F1] text-[#03a685] text-[12.5px] font-semibold px-4 py-3 rounded-xl flex items-center justify-between mb-5 border border-[#03a685]/20">
            <div className="flex items-center gap-2">
              <Check size={15} />
              <span>Coupon <strong>{appliedCoupon.code}</strong> applied (-{formatPrice(couponDiscount)})</span>
            </div>
            <button
              onClick={onOpenCouponModal}
              className="text-[#FD7100] font-bold hover:underline text-[12px] cursor-pointer"
            >
              Change
            </button>
          </div>
        )}

        <div className="bg-[#FD7100]/5 rounded-xl p-3.5 sm:p-4 flex justify-between items-center mb-5 border border-[#FD7100]/10">
          <span className="text-[14.5px] font-bold text-[#111827]">Total Amount</span>
          <span className="text-[16.5px] font-extrabold text-[#FD7100]">{formatPrice(totals.grandTotal)}</span>
        </div>

        {totalSavings > 0 && (
          <div className="bg-[#E6F6F1] text-[#03a685] text-[13px] font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 mb-4.5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            <span>You are saving {formatPrice(totalSavings)} on this order</span>
          </div>
        )}

        <label 
          className="flex items-start gap-2.5 mb-5 cursor-pointer group select-none"
          onClick={() => setIsTermsAccepted(!isTermsAccepted)}
        >
          <div className={`relative flex items-center justify-center w-4 h-4 mt-0.5 rounded flex-shrink-0 transition-colors ${isTermsAccepted ? 'bg-[#FD7100] border border-[#FD7100]' : 'bg-white border-2 border-gray-300 group-hover:border-[#FD7100]'}`}>
            {isTermsAccepted && (
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
          <p className="text-[11px] sm:text-[11.5px] text-[#535766] leading-normal">
            By placing the order, you agree to SwagSync's{" "}
            <a href="#" onClick={(e) => e.stopPropagation()} className="text-[#FD7100] font-semibold hover:underline">Terms of Use</a>{" "}
            and{" "}
            <a href="#" onClick={(e) => e.stopPropagation()} className="text-[#FD7100] font-semibold hover:underline">Privacy Policy</a>
          </p>
        </label>

        <div className="grid grid-cols-2 gap-3 mb-7">
          <button 
            onClick={() => navigate("/checkout/address")}
            disabled={!isTermsAccepted}
            className={`w-full text-white font-semibold text-[12px] py-3.5 px-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 ${
              isTermsAccepted 
                ? 'bg-[#FD7100] hover:bg-[#E06400] cursor-pointer' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span className="whitespace-nowrap">Proceed to Address</span>
          </button>
          
          <button 
            onClick={() => navigate("/products")}
            className="w-full bg-white text-[#FD7100] font-semibold text-[12px] py-3.5 px-2.5 rounded-lg border border-[#eaeaec] hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span className="whitespace-nowrap">Continue Shopping</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap pt-2 border-t border-gray-100">
          <span className="text-[11.5px] text-[#7e818c] font-medium shrink-0">We Accept</span>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[10.5px] font-bold text-[#1434CB] bg-gray-50 border border-gray-200 px-2.5 py-1 rounded">VISA</div>
            <div className="text-[10.5px] font-bold text-[#EB001B] bg-gray-50 border border-gray-200 px-2.5 py-1 rounded flex items-center gap-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#EB001B]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] -ml-1.5 opacity-80"></div>
            </div>
            <div className="text-[10.5px] font-bold text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded">UPI</div>
            <div className="text-[10.5px] font-bold text-[#002970] bg-gray-50 border border-gray-200 px-2.5 py-1 rounded">Paytm</div>
            <div className="text-[10.5px] font-bold text-slate-700 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded flex items-center gap-1">
              <span>Pay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BagSummary;
