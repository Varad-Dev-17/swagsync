import React, { useState, useEffect, useMemo } from 'react';

const ExchangeSection = ({ requestedVariantId, setRequestedVariantId, productVariants = [], currentVariantId, currentPrice, selectedQty = 1 }) => {
  const [selectedColor, setSelectedColor] = useState('');

  const isColorAttr = (attr) => {
    const name = attr.attribute?.name?.toLowerCase();
    return name === 'color' || name === 'colour' || name === 'color / shade' || name === 'shade' || attr.attribute?.fieldType === 'color';
  };

  // Check if product variants have a Color/Colour/Shade attribute
  const hasColorAttr = useMemo(() => {
    if (!productVariants || productVariants.length === 0) return false;
    return productVariants.some(v => 
      v.attributes?.some(isColorAttr)
    );
  }, [productVariants]);

  // Extract all unique colors if color attribute exists
  const colors = useMemo(() => {
    if (!hasColorAttr || !productVariants) return [];
    const colorMap = new Map();
    productVariants.forEach(variant => {
      const colorAttr = variant.attributes?.find(isColorAttr);
      const colorName = colorAttr?.option?.displayName || colorAttr?.option?.storedValue;
      if (colorName && !colorMap.has(colorName)) {
        colorMap.set(colorName, variant);
      }
    });
    return Array.from(colorMap.keys());
  }, [hasColorAttr, productVariants]);

  // When variants load, set initial color to current variant's color if possible
  useEffect(() => {
    if (colors.length > 0) {
      const currentVariant = productVariants.find(v => String(v._id) === String(currentVariantId));
      let defaultColor = colors[0];
      if (currentVariant) {
        const cAttr = currentVariant.attributes?.find(isColorAttr);
        if (cAttr?.option?.displayName) {
          defaultColor = cAttr.option.displayName;
        }
      }
      if (!selectedColor || !colors.includes(selectedColor)) {
        setSelectedColor(defaultColor);
      }
    }
  }, [colors, currentVariantId, productVariants, selectedColor]);

  // Filter variants for the selected color (or all variants if no color attribute)
  const activeColorVariants = useMemo(() => {
    if (!productVariants || productVariants.length === 0) return [];
    if (!hasColorAttr || !selectedColor) return productVariants;
    return productVariants.filter(variant => 
      variant.attributes?.some(attr => {
        const val = attr.option?.displayName || attr.option?.storedValue;
        return isColorAttr(attr) && val === selectedColor;
      })
    );
  }, [hasColorAttr, productVariants, selectedColor]);

  // Identify secondary attribute(s) (e.g. Size, Storage, RAM, etc.)
  const secondaryAttribute = useMemo(() => {
    if (!activeColorVariants || activeColorVariants.length === 0) return null;
    for (const variant of activeColorVariants) {
      const secAttr = variant.attributes?.find(attr => !isColorAttr(attr));
      if (secAttr && secAttr.attribute?.name) {
        return secAttr.attribute.name;
      }
    }
    return null;
  }, [activeColorVariants]);

  // If a color has only 1 variant with no secondary attributes (e.g. electronics like iPhone with only color options)
  useEffect(() => {
    if (hasColorAttr && selectedColor && activeColorVariants.length > 0) {
      if (!secondaryAttribute) {
        // Only 1 variant for this color, or variants differ only by color
        const targetVariant = activeColorVariants[0];
        const isCurrent = String(targetVariant._id) === String(currentVariantId);
        const isOutOfStock = targetVariant.status === 'Inactive' || targetVariant.stock <= 0;
        
        if (!isCurrent && !isOutOfStock) {
          setRequestedVariantId(targetVariant._id);
        } else if (isCurrent) {
          setRequestedVariantId('');
        }
      }
    }
  }, [hasColorAttr, selectedColor, activeColorVariants, secondaryAttribute, currentVariantId, setRequestedVariantId]);

  const qty = Number(selectedQty) || 1;
  const selectedVariant = productVariants?.find(v => String(v._id) === String(requestedVariantId));
  const currentVariant = productVariants?.find(v => String(v._id) === String(currentVariantId));
  const safeCurrentPrice = Number(currentPrice ?? currentVariant?.price ?? 0) || 0;
  const safeSelectedPrice = Number(selectedVariant?.price ?? 0) || 0;
  const totalCurrentPrice = safeCurrentPrice * qty;
  const totalSelectedPrice = safeSelectedPrice * qty;
  const priceDifference = selectedVariant ? totalSelectedPrice - totalCurrentPrice : 0;

  const getVariantAttributeList = (variant) => {
    if (!variant || !variant.attributes || variant.attributes.length === 0) return [];
    return variant.attributes.map(attr => ({
      name: attr.attribute?.name || 'Option',
      value: attr.option?.displayName || attr.option?.storedValue || 'Default'
    }));
  };

  const currAttrsList = getVariantAttributeList(currentVariant);
  const reqAttrsList = getVariantAttributeList(selectedVariant);

  return (
    <div className="space-y-6">
      {/* 1. Color Selector (if applicable) */}
      {hasColorAttr && colors.length > 0 && (
        <div>
          <label className="block text-[14px] font-bold text-slate-700 mb-3">Select Color</label>
          <div className="flex flex-wrap gap-3">
            {colors.map(color => {
              const matchingVar = productVariants.find(v => 
                v.attributes?.some(a => 
                  isColorAttr(a) &&
                  (a.option?.displayName === color || a.option?.storedValue === color)
                )
              );
              const isCurrentColor = matchingVar && String(matchingVar._id) === String(currentVariantId);
              const isOut = matchingVar && (matchingVar.status === 'Inactive' || matchingVar.stock <= 0);

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    setSelectedColor(color);
                  }}
                  className={`px-4 py-2 rounded-full border text-[14px] font-medium transition-all flex items-center gap-2 ${
                    selectedColor === color 
                      ? 'border-[#FD7100] bg-[#FFF5ED] text-[#FD7100] ring-2 ring-[#FD7100]/20 font-bold' 
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{color}</span>
                  {isCurrentColor && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                      Current
                    </span>
                  )}
                  {isOut && !isCurrentColor && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100">
                      Out of Stock
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Secondary Attribute or Variant Option Selector */}
      {secondaryAttribute ? (
        <div>
          <label className="block text-[14px] font-bold text-slate-700 mb-3">
            Select {secondaryAttribute}
          </label>
          <div className="flex flex-wrap gap-3 mt-2 pt-1">
            {activeColorVariants.map((variant) => {
              const secAttr = variant.attributes?.find(attr => {
                const name = attr.attribute?.name?.toLowerCase();
                return name !== 'color' && name !== 'colour';
              });
              const optionLabel = secAttr?.option?.displayName || secAttr?.option?.storedValue || 'Default';
              
              const isCurrent = String(variant._id) === String(currentVariantId);
              const isOutOfStock = variant.status === 'Inactive' || variant.stock <= 0;
              const isDisabled = isCurrent || isOutOfStock;
              const isSelected = String(requestedVariantId) === String(variant._id);

              return (
                <div key={variant._id} className="relative group">
                  <button
                    type="button"
                    onClick={() => !isDisabled && setRequestedVariantId(variant._id)}
                    disabled={isDisabled}
                    className={`min-w-[80px] h-[54px] rounded-lg flex flex-col items-center justify-center border transition-all px-3.5 ${
                      isSelected 
                        ? 'border-[#FD7100] bg-[#FD7100] text-white shadow-sm' 
                        : isDisabled
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[14px] font-bold leading-tight">{optionLabel}</span>
                    <span className={`text-[12px] font-medium leading-tight ${isSelected ? 'text-orange-200' : 'text-gray-500'}`}>
                      ₹{(variant.price || 0).toLocaleString("en-IN")}
                    </span>
                  </button>
                  {isDisabled && (
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-10">
                      {isCurrent ? 'Current Variant' : 'Out of Stock'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : !hasColorAttr && activeColorVariants.length > 0 ? (
        /* If product has NO color attribute at all, display all variants directly */
        <div>
          <label className="block text-[14px] font-bold text-slate-700 mb-3">
            Select Replacement Variant
          </label>
          <div className="flex flex-wrap gap-3 mt-2 pt-1">
            {activeColorVariants.map((variant) => {
              const attrsSummary = variant.attributes?.map(a => a.option?.displayName || a.option?.storedValue).join(' / ') || 'Standard';
              const isCurrent = String(variant._id) === String(currentVariantId);
              const isOutOfStock = variant.status === 'Inactive' || variant.stock <= 0;
              const isDisabled = isCurrent || isOutOfStock;
              const isSelected = String(requestedVariantId) === String(variant._id);

              return (
                <div key={variant._id} className="relative group">
                  <button
                    type="button"
                    onClick={() => !isDisabled && setRequestedVariantId(variant._id)}
                    disabled={isDisabled}
                    className={`min-w-[100px] h-[54px] rounded-lg flex flex-col items-center justify-center border transition-all px-4 ${
                      isSelected 
                        ? 'border-[#FD7100] bg-[#FD7100] text-white shadow-sm' 
                        : isDisabled
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[13px] font-bold leading-tight truncate max-w-[150px]">{attrsSummary}</span>
                    <span className={`text-[12px] font-medium leading-tight ${isSelected ? 'text-orange-200' : 'text-gray-500'}`}>
                      ₹{(variant.price || 0).toLocaleString("en-IN")}
                    </span>
                  </button>
                  {isDisabled && (
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-10">
                      {isCurrent ? 'Current Variant' : 'Out of Stock'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* 3. Selected Variant Comparison Card */}
      {selectedVariant ? (
        <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/70 shadow-2xs mt-6 space-y-4 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
            
            {/* Original Variant */}
            <div className="space-y-3 p-4 bg-white rounded-xl border border-gray-200 shadow-2xs relative">
              <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-700 text-[11px] font-bold rounded-md border border-rose-100">
                Original (Returning)
              </span>
              <div className="flex items-center gap-4 pt-1">
                {(currentVariant?.mainImage?.url || selectedVariant?.mainImage?.url) ? (
                  <img 
                    src={currentVariant?.mainImage?.url || selectedVariant?.mainImage?.url} 
                    alt="Original" 
                    className="w-16 h-20 object-cover rounded-lg border border-gray-100 shadow-2xs shrink-0" 
                    loading="lazy" 
                    decoding="async" 
                  />
                ) : (
                  <div className="w-16 h-20 rounded-lg bg-gray-100 border border-gray-200 shrink-0" />
                )}
                <div className="space-y-1">
                  <div className="text-xs text-gray-700 font-medium space-y-0.5">
                    {currAttrsList.length > 0 ? (
                      currAttrsList.map((attr, idx) => (
                        <div key={idx}>{attr.name}: <strong className="text-slate-700 font-bold">{attr.value}</strong></div>
                      ))
                    ) : (
                      <div>Item: <strong className="text-slate-700 font-bold">Current Item</strong></div>
                    )}
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
                  <img 
                    src={selectedVariant?.mainImage?.url || currentVariant?.mainImage?.url} 
                    alt="Replacement" 
                    className="w-16 h-20 object-cover rounded-lg border border-gray-100 shadow-2xs shrink-0" 
                    loading="lazy" 
                    decoding="async" 
                  />
                ) : (
                  <div className="w-16 h-20 rounded-lg bg-gray-100 border border-gray-200 shrink-0" />
                )}
                <div className="space-y-1">
                  <div className="text-xs text-gray-700 font-medium space-y-0.5">
                    {reqAttrsList.length > 0 ? (
                      reqAttrsList.map((attr, idx) => (
                        <div key={idx}>{attr.name}: <strong className="text-orange-600 font-bold">{attr.value}</strong></div>
                      ))
                    ) : (
                      <div>Item: <strong className="text-orange-600 font-bold">Selected Item</strong></div>
                    )}
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
              {priceDifference === 0 ? "No Price Difference (₹0)" : priceDifference > 0 ? `Additional Amount to Pay: +₹${priceDifference.toLocaleString("en-IN")}` : `Refund Difference: -₹${Math.abs(priceDifference).toLocaleString("en-IN")}`}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 text-xs text-amber-800 flex items-center gap-2">
          <span className="font-bold">Note:</span>
          <span>Please select an available variant above to exchange with (must be different from your current variant).</span>
        </div>
      )}
    </div>
  );
};

export default ExchangeSection;
