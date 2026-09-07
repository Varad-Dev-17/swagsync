import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DepartmentFilter = ({ departments = [], activeDepartment = "all", onChange }) => {
  const [showAll, setShowAll] = useState(false);

  const displayedDepartments = showAll ? departments : departments.slice(0, 5);

  return (
    <div className="border-b border-[#E5E7EB] pb-5 mb-5 mt-2">
      <div className="flex flex-col gap-3">


        {displayedDepartments.map((dept) => {
          const isActive = activeDepartment === dept.name;
          return (
            <label 
              key={dept._id} 
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => onChange && onChange(dept.name)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isActive ? 'border-[#FD7100]' : 'border-[#E5E7EB] group-hover:border-[#FD7100]'}`}>
                  {isActive && <div className="w-2 h-2 rounded-full bg-[#FD7100]" />}
                </div>
                <span className={`text-[15px] ${isActive ? 'text-[#111827] font-medium' : 'text-[#4B5563]'}`}>
                  {dept.name}
                </span>
              </div>
            </label>
          );
        })}

        {departments.length > 5 && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowAll(!showAll);
            }}
            className="text-[#FD7100] text-left text-[14px] font-semibold pt-1 pl-1 hover:underline w-fit transition-all"
          >
            {showAll ? "- show less" : `+ ${departments.length - 5} more`}
          </button>
        )}
      </div>
    </div>
  );
};

export default DepartmentFilter;
