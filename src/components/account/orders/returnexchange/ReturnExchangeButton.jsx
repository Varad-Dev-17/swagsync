import React from "react";
import { useNavigate } from "react-router-dom";
import { Undo2, Clock, CheckCircle2, ArrowRight } from "lucide-react";

const ReturnExchangeButton = ({ orderId, productId, item, eligibility, onClick }) => {
  const navigate = useNavigate();

  const handleReturnExchange = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    } else {
      navigate(`/account/orders/${orderId}/return/${productId}`, { state: { orderItem: item } });
    }
  };

  if (!eligibility) return null;

  const { showButton, buttonLabel, helperMessage, hasReturnRequest } = eligibility;

  return (
    <div className="w-full flex flex-col items-stretch text-left">
      {showButton ? (
        hasReturnRequest ? (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/account/orders/${orderId}`, { state: { scrollToTracking: true } });
            }}
            className="w-full py-2 px-3 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer flex items-center justify-between gap-2 text-[12px] uppercase font-bold tracking-wide group"
          >
            <span className="text-gray-600 font-normal truncate">
              Status: <span className="font-bold text-[#FD7100] uppercase">{eligibility.activeRequest?.status || helperMessage?.replace("Status: ", "") || "received"}</span>
            </span>
            <span className="text-[#FD7100] font-bold text-[12px] group-hover:underline flex items-center gap-0.5 shrink-0">
              Track <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        ) : (
          <div className="w-full flex flex-col">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReturnExchange(e);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-bold uppercase tracking-wider text-[#FD7100] border border-[#FD7100]/40 hover:bg-[#FFF5ED] hover:border-[#FD7100] transition-colors cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5 text-[#FD7100] shrink-0" />
              <span>{buttonLabel || "Return / Exchange"}</span>
            </button>
            {helperMessage && (
              <p className="text-[11px] text-green-700 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-700 shrink-0" />
                <span>{helperMessage}</span>
              </p>
            )}
          </div>
        )
      ) : helperMessage ? (
        <div className="w-full py-2 px-3 bg-gray-50 border border-gray-200 text-center">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold">
            {helperMessage}
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default ReturnExchangeButton;

