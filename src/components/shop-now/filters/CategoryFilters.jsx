import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CategoryFilters = ({ categories = [], activeCategory = "all", onChange }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const displayedCategories = showAll ? categories : categories.slice(0, 5);

  return (
    <div className="border-b border-[#E5E7EB] pb-5 mb-5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-[#111827] font-semibold text-[15px] mb-4"
      >
        <span>Categories</span>
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


            {displayedCategories.map((cat) => {
              const isActive = activeCategory === cat.name;
              return (
                <label 
                  key={cat._id} 
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => onChange && onChange(cat.name)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isActive ? 'border-[#FD7100]' : 'border-[#E5E7EB] group-hover:border-[#FD7100]'}`}>
                      {isActive && <div className="w-2 h-2 rounded-full bg-[#FD7100]" />}
                    </div>
                    <span className={`text-[15px] ${isActive ? 'text-[#111827] font-medium' : 'text-[#4B5563]'}`}>
                      {cat.name}
                    </span>
                  </div>
                  {cat.count !== null && cat.count !== undefined && (
                    <span className="text-[13px] text-[#9CA3AF]">({cat.count})</span>
                  )}
                </label>
              );
            })}

            {categories.length > 5 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowAll(!showAll);
                }}
                className="text-[#FD7100] text-left text-[14px] font-semibold pt-1 pl-1 hover:underline w-fit transition-all"
              >
                {showAll ? "- show less" : `+ ${categories.length - 5} more`}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryFilters;
