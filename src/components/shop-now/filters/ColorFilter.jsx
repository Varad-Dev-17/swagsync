import { useState } from "react";
import { ChevronUp, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ColorFilter = ({ colors = [], activeColors = [], onChange }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const displayedColors = showAll ? colors : colors.slice(0, 12);

  return (
    <div className="border-b border-[#E5E7EB] pb-5 mb-5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-slate-700 font-semibold text-[15px] mb-4"
      >
        <span>Colors</span>
        {isOpen ? <ChevronUp size={16} className="text-[#4B5563]" /> : <ChevronDown size={16} className="text-[#4B5563]" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex flex-col gap-2"
          >
            <div className="flex flex-wrap gap-3 p-1">
              {displayedColors.map((color) => {
                // Color options have displayName (e.g. "Red") and sometimes a storedValue with hex,
                // but the UI typically uses displayName for both name and to fetch a generic hex if unavailable.
                const colorName = color.displayName || color.name;
                const isActive = activeColors.includes(colorName);
                
                const toggleColor = () => {
                  if (isActive) {
                    onChange(activeColors.filter(c => c !== colorName));
                  } else {
                    onChange([...activeColors, colorName]);
                  }
                };

                const fallbackColors = {
                  "space gray": "#4A4A4C",
                  "spacegray": "#4A4A4C",
                  "silver": "#C0C0C0",
                  "starlight": "#F8F9EC",
                  "midnight": "#191924",
                  "natural silver": "#D4D4D4",
                  "quiet blue": "#4A5A70",
                  "indie black": "#1A1A1A",
                  "midnight blue": "#191970",
                  "mustard yellow": "#E1AD01",
                  "rose pink": "#FF66CC",
                  "powder blue": "#B0E0E6",
                  "mint green": "#98FF98",
                  "pastel green": "#77DD77",
                  "sky blue": "#87CEEB",
                  "olive green": "#556B2F",
                };
                
                const normalizedColor = colorName.toLowerCase().trim();
                const bgColor = color.hex || fallbackColors[normalizedColor] || normalizedColor.replace(/\s+/g, '');


                return (
                  <button
                    key={color._id || colorName}
                    title={colorName}
                    onClick={toggleColor}
                    className={`w-6 h-6 rounded-full border border-[#E5E7EB] shadow-sm hover:scale-110 transition-all flex items-center justify-center ${isActive ? 'ring-2 ring-offset-1 ring-[#FD7100]' : ''}`}
                    style={{ backgroundColor: bgColor }}
                  >
                    {isActive && <Check size={12} className={bgColor === 'white' || bgColor === '#ffffff' ? 'text-slate-700' : 'text-white'} />}
                  </button>
                );
              })}
            </div>

            {colors.length > 12 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowAll(!showAll);
                }}
                className="text-[#FD7100] text-left text-[14px] font-semibold pt-1 pl-1 hover:underline w-fit transition-all"
              >
                {showAll ? "- show less" : `+ ${colors.length - 12} more`}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ColorFilter;
