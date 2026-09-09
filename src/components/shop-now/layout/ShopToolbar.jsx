
import { Filter } from "lucide-react";

const ShopToolbar = ({ sort, onSortChange, onOpenMobileFilter }) => {
  return (
    <div className="flex items-center justify-between lg:justify-end pb-4 mb-4 border-b border-[#E5E7EB]">
      {/* Mobile Filter Button (visible only on mobile/tablet < lg) */}
      <button 
        type="button"
        onClick={onOpenMobileFilter}
        className="lg:hidden flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white border border-[#E5E7EB] rounded text-sm font-semibold text-[#111827] shadow-sm hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
      >
        <Filter size={16} />
        <span>Filters</span>
      </button>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-[14px] sm:text-[15px] text-[#4B5563] whitespace-nowrap">Sort by:</span>
        <select 
          value={sort || "newest"} 
          onChange={onSortChange} 
          className="border border-[#E5E7EB] rounded text-[14px] sm:text-[15px] text-[#111827] py-2 px-2.5 sm:px-3 focus:outline-none focus:ring-2 focus:ring-[#FD7100]/20 focus:border-[#FD7100] cursor-pointer transition-all duration-300 bg-white min-w-[125px] sm:min-w-[140px]"
        >
          <option value="newest">Newest</option>
          <option value="priceAsc">Price: Low to High</option>
          <option value="priceDesc">Price: High to Low</option>
          <option value="ratingDesc">Highest Rating</option>
        </select>
      </div>
    </div>
  );
};

export default ShopToolbar;
