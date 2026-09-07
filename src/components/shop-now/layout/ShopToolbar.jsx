
const ShopToolbar = ({ totalProducts, showingCount, sort, onSortChange }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between pb-4 mb-4 border-b border-[#E5E7EB]">
      {/* Product Count */}
      <div className="text-[15px] text-[#4B5563] font-medium mb-4 sm:mb-0">
        Showing 1-{showingCount} of {totalProducts} products
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
        {/* Sort */}
        <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
          <span className="text-[15px] text-[#4B5563] whitespace-nowrap">Sort by:</span>
          <select value={sort || "newest"} onChange={onSortChange} className="border border-[#E5E7EB] rounded-none text-[15px] text-[#111827] py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FD7100]/20 focus:border-[#FD7100] cursor-pointer transition-all duration-300 bg-white min-w-[140px]">
            <option value="newest">Newest</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
            <option value="ratingDesc">Highest Rating</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ShopToolbar;
