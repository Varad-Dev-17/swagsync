import React, { useState, useEffect, useMemo } from 'react';

const ExchangeSection = ({ requestedVariantId, setRequestedVariantId, productVariants, currentVariantId, currentPrice, selectedQty = 1 }) => {
  const [selectedColor, setSelectedColor] = useState('');
  
  // Extract all unique colors
  const colors = useMemo(() => {
    if (!productVariants) return [];
    const colorSet = new Set();
    productVariants.forEach(variant => {
      variant.attributes?.forEach(attr => {
        if (attr.attribute?.name?.toLowerCase() === 'color') {
          colorSet.add(attr.option?.displayName);
        }
      });
    });
    return Array.from(colorSet);
  }, [productVariants]);

  // When variants load, set initial color to current variant's color if possible
  useEffect(() => {
    if (colors.length > 0 && !selectedColor) {
      const currentVariant = productVariants.find(v => v._id === currentVariantId);
      let defaultColor = colors[0];
      if (currentVariant) {
        currentVariant.attributes?.forEach(attr => {
          if (attr.attribute?.name?.toLowerCase() === 'color') {
            defaultColor = attr.option?.displayName;
          }
        });
      }
      setSelectedColor(defaultColor);
    }
  }, [colors, currentVariantId, productVariants, selectedColor]);

  // Filter variants for the selected color
  const colorVariants = useMemo(() => {
    if (!selectedColor || !productVariants) return [];
    return productVariants.filter(variant => 
      variant.attributes?.some(attr => 
        attr.attribute?.name?.toLowerCase() === 'color' && 
        attr.option?.displayName === selectedColor
      )
    );
  }, [productVariants, selectedColor]);

  const qty = Number(selectedQty) || 1;
  const selectedVariant = productVariants?.find(v => v._id === requestedVariantId);
  const currentVariant = productVariants?.find(v => v._id === currentVariantId);
  const safeCurrentPrice = Number(currentPrice ?? currentVariant?.price ?? 0) || 0;
  const safeSelectedPrice = Number(selectedVariant?.price ?? 0) || 0;
  const totalCurrentPrice = safeCurrentPrice * qty;
  const totalSelectedPrice = safeSelectedPrice * qty;
  const priceDifference = selectedVariant ? totalSelectedPrice - totalCurrentPrice : 0;

  const getAttributes = (variant) => {
    let color = '';
    let size = '';
    variant?.attributes?.forEach(attr => {
      if (attr.attribute?.name?.toLowerCase() === 'color') color = attr.option?.displayName;
      if (attr.attribute?.name?.toLowerCase() === 'size') size = attr.option?.displayName;
    });
    return { color, size };
  };

  const currAttrs = getAttributes(currentVariant);
  const reqAttrs = getAttributes(selectedVariant);

  return (
    <div className="space-y-6">
      {colors.length > 0 && (
        <div>
          <label className="block text-[14px] font-bold text-slate-700 mb-3">Select Color</label>
          <div className="flex flex-wrap gap-3">
            {colors.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  setSelectedColor(color);
                  setRequestedVariantId(''); // Reset size selection when color changes
                }}
                className={`px-4 py-2 rounded-full border text-[14px] font-medium transition-colors ${
                  selectedColor === color 
                    ? 'border-[#FD7100] bg-[#FFF5ED] text-[#FD7100]' 
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-[14px] font-bold text-slate-700 mb-3">Select Size</label>
        <div className="flex flex-wrap gap-3 mt-2 pt-1">
          {colorVariants.length > 0 ? (
            colorVariants.map((variant) => {
              let size = '';
              variant.attributes?.forEach(attr => {
                if (attr.attribute?.name?.toLowerCase() === 'size') {
                  size = attr.option?.displayName;
                }
              });
              
              if (!size) return null; // Fallback if no size attribute

              const isCurrent = variant._id === currentVariantId;
              const isOutOfStock = variant.status === 'Inactive' || variant.stock <= 0;
              const isDisabled = isCurrent || isOutOfStock;

              return (
                <div key={variant._id} className="relative group">
                  <button
                    type="button"
                    onClick={() => !isDisabled && setRequestedVariantId(variant._id)}
                    disabled={isDisabled}
                    className={`min-w-[70px] h-[52px] rounded-lg flex flex-col items-center justify-center border transition-colors px-3 ${
                      requestedVariantId === variant._id 
                        ? 'border-[#FD7100] bg-[#FD7100] text-white' 
                        : isDisabled
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-[14px] font-bold leading-tight">{size}</span>
                    <span className={`text-[12px] font-medium leading-tight ${requestedVariantId === variant._id ? 'text-orange-200' : 'text-gray-500'}`}>₹{variant.price}</span>
                  </button>
                  {/* Tooltip for disabled reasons */}
                  {isDisabled && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-10">
                      {isCurrent ? 'Current Variant' : 'Out of Stock'}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-[13px] text-gray-500">No options available.</p>
          )}
        </div>
      </div>

      {selectedVariant && (
        <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/70 shadow-2xs mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
            
            {/* Original Variant */}
            <div className="space-y-3 p-4 bg-white rounded-xl border border-gray-200 shadow-2xs relative">
              <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-700 text-[11px] font-bold rounded-md border border-rose-100">
                Original (Returning)
              </span>
              <div className="flex items-center gap-4 pt-1">
                {(currentVariant?.mainImage?.url || selectedVariant?.mainImage?.url) ? (
                  <img src={currentVariant?.mainImage?.url || selectedVariant?.mainImage?.url} alt="Original" className="w-16 h-20 object-cover rounded-lg border border-gray-100 shadow-2xs shrink-0"  loading="lazy" decoding="async" />
                ) : (
                  <div className="w-16 h-20 rounded-lg bg-gray-100 border border-gray-200 shrink-0" />
                )}
                <div className="space-y-1">
                  <div className="text-xs text-gray-700 font-medium space-y-0.5">
                    {currAttrs.color && <div>Color: <strong className="text-slate-700 font-bold">{currAttrs.color}</strong></div>}
                    {currAttrs.size && <div>Size: <strong className="text-slate-700 font-bold">{currAttrs.size}</strong></div>}
                  </div>
                  <div className="text-sm font-bold text-[#FD7100] font-mono pt-1">
                    ₹{totalCurrentPrice.toLocaleString("en-IN")}
                    {qty > 1 && <span className="text-[11px] font-normal text-slate-500 ml-1">({qty} × ₹{safeCurrentPrice.toLocaleString("en-IN")})</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Arrow divider on wide screens */}
            <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#FD7100] text-white items-center justify-center z-10 shadow-lg border-2 border-white">
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>

            {/* New Requested Variant */}
            <div className="space-y-3 p-4 bg-white rounded-xl border border-[#FD7100]/30 ring-2 ring-[#FD7100]/10 shadow-sm">
              <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-md border border-emerald-100">
                Requested Replacement
              </span>
              <div className="flex items-center gap-4 pt-1">
                {(selectedVariant?.mainImage?.url || currentVariant?.mainImage?.url) ? (
                  <img src={selectedVariant?.mainImage?.url || currentVariant?.mainImage?.url} alt="Replacement" className="w-16 h-20 object-cover rounded-lg border border-gray-100 shadow-2xs shrink-0"  loading="lazy" decoding="async" />
                ) : (
                  <div className="w-16 h-20 rounded-lg bg-gray-100 border border-gray-200 shrink-0" />
                )}
                <div className="space-y-1">
                  <div className="text-xs text-gray-700 font-medium space-y-0.5">
                    {reqAttrs.color && <div>Color: <strong className="text-orange-600 font-bold">{reqAttrs.color}</strong></div>}
                    {reqAttrs.size && <div>Size: <strong className="text-orange-600 font-bold">{reqAttrs.size}</strong></div>}
                  </div>
                  <div className="text-sm font-bold text-[#FD7100] font-mono pt-1">
                    ₹{totalSelectedPrice.toLocaleString("en-IN")}
                    {qty > 1 && <span className="text-[11px] font-normal text-slate-500 ml-1">({qty} × ₹{safeSelectedPrice.toLocaleString("en-IN")})</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price difference banner across bottom */}
          <div className="pt-3 border-t border-gray-200/80 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5 text-slate-600">
              Exchange Type: <strong className="text-slate-700 capitalize">{priceDifference === 0 ? "No Difference" : priceDifference > 0 ? "Additional Payment" : "Refund Difference"}</strong>
            </span>
            <span className={`px-3 py-1 rounded-lg font-mono font-bold text-sm ${
              priceDifference === 0 ? "bg-gray-100 text-gray-600" : priceDifference > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
            }`}>
              {priceDifference === 0 ? "No Price Difference (₹0)" : priceDifference > 0 ? `Additional Amount to Pay: +₹${priceDifference}` : `Refund Difference: -₹${Math.abs(priceDifference)}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeSection;
