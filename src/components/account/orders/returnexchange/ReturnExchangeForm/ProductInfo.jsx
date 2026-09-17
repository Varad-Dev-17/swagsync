import React from 'react';

const ProductInfo = ({ product, variant, quantity, selectedQty, onQtyChange, price, color, size, attributes = [] }) => {
  const maxQty = Number(quantity || 1);
  const currentQty = Number(selectedQty || maxQty);

  // Compute display attributes
  const displayAttributes = attributes.length > 0 
    ? attributes.map(a => ({
        name: a.attribute?.name || 'Option',
        value: a.option?.displayName || a.option?.storedValue || a.option || 'Default'
      }))
    : [
        ...(color ? [{ name: 'Color', value: color }] : []),
        ...(size ? [{ name: 'Size', value: size }] : [])
      ];

  return (
    <div className="flex gap-6 items-start">
      <div className="w-24 h-32 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-200 shadow-2xs">
        {(variant?.mainImage?.url || product?.images?.[0]?.url) ? (
          <img 
            src={variant?.mainImage?.url || product?.images?.[0]?.url} 
            alt={product?.title || 'Product'} 
            className="w-full h-full object-cover"
            loading="lazy" 
            decoding="async" 
          />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
      </div>
      <div className="flex-1 pt-1">
        {product?.brand?.name && <h3 className="font-bold text-slate-700 text-[14px] uppercase tracking-wider">{product.brand.name}</h3>}
        {product?.title && <p className="text-gray-600 text-[15px] mt-1 font-semibold">{product.title}</p>}
        <div className="text-gray-500 text-[14px] mt-3 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-x-6 gap-y-2">
          {displayAttributes.map((attr, idx) => (
            <span key={idx}>
              {attr.name}: <span className="font-medium text-slate-700">{attr.value}</span>
            </span>
          ))}
          {maxQty <= 1 ? (
            <span>Qty: <span className="font-medium text-slate-700">1</span></span>
          ) : (
            <div className="flex items-center gap-2 bg-orange-50/70 p-1.5 px-3 rounded-lg border border-orange-100">
              <span className="text-xs font-bold text-orange-950">Claim Quantity:</span>
              <select
                value={currentQty}
                onChange={(e) => onQtyChange?.(Number(e.target.value))}
                className="border border-orange-200 rounded px-2 py-0.5 bg-white text-xs font-extrabold text-[#FD7100] focus:outline-none focus:ring-1 focus:ring-[#FD7100] cursor-pointer shadow-2xs"
              >
                {Array.from({ length: maxQty }, (_, i) => i + 1).map((q) => (
                  <option key={q} value={q}>
                    {q} {q === 1 ? "unit" : "units"}
                  </option>
                ))}
              </select>
              <span className="text-[11px] font-medium text-orange-700">(of {maxQty} purchased)</span>
            </div>
          )}
        </div>
        {price && (
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-[16px] font-bold font-mono text-slate-700">₹{(price * currentQty).toLocaleString("en-IN")}</p>
            {currentQty > 1 && <span className="text-xs text-gray-500 font-medium font-mono">({currentQty} × ₹{price.toLocaleString("en-IN")})</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductInfo;
