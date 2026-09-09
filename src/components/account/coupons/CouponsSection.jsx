import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axiosConfig';
import { 
  Ticket, 
  Copy, 
  Check, 
  Sparkles, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ShoppingBag,
  Zap,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const CouponsSection = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/coupons');
      if (res.data.success) {
        setCoupons(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (code) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(code);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedCode(code);
    toast.success(`Coupon "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredCoupons = coupons.filter((c) => {
    if (activeFilter === 'all') return true;
    return c.discountType === activeFilter;
  });

  const featuredCoupon = coupons.find(c => c.code === 'SWAGFIRST') || coupons[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Coupons & Offers</h1>
            {coupons.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF5ED] text-[#FD7100] border border-[#FD7100]/30">
                {coupons.length} available
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Apply these verified coupon codes in your bag to unlock instant savings.
          </p>
        </div>

        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FD7100] hover:bg-[#e06400] text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-[#FD7100]/20 self-start sm:self-auto cursor-pointer"
        >
          <ShoppingBag size={15} />
          <span>Shop & Save</span>
        </button>
      </div>

      {/* Featured Banner */}
      {featuredCoupon && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FD7100] via-[#F97316] to-[#EA580C] p-4 sm:p-6 text-white shadow-sm">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-white/90 text-xs font-bold tracking-wider uppercase">
                <Sparkles size={14} />
                <span>Featured Offer</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                {featuredCoupon.description || `Special discount with ${featuredCoupon.code}`}
              </h2>
              <p className="text-xs sm:text-sm text-white/80 max-w-lg">
                Use code <span className="font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded">{featuredCoupon.code}</span> at checkout to get instant savings!
              </p>
            </div>
            <button
              onClick={() => handleCopy(featuredCoupon.code)}
              className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#FD7100] hover:bg-white/95 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer"
            >
              <span>{copiedCode === featuredCoupon.code ? 'Copied' : `Copy ${featuredCoupon.code}`}</span>
              {copiedCode === featuredCoupon.code ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'All Offers' },
          { id: 'percentage', label: 'Percentage Discounts' },
          { id: 'fixed', label: 'Flat Discounts' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === f.id
                ? 'bg-[#111827] text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Coupons Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-[#FD7100] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-xs text-gray-500">Loading coupons from store...</p>
        </div>
      ) : filteredCoupons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCoupons.map((c) => {
            const isCopied = copiedCode === c.code;

            return (
              <div
                key={c._id}
                className="bg-white rounded-2xl border border-gray-200 hover:border-[#FD7100]/40 transition-all shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden"
              >
                {/* Coupon Top Header */}
                <div className="p-4 sm:p-5 flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wide bg-[#FFF5ED] text-[#FD7100] border border-[#FD7100]/20">
                        {c.discountType === 'percentage'
                          ? `${c.discountValue}% OFF`
                          : `FLAT ₹${c.discountValue} OFF`}
                      </span>
                      <h3 className="font-bold text-gray-900 text-base sm:text-lg mt-1.5">
                        {c.code}
                      </h3>
                    </div>

                    {c.isUpcoming ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                        <Sparkles size={11} className="fill-purple-500 text-purple-500" />
                        Starts {new Date(c.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    ) : c.usedCount > 10 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                        <Zap size={11} className="fill-amber-500 text-amber-500" />
                        Popular
                      </span>
                    ) : null}
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {c.description || (c.discountType === 'percentage' ? `Get ${c.discountValue}% discount on your order` : `Get flat ₹${c.discountValue} off`)}
                  </p>

                  {/* Min spend & Expiry tags */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded font-medium text-gray-700">
                      Min Spend: ₹{c.minimumOrderAmount || 0}
                    </span>
                    {c.maximumDiscount > 0 && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded font-medium text-gray-700">
                        Max Cap: ₹{c.maximumDiscount}
                      </span>
                    )}
                    {c.startDate && (
                      <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded font-medium text-gray-700">
                        <Clock size={12} />
                        {c.isUpcoming ? 'Starts: ' : 'From: '}
                        {new Date(c.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded font-medium text-gray-700">
                      <Clock size={12} />
                      Expires: {new Date(c.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Coupon Code Strip */}
                <div className="bg-gray-50/90 border-t border-dashed border-gray-200 px-4 sm:px-5 py-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Ticket size={16} className="text-[#FD7100] shrink-0" />
                    <span className="font-mono font-bold text-sm tracking-wider text-gray-900 select-all">
                      {c.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(c.code)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#111827] hover:bg-gray-800 text-white shadow-xs active:scale-95'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check size={13} />
                          <span>COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>COPY CODE</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => navigate('/bag')}
                      className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#FD7100] hover:bg-[#FFF5ED] transition-colors cursor-pointer"
                    >
                      Apply in Bag
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Ticket size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-semibold text-gray-600">No coupons found in this category</p>
        </div>
      )}
    </div>
  );
};

export default CouponsSection;
