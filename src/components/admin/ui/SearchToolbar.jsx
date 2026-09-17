import { Search } from 'lucide-react';

const SearchToolbar = ({ 
  searchQuery, 
  onSearchChange, 
  searchPlaceholder = "Search...",
  extraFilters = null,
  actionButton = null,
  leftSlot = null
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-gray-100 bg-white rounded-t-[20px] relative z-20">
      {/* Left Navigation / Tabs + Search + Extra Filters */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
        {/* Left Navigation / Tabs */}
        {leftSlot && (
          <div className="shrink-0">
            {leftSlot}
          </div>
        )}
        
        {/* Search Input */}
        <div className="relative min-w-[160px] max-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 border border-gray-200 rounded-xl outline-none focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] transition-colors text-xs sm:text-[13px] h-9.5 bg-slate-50/50 hover:bg-white focus:bg-white"
          />
        </div>

        {/* Extra Filters Slot */}
        {extraFilters && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {extraFilters}
          </div>
        )}
      </div>

      {/* Action Button - aligned to the far right */}
      {actionButton && (
        <div className="shrink-0 ml-auto">
          {actionButton}
        </div>
      )}
    </div>
  );
};

export default SearchToolbar;
