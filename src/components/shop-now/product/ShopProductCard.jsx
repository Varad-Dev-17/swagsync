import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, Heart, Star } from "lucide-react";
import { useHoverCarousel } from "../../../hooks/useHoverCarousel";
import { useAuth } from "../../../context/AuthContext";
import { useWishlist } from "../../../context/WishlistContext";
import toast from "react-hot-toast";

const ShopProductCard = ({ product }) => {
  const { currentImageIndex, isHovering, handlers } = useHoverCarousel(product.images, 1400);
  const { user } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);



  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/signin", { state: { from: location } });
      return;
    }

    const idStr = String(product._id || product.id || "");
    const actualProductId = idStr.includes('-') ? idStr.split('-')[0] : idStr;
    
    if (!actualProductId || !product.variantId) {
       toast.error("Please select a specific color/size first.");
       return;
    }
    
    const wasWishlisted = isInWishlist(actualProductId, product.variantId);
    
    const res = await toggleWishlist(actualProductId, product.variantId);
    if (!res?.success && res?.message) {
       toast.error(res.message);
    } else if (res?.success) {
       toast.success(wasWishlisted ? "Removed from wishlist" : "Added to wishlist");
    }
  };

  const idStr = String(product._id || product.id || "");
  const actualProductId = idStr.includes('-') ? idStr.split('-')[0] : idStr;
  const isWishlisted = actualProductId && product.variantId ? isInWishlist(actualProductId, product.variantId) : false;

  return (
    <div
      className="group flex flex-col h-full cursor-pointer relative bg-white"
      {...handlers}
    >
      <Link to={`/product/${product.slug}${product.variantId ? `?variant=${product.variantId}` : (product.colorName && product.colorName !== 'default' ? `?color=${encodeURIComponent(product.colorName)}` : '')}`} className="block relative w-full aspect-[4/5] overflow-hidden rounded-none bg-gray-100 shadow-sm transition-shadow duration-[300ms] group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">

        {/* Images Carousel */}
        {product.images && product.images.length > 0 ? (
          product.images.map((img, index) => (
            <img
              key={index}
              src={img.url}
              alt={`${product.productName} - Image ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${index === currentImageIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                } ${isHovering ? "scale-104" : "scale-100"}`}
             loading="lazy" decoding="async" />
          ))
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-400">
            No Image
          </div>
        )}

        {/* Hover Dark Overlay (Reduced) */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-[300ms] z-20 pointer-events-none" />

        {/* Top Badges / Buttons */}
        <div className="absolute top-3 left-3 z-30 flex flex-col gap-2">
          {product.stock === 0 ? (
            <div className="bg-red-500/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm text-[11px] font-bold text-white uppercase tracking-wide">
              Out of Stock
            </div>
          ) : (product.rating || product.ratingAverage > 0) ? (
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2 py-1 rounded shadow-sm text-[11px] font-extrabold text-[#111827]">
              <span>{Math.round((product.rating || product.ratingAverage) * 10) / 10}</span>
              <Star size={11} className="fill-[#FFB800] text-[#FFB800] -ml-0.5" />
              <span className="text-gray-300 font-normal">|</span>
              <span className="text-[#111827] font-bold">{product.ratingCount || product.reviewCount || product.numReviews || 1}</span>
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm text-[11px] font-bold text-[#111827] uppercase tracking-wide">
              New
            </div>
          )}
        </div>

        {/* Wishlist Icon (Top Right) */}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 z-30 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-sm transition-all duration-300 ${
            isWishlisted 
              ? 'opacity-100 text-[#f23661] scale-110' 
              : 'opacity-0 group-hover:opacity-100 text-gray-500 hover:text-[#f23661] hover:scale-110'
          }`}
        >
          <Heart size={16} strokeWidth={isWishlisted ? 0 : 2} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      </Link>

      {/* Product Information */}
      <div className="mt-3 relative z-30 bg-white">
        {/* Default State (Brand & Title with Processor) */}
        <Link to={`/product/${product.slug}${product.variantId ? `?variant=${product.variantId}` : (product.colorName && product.colorName !== 'default' ? `?color=${encodeURIComponent(product.colorName)}` : '')}`} className="block group-hover:hidden px-2 pb-0.5">
          <h3 className="text-[14px] font-bold text-[#282c3f] mb-0.5 line-clamp-1">
            {product.brand?.name || product.brand || 'Brand'}
          </h3>
          <p className="text-[13px] text-[#535766] mb-0 line-clamp-1" title={`${product.title || product.productName || 'Product Title'}${product.processor ? `, ${product.processor}` : ''}`}>
            {product.title || product.productName || 'Product Title'}{product.processor ? `, ${product.processor}` : ''}
          </p>
        </Link>

        {/* Hover State (Dots, Wishlist, Processor, Sizes) */}
        <div className="hidden group-hover:block absolute top-[-16px] left-0 right-0 bg-white px-2 pb-3 z-40 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)]">
          {/* Dots */}
          <div className="flex justify-center items-center gap-1.5 pt-2 mb-2.5">
            {product.images?.map((_, idx) => (
              <span 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full transition-colors ${currentImageIndex === idx ? 'bg-[#ff3e6c]' : 'bg-[#e5e5e5]'}`} 
              />
            ))}
          </div>
          {/* Processor (for electronics) */}
          {product.processor && (
            <div className="text-[13px] text-[#535766] truncate mb-1">
              Processor: <span className="text-[#282c3f] font-semibold">{product.processor}</span>
            </div>
          )}
          {/* Sizes / Secondary Attribute */}
          <div className="text-[13px] text-[#535766] truncate mb-2">
            {product.secondaryAttributeName || 'Sizes'}: <span className="text-[#282c3f]">
            {product.availableSizes && product.availableSizes.length > 0 ? (
              product.availableSizes.map((size, idx) => (
                <span key={idx} className={size === product.currentSize ? "text-[#FD7100] font-bold" : "text-[#282c3f]"}>
                  {size}{idx < product.availableSizes.length - 1 ? ', ' : ''}
                </span>
              ))
            ) : 'N/A'}
          </span>
          </div>
          {/* Price inside hover to avoid layout jump since it's absolute */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[14px] font-bold text-[#282c3f]">
              {formatPrice(product.price)}
            </span>
            {product.mrp > product.price && (
              <>
                <span className="text-[12px] text-[#7e818c] line-through">
                  {formatPrice(product.mrp)}
                </span>
                <span className="text-[12px] font-bold text-[#ff905a]">
                  ({product.discountPercentage}% OFF)
                </span>
              </>
            )}
          </div>
        </div>

        {/* Price (Always visible underneath) */}
        <Link to={`/product/${product.slug}${product.variantId ? `?variant=${product.variantId}` : (product.colorName && product.colorName !== 'default' ? `?color=${encodeURIComponent(product.colorName)}` : '')}`} className="flex items-center gap-1.5 flex-wrap px-2 group-hover:opacity-0">
          <span className="text-[14px] font-bold text-[#282c3f]">
            {formatPrice(product.price)}
          </span>
          {product.mrp > product.price && (
            <>
              <span className="text-[12px] text-[#7e818c] line-through">
                {formatPrice(product.mrp)}
              </span>
              <span className="text-[12px] font-bold text-[#ff905a]">
                ({product.discountPercentage}% OFF)
              </span>
            </>
          )}
        </Link>
      </div>
    </div>
  );
};

export default ShopProductCard;
