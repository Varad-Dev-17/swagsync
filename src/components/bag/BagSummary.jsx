import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BagSummary = ({ totals }) => {
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

  return (
    <div className="bg-white rounded-[12px] shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] sticky top-32 overflow-hidden">
      <div className="bg-gradient-to-r from-[#4F46E5] to-[#6D4AFF] p-4 lg:p-5 flex justify-between items-center relative overflow-hidden"> 
        <div className="absolute right-8 top-4 text-white/20 text-4xl">✨</div>
        <div className="absolute right-24 bottom-4 text-white/10 text-6xl">✦</div>
        
        <h2 className="text-[20px] font-bold text-white z-10">
          Order Summary
        </h2>
        
        <div className="w-12 h-14 bg-white/10 backdrop-blur-sm rounded-t-md border-t-2 border-x-2 border-white/30 relative z-10 flex items-center justify-center">
          <div className="w-6 h-3 border-2 border-white/50 rounded-t-full absolute -top-3"></div>
          <span className="text-white font-bold text-lg">V</span>
        </div>
      </div>

      <div className="p-6 lg:p-8">
        <div className="space-y-4 mb-6 text-[14px]">
          <div className="flex justify-between items-center text-[#282c3f]">
            <span>Total MRP</span>
            <span className="font-medium">{formatPrice(totals.totalMRP)}</span>
          </div>

          <div className="flex justify-between items-center text-[#282c3f]">
            <span>Discount on MRP</span>
            <span className="text-[#03a685] font-medium">
              {totals.discountOnMRP > 0 ? `- ${formatPrice(totals.discountOnMRP)}` : formatPrice(0)}
            </span>
          </div>

          <div className="flex justify-between items-center text-[#282c3f]">
            <span>Coupon Discount</span>
            <button className="text-[#4F46E5] font-bold hover:underline text-[13px] cursor-pointer">
              Apply Coupon
            </button>
          </div>

          <div className="flex justify-between items-center text-[#282c3f]">
            <span>Estimated Tax</span>
            <span className="font-medium">{formatPrice(totals.totalTax)}</span>
          </div>

          <div className="flex justify-between items-center text-[#282c3f]">
            <span>Delivery Fee</span>
            <span className="text-[#03a685] font-medium">
              {totals.shipping === 0 ? "Free" : formatPrice(totals.shipping)}
            </span>
          </div>
        </div>

        <div className="bg-[#4F46E5]/5 rounded-lg p-4 flex justify-between items-center mb-4">
          <span className="text-[16px] font-bold text-[#111827]">Total Amount</span>
          <span className="text-[18px] font-bold text-[#4F46E5]">{formatPrice(totals.grandTotal)}</span>
        </div>

        {totals.discountOnMRP > 0 && (
          <div className="bg-[#E6F6F1] text-[#03a685] text-[13px] font-medium px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            You are saving {formatPrice(totals.discountOnMRP)} on this order
          </div>
        )}

        <label 
          className="flex items-start gap-3 mb-6 cursor-pointer group"
          onClick={() => setIsTermsAccepted(!isTermsAccepted)}
        >
          <div className={`relative flex items-center justify-center w-5 h-5 mt-0.5 rounded flex-shrink-0 transition-colors ${isTermsAccepted ? 'bg-[#4F46E5] border border-[#4F46E5]' : 'bg-white border-2 border-gray-300 group-hover:border-[#4F46E5]'}`}>
            {isTermsAccepted && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
          <p className="text-[12px] text-[#535766] leading-relaxed select-none">
            By placing the order, you agree to SwagSync's{" "}
            <a href="#" onClick={(e) => e.stopPropagation()} className="text-[#4F46E5] font-semibold hover:underline">Terms of Use</a>{" "}
            and{" "}
            <a href="#" onClick={(e) => e.stopPropagation()} className="text-[#4F46E5] font-semibold hover:underline">Privacy Policy</a>
          </p>
        </label>

        <div className="space-y-3 mb-8">
          <button 
            onClick={() => navigate("/checkout/address")}
            disabled={!isTermsAccepted}
            className={`w-full text-white font-bold text-[14px] py-3.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 ${
              isTermsAccepted 
                ? 'bg-[#4F46E5] hover:bg-[#6D4AFF] cursor-pointer' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Proceed to Address
          </button>
          
          <button 
            onClick={() => navigate("/products")}
            className="w-full bg-white text-[#4F46E5] font-bold text-[14px] py-3.5 rounded-lg border border-[#eaeaec] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Continue Shopping
          </button>
        </div>

        <div>
          <p className="text-[11px] text-[#7e818c] mb-3">We Accept</p>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[11px] font-bold text-[#1434CB] bg-gray-50 border border-gray-200 px-2 py-1 rounded">VISA</div>
            <div className="text-[11px] font-bold text-[#EB001B] bg-gray-50 border border-gray-200 px-2 py-1 rounded flex items-center gap-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#EB001B]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] -ml-1.5 opacity-80"></div>
            </div>
            <div className="text-[11px] font-bold text-gray-700 bg-gray-50 border border-gray-200 px-2 py-1 rounded">UPI</div>
            <div className="text-[11px] font-bold text-[#002970] bg-gray-50 border border-gray-200 px-2 py-1 rounded">Paytm</div>
            <div className="text-[11px] font-bold text-slate-700 bg-gray-50 border border-gray-200 px-2 py-1 rounded flex items-center gap-1">
              <span>Pay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BagSummary;
