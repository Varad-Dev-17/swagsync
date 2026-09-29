import { ShoppingCart, RefreshCcw, Headphones, MessageSquare, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export const VendorOrdersPlaceholder = () => (
  <div className="p-6 sm:p-10 max-w-4xl mx-auto my-12 text-center">
    <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
      <ShoppingCart size={32} />
    </div>
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3 border border-blue-200">
      <Sparkles size={14} /> Phase 3 Fulfillment
    </div>
    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
      Vendor Orders & Dispatch
    </h1>
    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
      Order tracking, shipping label generation, courier pickup scheduling, and buyer dispatch workflows will be active once customers purchase your products in Phase 3.
    </p>
    <div className="mt-6 flex items-center justify-center gap-3">
      <Link
        to="/vendor/portal/products"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fe4a03] text-white text-xs font-bold shadow-md shadow-[#fe4a03]/25"
      >
        Manage Products <ArrowRight size={14} />
      </Link>
    </div>
  </div>
);

export const VendorReturnsPlaceholder = () => (
  <div className="p-6 sm:p-10 max-w-4xl mx-auto my-12 text-center">
    <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
      <RefreshCcw size={32} />
    </div>
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider mb-3 border border-amber-200">
      <Sparkles size={14} /> Phase 3 Reverse Logistics
    </div>
    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
      Returns & Exchanges
    </h1>
    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
      Customer return requests, inspection audits, exchange order dispatch, and refund authorization center.
    </p>
    <div className="mt-6 flex items-center justify-center gap-3">
      <Link
        to="/vendor/portal/inventory"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
      >
        View Stock & Inventory
      </Link>
    </div>
  </div>
);

export const VendorTicketsPlaceholder = () => (
  <div className="p-6 sm:p-10 max-w-4xl mx-auto my-12 text-center">
    <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
      <Headphones size={32} />
    </div>
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider mb-3 border border-purple-200">
      <Sparkles size={14} /> Phase 4 Partner Support
    </div>
    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
      Vendor Helpdesk & Tickets
    </h1>
    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
      Raise dispute tickets, contact merchant relationship managers, and resolve customer escalations directly through the portal.
    </p>
  </div>
);

export const VendorReviewsPlaceholder = () => (
  <div className="p-6 sm:p-10 max-w-4xl mx-auto my-12 text-center">
    <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
      <MessageSquare size={32} />
    </div>
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3 border border-emerald-200">
      <Sparkles size={14} /> Phase 4 Feedback
    </div>
    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
      Customer Ratings & Reviews
    </h1>
    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
      Monitor customer reviews, product ratings, quality feedback, and respond to verified purchaser comments.
    </p>
  </div>
);
