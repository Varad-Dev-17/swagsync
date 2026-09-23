import React, { useState, useMemo } from 'react';
import { ShoppingBag, Heart, CreditCard, RotateCcw, Banknote, Truck, Award, ShieldCheck, Star } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axiosConfig';
import { useCart } from '../../context/CartContext';
import SizeChartModal from './SizeChartModal';
import ProductReviewsSection from './ProductReviewsSection';

const ProductInfo = ({ product, activeVariant, onVariantChange }) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { updateCartCount, isVariantInCart, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  if (!product || !activeVariant) return null;

  const inBag = isVariantInCart(activeVariant._id);

  const handleAddToBag = async () => {
    if (!user) {
      navigate("/signin", { state: { from: location } });
      return;
    }
    if (inBag) {
      navigate("/bag");
      return;
    }
    try {
      const res = await api.post("/cart", {
        productId: product._id,
        variantId: activeVariant._id,
        quantity: 1,
      });
      if (res.data.success) {
        updateCartCount(res.data.data.itemCount);
        refreshCart();
        toast.success("Added to bag!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to bag");
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      navigate("/signin", { state: { from: location } });
      return;
    }
    if (inBag) {
      navigate("/checkout/address");
      return;
    }
    try {
      const res = await api.post("/cart", {
        productId: product._id,
        variantId: activeVariant._id,
        quantity: 1,
      });
      if (res.data.success) {
        updateCartCount(res.data.data.itemCount);
        refreshCart();
        navigate("/checkout/address");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to proceed to checkout");
    }
  };

  // Formatter for INR
  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Pricing
  const price = activeVariant.price || 0;
  const mrp = activeVariant.mrp || 0;
  let discount = 0;
  if (mrp > price && mrp > 0) {
    discount = Math.round(((mrp - price) / mrp) * 100);
  }

  // Color / Shade / Fragrance Variants Mapping
  const isColorAttribute = (a) => {
    const name = a.attribute?.name?.toLowerCase();
    return name === 'color' || name === 'colour' || name === 'color / shade' || name === 'shade' || name === 'fragrance / scent' || name === 'fragrance' || name === 'scent' || a.attribute?.fieldType === 'color';
  };

  const colorVariantsMap = new Map();
  product.variants?.forEach(v => {
    const colorAttr = v.attributes?.find(isColorAttribute);
    if (colorAttr) {
      const colorName = colorAttr?.option?.displayName || colorAttr?.option?.storedValue;
      if (colorName && !colorVariantsMap.has(colorName)) {
        colorVariantsMap.set(colorName, v);
      }
    }
  });
  const uniqueColorVariants = Array.from(colorVariantsMap.values());
  const hasColorAttribute = uniqueColorVariants.length > 0;

  // Helper to construct return policy display text from DB
  const getReturnPolicyText = () => {
    const policy = product?.returnPolicy;
    if (!policy) return "7 Days Return & Exchange";
    const days = policy.returnDays || 7;
    if (policy.returnable && policy.exchangeable) return `${days} Days Return & Exchange`;
    if (policy.returnable) return `${days} Days Return`;
    if (policy.exchangeable) return `${days} Days Exchange`;
    return "No Return or Exchange";
  };

  const trustBadges = [
    { icon: RotateCcw, title: getReturnPolicyText() },
    { icon: Banknote, title: "Cash on Delivery" },
    { icon: Truck, title: "Free Delivery Above ₹1000" },
    { icon: Award, title: "Top Brand" },
    { icon: ShieldCheck, title: "Secure Transaction" },
  ];

  const activeColorAttr = activeVariant.attributes?.find(isColorAttribute) || uniqueColorVariants[0]?.attributes?.find(isColorAttribute);
  const activeColorName = activeColorAttr?.option?.displayName || activeColorAttr?.option?.storedValue || '';

  // Variants Mapping for the Active Color (or all variants if product has no color attribute)
  const variantsOfActiveColor = useMemo(() => {
    if (!hasColorAttribute) return product.variants || [];
    return product.variants?.filter(v => {
      const cAttr = v.attributes?.find(isColorAttribute);
      if (!cAttr) return false;
      const cName = cAttr?.option?.displayName || cAttr?.option?.storedValue;
      return cName === activeColorName;
    }) || [];
  }, [product.variants, hasColorAttribute, activeColorName]);

  // Group all non-color attributes dynamically (e.g. RAM, Storage, Size, etc.)
  const secondaryAttributeGroups = useMemo(() => {
    const groupsMap = new Map();

    variantsOfActiveColor.forEach(v => {
      v.attributes?.forEach(attr => {
        if (isColorAttribute(attr)) return;

        const attrName = attr.attribute?.name;
        if (!attrName) return;

        const optName = attr.option?.displayName || attr.option?.storedValue;
        if (!optName) return;

        if (!groupsMap.has(attrName)) {
          groupsMap.set(attrName, {
            name: attrName,
            optionsMap: new Map(),
          });
        }

        const group = groupsMap.get(attrName);
        if (!group.optionsMap.has(optName)) {
          group.optionsMap.set(optName, {
            name: optName,
            stock: v.stock || 0,
            variantId: v._id,
            status: v.status,
          });
        } else {
          const existing = group.optionsMap.get(optName);
          existing.stock += (v.stock || 0);
        }
      });
    });

    return Array.from(groupsMap.values()).map(g => ({
      name: g.name,
      options: Array.from(g.optionsMap.values()),
    }));
  }, [variantsOfActiveColor]);

  // Handler for selecting an attribute option dynamically
  const handleAttributeOptionChange = (targetAttrName, targetOptName) => {
    const matchingVariants = variantsOfActiveColor.filter(v => 
      v.attributes?.some(a => 
        a.attribute?.name?.toLowerCase() === targetAttrName.toLowerCase() && 
        (a.option?.displayName === targetOptName || a.option?.storedValue === targetOptName)
      )
    );

    if (matchingVariants.length === 0) return;

    // Pick the variant that matches the maximum other active attributes
    const bestMatch = matchingVariants.sort((a, b) => {
      const scoreA = a.attributes?.filter(attrA => 
        activeVariant.attributes?.some(act => 
          act.attribute?.name === attrA.attribute?.name && 
          (act.option?._id === attrA.option?._id || act.option?.displayName === attrA.option?.displayName)
        )
      ).length || 0;

      const scoreB = b.attributes?.filter(attrB => 
        activeVariant.attributes?.some(act => 
          act.attribute?.name === attrB.attribute?.name && 
          (act.option?._id === attrB.option?._id || act.option?.displayName === attrB.option?.displayName)
        )
      ).length || 0;

      return scoreB - scoreA;
    })[0];

    if (bestMatch) {
      onVariantChange(bestMatch._id);
    }
  };

  // Handler for selecting a color / shade dynamically (preserving secondary attributes if possible)
  const handleColorChange = (targetVariant) => {
    const targetColorAttr = targetVariant.attributes?.find(isColorAttribute);
    const targetColorName = targetColorAttr?.option?.displayName || targetColorAttr?.option?.storedValue;

    if (!targetColorName) {
      onVariantChange(targetVariant._id);
      return;
    }

    const variantsWithColor = product.variants?.filter(v => {
      const cAttr = v.attributes?.find(isColorAttribute);
      const cName = cAttr?.option?.displayName || cAttr?.option?.storedValue;
      return cName === targetColorName;
    }) || [];

    if (variantsWithColor.length === 0) {
      onVariantChange(targetVariant._id);
      return;
    }

    const bestMatch = variantsWithColor.sort((a, b) => {
      const scoreA = a.attributes?.filter(attrA => 
        !isColorAttribute(attrA) &&
        activeVariant.attributes?.some(act => 
          act.attribute?.name === attrA.attribute?.name && 
          (act.option?._id === attrA.option?._id || act.option?.displayName === attrA.option?.displayName || act.option?.storedValue === attrA.option?.storedValue)
        )
      ).length || 0;

      const scoreB = b.attributes?.filter(attrB => 
        !isColorAttribute(attrB) &&
        activeVariant.attributes?.some(act => 
          act.attribute?.name === attrB.attribute?.name && 
          (act.option?._id === attrB.option?._id || act.option?.displayName === attrB.option?.displayName || act.option?.storedValue === attrB.option?.storedValue)
        )
      ).length || 0;

      return scoreB - scoreA;
    })[0];

    onVariantChange(bestMatch ? bestMatch._id : targetVariant._id);
  };

  // Combine product-level attributes and active variant attributes for Specifications
  const allSpecifications = useMemo(() => {
    const specsMap = new Map();

    // 1. Add product-level attributes (e.g. Processor, Display Size, OS, Material, Fit, etc.)
    if (Array.isArray(product.attributes)) {
      product.attributes.forEach(attr => {
        const name = attr.attribute?.name;
        if (name && Array.isArray(attr.values) && attr.values.length > 0) {
          const valStr = attr.values.map(val => {
            if (!val) return '';
            let clean = val;
            const attrName = name.toLowerCase();
            if (attrName.includes('material') || attrName.includes('fabric')) {
              clean = clean.replace(/(\d+)-/g, '$1% ');
            }
            return clean.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          }).filter(Boolean).join(', ');
          
          if (valStr) {
            specsMap.set(name.toLowerCase(), { name, value: valStr });
          }
        }
      });
    }

    // 2. Add active variant attributes (e.g. Color, RAM, Storage, Size, etc.)
    if (Array.isArray(activeVariant.attributes)) {
      activeVariant.attributes.forEach(attr => {
        const name = attr.attribute?.name;
        const val = attr.option?.displayName || attr.option?.storedValue;
        if (name && val && !specsMap.has(name.toLowerCase())) {
          specsMap.set(name.toLowerCase(), { name, value: val });
        }
      });
    }

    return Array.from(specsMap.values());
  }, [product.attributes, activeVariant.attributes]);

  return (
    <div className="flex flex-col">
      {/* Brand, Title & Wishlist Icon */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#282c3f] mb-1">{product.brand?.name || product.brand || 'SwagSync'}</h1>
          <h2 className="text-[18px] text-[#535766] font-normal leading-relaxed">{product.title}</h2>
          <div 
            onClick={() => {
              const el = document.getElementById("product-reviews-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 mt-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-md text-[13px] font-bold text-[#282c3f] cursor-pointer shadow-2xs transition-all group"
          >
            <span className="flex items-center gap-1 text-[#282c3f] font-extrabold">
              {product.ratingAverage ? Number(product.ratingAverage).toFixed(1).replace(/\.0$/, '') : "New"} 
              <Star size={14} className="fill-[#FFB800] text-[#FFB800]" />
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-[#535766] font-medium group-hover:text-[#FD7100] transition-colors">
              {product.ratingCount ? `${product.ratingCount} ${product.ratingCount === 1 ? 'Review' : 'Reviews'}` : "Write the first review"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            if (!user) {
              navigate("/signin", { state: { from: location } });
              return;
            }
            const wasWishlisted = isInWishlist(product._id, activeVariant._id);
            const res = await toggleWishlist(product._id, activeVariant._id);
            if (!res?.success && res?.message) {
               toast.error(res.message);
            } else if (res?.success) {
               toast.success(wasWishlisted ? "Removed from wishlist" : "Added to wishlist");
            }
          }}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 shadow-sm flex-shrink-0 cursor-pointer hover:scale-105 mt-[30px] ${
            isInWishlist(product._id, activeVariant._id)
              ? "border-[#f23661] bg-[#fff0f4] text-[#f23661]"
              : "border-[#d4d5d9] bg-white text-[#535766] hover:border-[#f23661] hover:text-[#f23661]"
          }`}
          title={isInWishlist(product._id, activeVariant._id) ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart 
            size={16} 
            className="transition-colors"
            fill={isInWishlist(product._id, activeVariant._id) ? "currentColor" : "none"} 
            strokeWidth={2} 
          />
        </button>
      </div>

      <div className="border-b border-[#eaeaec] mb-4" />

      {/* Pricing */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2.5 mb-1">
          <span className="text-[20px] font-bold text-[#282c3f]">{formatPrice(price)}</span>
          {mrp > price && (
            <>
              <span className="text-[18px] text-[#7e818c] font-normal">
                MRP <span className="line-through">{formatPrice(mrp)}</span>
              </span>
              <span className="text-[18px] font-bold text-[#ff905a]">({discount}% OFF)</span>
            </>
          )}
        </div>
      </div>

      {/* Select Color / Shade */}
      {hasColorAttribute && (
        <div className="mb-6">
          <h4 className="text-[13px] font-bold text-[#282c3f] uppercase tracking-wide mb-2.5">
            Select {activeColorAttr?.attribute?.name || uniqueColorVariants[0]?.attributes?.find(isColorAttribute)?.attribute?.name || 'Color'}
          </h4>
          <div className="flex flex-wrap gap-4">
            {uniqueColorVariants.map((v) => {
              const cAttr = v.attributes?.find(isColorAttribute);
              const cName = cAttr?.option?.displayName || cAttr?.option?.storedValue || 'default';
              const isSelected = cName === activeColorName;
              return (
                <button
                  key={v._id}
                  type="button"
                  onClick={() => handleColorChange(v)}
                  className="flex flex-col items-center gap-1.5 focus:outline-none group cursor-pointer"
                  title={cName}
                >
                  <div className={`relative w-14 h-18 rounded overflow-hidden border-2 transition-all ${isSelected ? 'border-[#FD7100]' : 'border-transparent group-hover:border-[#d4d5d9]'}`}>
                    <img 
                      src={v.mainImage?.url || product.images?.[0]?.url} 
                      alt={cName} 
                      className="w-full h-full object-cover" 
                      loading="lazy" 
                      decoding="async" 
                    />
                  </div>
                  <span className={`text-[11px] font-semibold transition-colors ${isSelected ? 'text-[#FD7100]' : 'text-gray-500 group-hover:text-gray-800'}`}>
                    {cName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Secondary Attribute Selectors (RAM, Storage, Size, etc.) */}
      {secondaryAttributeGroups.map((group) => {
        const isSize = group.name.toLowerCase() === 'size';
        const activeOption = activeVariant.attributes?.find(a => 
          a.attribute?.name?.toLowerCase() === group.name.toLowerCase()
        );
        const activeOptionName = activeOption?.option?.displayName || activeOption?.option?.storedValue;

        return (
          <div key={group.name} className="mb-6">
            <div className="mb-3 flex items-center gap-14">
              <h4 className="text-[13px] font-bold text-[#282c3f] uppercase tracking-wide">
                Select {group.name}
              </h4>
              {isSize && (
                <button
                  type="button"
                  onClick={() => setIsSizeChartOpen(true)}
                  className="text-[12px] font-bold text-[#FD7100] hover:underline transition-all cursor-pointer uppercase tracking-wide"
                >
                  View Size Chart
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {group.options.map((opt) => {
                const isSelected = activeOptionName === opt.name;
                const isOutOfStock = opt.stock <= 0;

                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => !isOutOfStock && handleAttributeOptionChange(group.name, opt.name)}
                    disabled={isOutOfStock}
                    className={`relative overflow-hidden flex items-center justify-center text-[13px] font-bold transition-all border
                      ${isSize ? 'w-11 h-11 rounded-full' : 'px-4 py-2 rounded-md min-w-[3rem]'}
                      ${
                        isOutOfStock 
                          ? 'border-red-500 text-[#282c3f] cursor-not-allowed bg-white' 
                          : isSelected 
                            ? 'border-[#FD7100] text-[#FD7100] cursor-pointer bg-[#FFF5ED] ring-1 ring-[#FD7100]' 
                            : 'border-[#bfc0c6] text-[#282c3f] hover:border-[#282c3f] cursor-pointer bg-white'
                      }
                    `}
                  >
                    {opt.name}
                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[140%] h-[1.5px] bg-red-500 -rotate-45" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex flex-col sm:flex-row gap-3.5 mb-7">
        <button 
          onClick={handleAddToBag}
          className="flex-1 cursor-pointer bg-white text-[#111827] border border-[#111827] py-[13px] rounded font-bold text-[12px] tracking-wide flex items-center justify-center gap-2 hover:bg-[#111827] hover:text-white transition-all duration-200 shadow-sm"
        >
          <ShoppingBag size={15} />
          {inBag ? "GO TO BAG" : "ADD TO BAG"}
        </button>
        <button 
          onClick={handleBuyNow}
          className="flex-1 cursor-pointer bg-[#FD7100] text-white border border-[#FD7100] py-[13px] rounded font-bold text-[12px] tracking-wide flex items-center justify-center gap-2 hover:bg-white hover:text-[#FD7100] transition-colors shadow-sm"
        >
          <CreditCard size={15} />
          BUY NOW
        </button>
      </div>

      {/* E-Commerce Trust Badges */}
      <div className="mt-4 pt-7 mb-7 border-t border-[#eaeaec]">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {trustBadges.map((badge, idx) => {
            const IconComponent = badge.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center group cursor-default">
                <div className="w-12 h-12 rounded-full bg-[#f8f9fa] border border-[#eaeaec] flex items-center justify-center text-[#282c3f] shadow-sm mb-2 group-hover:scale-105 group-hover:border-[#FD7100] group-hover:text-[#FD7100] transition-all duration-300">
                  <IconComponent size={22} strokeWidth={1.8} />
                </div>
                <span className="text-[12px] font-medium text-[#282c3f] leading-snug max-w-[100px] group-hover:text-[#FD7100] transition-colors">
                  {badge.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Product Details */}
      {(product.longDescription || product.shortDescription) && (
        <div className="mb-7">
          <h4 className="text-[18px] font-extrabold text-[#282c3f] tracking-wide mb-2.5 flex items-center gap-2">
            Product Details
          </h4>
          <div className="text-[13.5px] leading-relaxed text-[#282c3f] whitespace-pre-wrap">
            {product.longDescription || product.shortDescription}
          </div>
        </div>
      )}

      {/* Specifications */}
      {allSpecifications.length > 0 && (
        <div className="mb-7">
          <h4 className="text-[18px] font-extrabold text-[#282c3f] tracking-wide mb-3.5">
            Specifications
          </h4>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {allSpecifications.map((attr, idx) => (
              <div key={idx} className="border-b border-[#eaeaec] pb-2.5">
                <div className="text-[12px] text-[#7e818c] mb-1">{attr.name}</div>
                <div className="text-[13.5px] font-semibold text-[#282c3f]">{attr.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Reviews & Ratings Section */}
      <ProductReviewsSection product={product} onVariantChange={onVariantChange} />

      {/* Size Chart Modal */}
      <SizeChartModal
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
        product={product}
        availableSizes={secondaryAttributeGroups.find(g => g.name.toLowerCase() === 'size')?.options || []}
        activeVariantId={activeVariant._id}
        onSelectSize={onVariantChange}
      />
    </div>
  );
};

export default ProductInfo;
