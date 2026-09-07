import React from 'react';

const ActionSelector = ({ action, setAction }) => {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-3">Action Required</label>
      <div className="flex flex-wrap gap-3">
        <label 
          className={`flex items-center gap-2 px-5 py-2.5 border rounded-lg cursor-pointer transition-colors ${
            action === 'return' 
              ? 'border-[#FD7100] bg-[#FFF5ED] text-[#FD7100]' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <input 
            type="radio" 
            name="action" 
            value="return" 
            checked={action === 'return'} 
            onChange={() => setAction('return')} 
            className="w-4 h-4 text-[#FD7100] focus:ring-[#FD7100] border-gray-300" 
          />
          <span className="text-[14px] font-bold">Return</span>
        </label>
        
        <label 
          className={`flex items-center gap-2 px-5 py-2.5 border rounded-lg cursor-pointer transition-colors ${
            action === 'exchange' 
              ? 'border-[#FD7100] bg-[#FFF5ED] text-[#FD7100]' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <input 
            type="radio" 
            name="action" 
            value="exchange" 
            checked={action === 'exchange'} 
            onChange={() => setAction('exchange')} 
            className="w-4 h-4 text-[#FD7100] focus:ring-[#FD7100] border-gray-300" 
          />
          <span className="text-[14px] font-bold">Exchange</span>
        </label>
      </div>
    </div>
  );
};

export default ActionSelector;
