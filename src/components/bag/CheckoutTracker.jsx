import React from 'react';
import { Link } from 'react-router-dom';

const CheckoutTracker = ({ currentStep }) => {
  const steps = [
    { id: 'bag', label: 'BAG', path: '/bag' },
    { id: 'address', label: 'ADDRESS', path: '/checkout/address' },
    { id: 'payment', label: 'PAYMENT', path: '/checkout/payment' },
  ];

  const getStepIndex = (id) => steps.findIndex((step) => step.id === id);
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="w-full flex justify-center items-center py-1 sm:py-2">
      <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isPast = index < currentIndex;
          const isClickable = isPast || isActive;

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div className="flex flex-col items-center">
                {isClickable ? (
                  <Link
                    to={step.path}
                    className={`text-[12px] sm:text-[14px] font-bold tracking-widest pb-1 border-b-2 transition-colors ${
                      isActive
                        ? 'text-[#03a685] border-[#03a685]'
                        : 'text-[#535766] border-transparent hover:text-[#03a685]'
                    }`}
                  >
                    {step.label}
                  </Link>
                ) : (
                  <span
                    className={`text-[12px] sm:text-[14px] font-bold tracking-widest pb-1 border-b-2 border-transparent text-[#7e818c]`}
                  >
                    {step.label}
                  </span>
                )}
              </div>

              {/* Dotted Divider */}
              {index < steps.length - 1 && (
                <div
                  className={`w-8 sm:w-12 md:w-16 border-t-2 border-dashed ${
                    index < currentIndex ? 'border-[#03a685]' : 'border-gray-300'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default CheckoutTracker;
