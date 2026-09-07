import React, { useState } from 'react';
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

  // Color Variants Mapping
  const colorVariantsMap = new Map();
  product.variants?.forEach(v => {
    const colorAttr = v.attributes?.find(a => a.attribute?.name?.toLowerCase() === 'color');
    const colorName = colorAttr?.option?.displayName || 'default';
    if (!colorVariantsMap.has(colorName)) {
      colorVariantsMap.set(colorName, v);
    }
  });
  const uniqueColorVariants = Array.from(colorVariantsMap.values());

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

  const activeColorAttr = activeVariant.attributes?.find(a => a.attribute?.name?.toLowerCase() === 'color');
  const activeColorName = activeColorAttr?.option?.displayName || 'default';

  // Size Variants Mapping for the Active Color
  const variantsOfActiveColor = product.variants?.filter(v => {
    const cAttr = v.attributes?.find(a => a.attribute?.name?.toLowerCase() === 'color');
    const cName = cAttr?.option?.displayName || 'default';
    return cName === activeColorName;
  }) || [];

  let secondaryAttributeName = 'Size';
  const uniqueSizesMap = new Map();
  const isLaptop = 
    product.category?.name?.toLowerCase() === 'laptop' || 
    product.category?.slug?.toLowerCase() === 'laptop' || 
    (typeof product.category === 'string' && product.category.toLowerCase() === 'laptop') ||
    (Array.isArray(product.categories) && product.categories.some(c => 
      c?.name?.toLowerCase() === 'laptop' || 
      c?.slug?.toLowerCase() === 'laptop' || 
      (typeof c === 'string' && c.toLowerCase() === 'laptop')
    ));

  variantsOfActiveColor.forEach(v => {
    let secAttr;
    if (isLaptop) {
      secAttr = v.attributes?.find(a => a.attribute?.name?.toLowerCase().includes('processor'));
    }
    if (!secAttr) {
      secAttr = v.attributes?.find(a => a.attribute?.name?.toLowerCase() !== 'color');
    }
    if (secAttr && secAttr.attribute?.name) {
      secondaryAttributeName = secAttr.attribute.name;
    }
    const name = secAttr?.option?.displayName;
    if (name) {
      // To handle stock, we can sum the stock of all variants with this name
      const existing = uniqueSizesMap.get(name);
      const isCurrentlyActive = v._id === activeVariant._id;
      
      if (!existing) {
        uniqueSizesMap.set(name, {
          name,
          stock: v.stock || 0,
          variantId: v._id,
          isActive: isCurrentlyActive
        });
      } else {
        existing.stock += (v.stock || 0);
        // If this variant is the active one, use its variantId and set isActive
        if (isCurrentlyActive) {
          existing.variantId = v._id;
          existing.isActive = true;
        }
      }
    }
  });
  
  const availableSizes = Array.from(uniqueSizesMap.values());

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

      {/* Select Color */}
      {uniqueColorVariants.length > 1 && (
        <div className="mb-6">
          <h4 className="text-[13px] font-bold text-[#282c3f] uppercase tracking-wide mb-2.5">Select Color</h4>
          <div className="flex flex-wrap gap-4">
            {uniqueColorVariants.map((v) => {
              const cAttr = v.attributes?.find(a => a.attribute?.name?.toLowerCase() === 'color');
              const cName = cAttr?.option?.displayName || 'default';
              const isSelected = cName === activeColorName;
              return (
                <button
                  key={v._id}
                  onClick={() => onVariantChange(v._id)}
                  className="flex flex-col items-center gap-1.5 focus:outline-none group"
                  title={cName}
                >
                  <div className={`relative w-14 h-18 rounded overflow-hidden border-2 transition-all ${isSelected ? 'border-[#FD7100]' : 'border-transparent group-hover:border-[#d4d5d9]'}`}>
                    <img src={v.mainImage?.url} alt={cName} className="w-full h-full object-cover"  loading="lazy" decoding="async" />
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

      {/* Select Secondary Option */}
      {availableSizes.length > 0 && (
        <div className="mb-7">
          <div className="mb-3.5 flex items-center gap-14">
            <h4 className="text-[13px] font-bold text-[#282c3f] uppercase tracking-wide">Select {secondaryAttributeName}</h4>
            {secondaryAttributeName.toLowerCase() === 'size' && (
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
            {availableSizes.map((size) => {
              const isOutOfStock = size.stock <= 0;
              const isSize = secondaryAttributeName.toLowerCase() === 'size';
              return (
                <button
                  key={size.variantId}
                  onClick={() => !isOutOfStock && onVariantChange(size.variantId)}
                  disabled={isOutOfStock}
                  className={`relative overflow-hidden flex items-center justify-center text-[13px] font-bold transition-all border
                    ${isSize ? 'w-11 h-11 rounded-full' : 'px-4 py-2 rounded-md min-w-[3rem]'}
                    ${
                      isOutOfStock 
                        ? 'border-red-500 text-[#282c3f] cursor-not-allowed bg-white' 
                        : size.isActive 
                          ? 'border-[#FD7100] text-[#FD7100] cursor-pointer bg-white' 
                          : 'border-[#bfc0c6] text-[#282c3f] hover:border-[#282c3f] cursor-pointer bg-white'
                    }
                  `}
                >
                  {size.name}
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
      )}

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
      {product.attributes && product.attributes.length > 0 && (
        <div>
          <h4 className="text-[18px] font-extrabold text-[#282c3f] tracking-wide mb-3.5">
            Specifications
          </h4>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {product.attributes.map((attr, idx) => {
              if (!attr.attribute?.name) return null;
              
              const formattedValues = attr.values?.map(val => {
                if (!val) return '';
                let clean = val;
                const attrName = attr.attribute?.name?.toLowerCase() || '';
                if (attrName.includes('material') || attrName.includes('fabric')) {
                  clean = clean.replace(/(\d+)-/g, '$1% ');
                }
                return clean.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              }).join(", ");

              return (
                <div key={idx} className="border-b border-[#eaeaec] pb-2.5">
                  <div className="text-[12px] text-[#7e818c] mb-1">{attr.attribute.name}</div>
                  <div className="text-[13px] text-[#282c3f]">{formattedValues}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer Reviews & Ratings Section */}
      <ProductReviewsSection product={product} />

      {/* Size Chart Modal */}
      <SizeChartModal
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
        product={product}
        availableSizes={availableSizes}
        activeVariantId={activeVariant._id}
        onSelectSize={onVariantChange}
      />
    </div>
  );
};

export default ProductInfo;
