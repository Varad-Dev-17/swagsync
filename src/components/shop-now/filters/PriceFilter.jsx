import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PriceFilter = ({ priceRange = { min: "", max: "" }, onChange }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const minAllowed = 0;
  const maxAllowed = 10000;
  
  const [localMin, setLocalMin] = useState(priceRange.min !== "" ? Number(priceRange.min) : minAllowed);
  const [localMax, setLocalMax] = useState(priceRange.max !== "" ? Number(priceRange.max) : maxAllowed);

  useEffect(() => {
    setLocalMin(priceRange.min !== "" ? Number(priceRange.min) : minAllowed);
    setLocalMax(priceRange.max !== "" ? Number(priceRange.max) : maxAllowed);
  }, [priceRange]);

  const handleMinChange = (e) => {
    const value = Math.min(Number(e.target.value), localMax - 100);
    setLocalMin(value);
  };

  const handleMaxChange = (e) => {
    const value = Math.max(Number(e.target.value), localMin + 100);
    setLocalMax(value);
  };

  const handleApply = () => {
    onChange({ min: localMin, max: localMax });
  };

  // Calculate percentages for track fill
  const minPercent = ((localMin - minAllowed) / (maxAllowed - minAllowed)) * 100;
  const maxPercent = ((localMax - minAllowed) / (maxAllowed - minAllowed)) * 100;

  return (
    <div className="pb-5 mb-5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-[#111827] font-semibold text-[15px] mb-4"
      >
        <span>Price Range</span>
        {isOpen ? <ChevronUp size={16} className="text-[#4B5563]" /> : <ChevronDown size={16} className="text-[#4B5563]" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 pb-2 px-1 relative">
              {/* Custom Track Background */}
              <div className="absolute top-1/2 left-1 right-1 h-1 bg-[#E5E7EB] rounded-full -translate-y-1/2 pointer-events-none" />
              
              {/* Active Track */}
              <div 
                className="absolute top-1/2 h-1 bg-[#FD7100] rounded-full -translate-y-1/2 pointer-events-none"
                style={{ left: `calc(${minPercent}% + 4px)`, width: `${maxPercent - minPercent}%` }}
              />

              {/* Min Slider */}
              <input 
                type="range"
                min={minAllowed}
                max={maxAllowed}
                step={100}
                value={localMin}
                onChange={handleMinChange}
                onMouseUp={handleApply}
                onTouchEnd={handleApply}
                className="absolute top-1/2 left-0 w-full -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#FD7100] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer z-10"
              />

              {/* Max Slider */}
              <input 
                type="range"
                min={minAllowed}
                max={maxAllowed}
                step={100}
                value={localMax}
                onChange={handleMaxChange}
                onMouseUp={handleApply}
                onTouchEnd={handleApply}
                className="absolute top-1/2 left-0 w-full -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#FD7100] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer z-20"
              />
            </div>
            
            <div className="flex items-center justify-between mt-6 px-1">
              <span className="text-[13px] font-semibold text-[#111827]">₹{localMin}</span>
              <span className="text-[13px] font-semibold text-[#111827]">₹{localMax}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PriceFilter;
