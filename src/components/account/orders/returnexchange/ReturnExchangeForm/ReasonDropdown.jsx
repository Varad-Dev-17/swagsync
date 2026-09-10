import React from 'react';
import { ChevronDown } from 'lucide-react';

const ReasonDropdown = ({ reason, setReason }) => {
  const reasons = [
    "Damaged or Defective Product",
    "Wrong Item Received",
    "Size / Fit Issue",
    "Color Mismatch",
    "Quality Not as Expected",
    "Missing Items / Accessories",
    "Other"
  ];

  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">Reason</label>
      <div className="relative">
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full appearance-none border border-gray-300 rounded-lg px-4 py-2.5 text-[14px] text-slate-700 focus:outline-none focus:border-[#FD7100] focus:ring-1 focus:ring-[#FD7100] bg-white transition-colors cursor-pointer"
        >
          <option value="" disabled>Select a reason</option>
          {reasons.map((r, i) => (
            <option key={i} value={r}>{r}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

export default ReasonDropdown;
