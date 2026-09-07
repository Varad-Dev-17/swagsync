import { useState } from "react";
import { ChevronUp, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BrandFilter = ({ brands = [], activeBrands = [], onChange }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const displayedBrands = showAll ? brands : brands.slice(0, 5);

  return (
    <div className="border-b border-[#E5E7EB] pb-5 mb-5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-[#111827] font-semibold text-[15px] mb-4"
      >
        <span>Brands</span>
        {isOpen ? <ChevronUp size={16} className="text-[#4B5563]" /> : <ChevronDown size={16} className="text-[#4B5563]" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex flex-col gap-3"
          >
            {displayedBrands.map((brand) => {
              const isActive = activeBrands.includes(brand.name);
              
              const toggleBrand = () => {
                if (isActive) {
                  onChange(activeBrands.filter(b => b !== brand.name));
                } else {
                  onChange([...activeBrands, brand.name]);
                }
              };

              return (
                <label 
                  key={brand._id} 
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleBrand();
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isActive ? 'bg-[#FD7100] border-[#FD7100]' : 'border-[#E5E7EB] group-hover:border-[#FD7100]'}`}>
                      {isActive && <Check size={12} className="text-white" />}
                    </div>
                    <span className={`text-[15px] transition-colors ${isActive ? 'text-[#111827] font-medium' : 'text-[#4B5563] group-hover:text-[#111827]'}`}>
                      {brand.name}
                    </span>
                  </div>
                </label>
              );
            })}

            {brands.length > 5 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowAll(!showAll);
                }}
                className="text-[#FD7100] text-left text-[14px] font-semibold pt-1 pl-1 hover:underline w-fit transition-all"
              >
                {showAll ? "- show less" : `+ ${brands.length - 5} more`}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrandFilter;
