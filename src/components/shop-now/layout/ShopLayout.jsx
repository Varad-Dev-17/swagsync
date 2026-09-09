import { useState } from "react";
import { X } from "lucide-react";

const ShopLayout = ({ sidebar, children, isMobileFilterOpen: externalOpen, setIsMobileFilterOpen: externalSetOpen }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isMobileFilterOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsMobileFilterOpen = externalSetOpen || setInternalOpen;

  return (
    <div className="min-h-screen bg-white lg:bg-[#FAFAFB] pt-[62px] sm:pt-[68px] lg:pt-[84px] relative">
      <div className="max-w-[1600px] mx-auto px-0 lg:px-4">
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-4 items-start">
          
          {/* Filter Sidebar (Desktop Sticky / Mobile Modal) */}
          <aside className={`
            fixed inset-0 z-50 bg-black/50 lg:bg-transparent lg:sticky lg:top-[84px] lg:self-start lg:h-[calc(100vh-84px)] lg:z-auto transition-opacity duration-300
            ${isMobileFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto'}
          `}>
            {/* Sidebar Content Container */}
            <div className={`
              fixed top-0 right-0 h-full w-[280px] bg-white shadow-xl lg:static lg:w-[230px] lg:h-auto lg:shadow-none lg:bg-transparent
              transform transition-transform duration-300
              ${isMobileFilterOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}>
              {/* Mobile Close Button */}
              <div className="lg:hidden flex justify-between items-center p-4 border-b border-[#E5E7EB] bg-white">
                <span className="font-bold text-lg">Filters</span>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-2">
                  <X size={20} />
                </button>
              </div>
              <div className="h-full overflow-y-auto">
                {sidebar}
              </div>
            </div>
          </aside>

          {/* Right Content Container */}
          <main className="flex-1 w-full min-w-0">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
};

export default ShopLayout;
