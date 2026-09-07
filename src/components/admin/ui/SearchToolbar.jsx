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
    <div className="flex flex-row items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-gray-100 bg-white rounded-t-[20px] relative z-20">
      {/* Left Navigation / Tabs */}
      {leftSlot && (
        <div className="shrink-0 min-w-max">
          {leftSlot}
        </div>
      )}
      
      {/* Search Input - moved to the left right next to leftSlot */}
      <div className="relative w-[180px] shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] transition-colors text-[13px] h-10"
        />
      </div>

      {/* Extra Filters Slot */}
      {extraFilters && (
        <div className="flex flex-row items-center gap-2 shrink-0">
          {extraFilters}
        </div>
      )}

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
