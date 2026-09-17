import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import api from "../../api/axiosConfig";
import toast from "react-hot-toast";

const WishlistCard = ({ item }) => {
  const { removeFromWishlist } = useWishlist();
  const { refreshCart, updateCartCount } = useCart();

  const product = item.productId;
  const variant = item.variantId;

  if (!product || !variant) return null;

  const colorAttr = variant.attributes?.find(attr => {
    const name = attr.attribute?.name?.toLowerCase();
    return name === 'color' || name === 'colour' || name === 'color / shade' || name === 'shade' || attr.attribute?.fieldType === 'color';
  });
  const colorName = colorAttr?.option?.displayName || colorAttr?.option?.storedValue || 'default';
  
  const sizeAttr = variant.attributes?.find(attr => {
    const name = attr.attribute?.name?.toLowerCase();
    return name === 'size' || name === 'size / net quantity';
  });
  const sizeName = sizeAttr?.option?.displayName || sizeAttr?.option?.storedValue || '';

  const price = variant.price || product.price || 0;
  const mrp = variant.mrp || product.mrp || price;
  const discountPercentage = mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromWishlist(product._id, variant._id);
    toast.success("Removed from wishlist");
  };

  const handleMoveToBag = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const res = await api.post("/cart", {
        productId: product._id,
        variantId: variant._id,
        quantity: 1,
        addedFromWishlist: true
      });
      
      if (res.data.success) {
        removeFromWishlist(product._id, variant._id);
        toast.success("Moved to bag");
        
        // Use either refreshCart or updateCartCount depending on what the cart context provides
        if (updateCartCount && res.data.data?.itemCount !== undefined) {
            updateCartCount(res.data.data.itemCount);
        }
        if (refreshCart) {
            refreshCart();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to move to bag");
    }
  };

  const productUrl = `/product/${product.slug}?variant=${variant._id}`;

  return (
    <div className="group flex flex-col h-full cursor-pointer relative bg-white border border-[#eaeaec] rounded-[10px] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300">
      <div className="absolute top-2 right-2 z-30">
        <button
          onClick={handleRemove}
          className="w-7 h-7 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-gray-500 hover:text-red-500 hover:scale-110 transition-all duration-300"
        >
          <X size={16} />
        </button>
      </div>

      <Link to={productUrl} className="block relative w-full aspect-[4/5] overflow-hidden bg-gray-100">
        <img
          src={variant.mainImage?.url || product.mainImage?.url || product.images?.[0]?.url}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
         loading="lazy" decoding="async" />
        {variant.stock === 0 && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
             <div className="bg-white text-red-500 font-bold px-4 py-2 uppercase tracking-widest text-[12px] rounded-md shadow-md">
               Out of Stock
             </div>
          </div>
        )}
      </Link>

      <div className="p-3 flex flex-col grow">
        <Link to={productUrl} className="block mb-2">
          <h3 className="text-[14px] font-bold text-[#282c3f] line-clamp-1">
            {product.brand?.name || "SwagSync"}
          </h3>
          <p className="text-[13px] text-[#535766] line-clamp-1 mt-0.5 font-light">
            {product.title}
          </p>
          <p className="text-[12px] text-[#535766] mt-1">
            {colorName !== 'default' && `Color: ${colorName}`}
            {sizeName && ` | Size: ${sizeName}`}
          </p>
        </Link>

        <div className="mt-auto">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[14px] font-bold text-[#282c3f]">
              {formatPrice(price)}
            </span>
            {discountPercentage > 0 && (
              <>
                <span className="text-[12px] text-[#7e818c] line-through">
                  {formatPrice(mrp)}
                </span>
                <span className="text-[12px] font-bold text-[#ff905a]">
                  ({discountPercentage}% OFF)
                </span>
              </>
            )}
          </div>

          <button
            onClick={variant.stock === 0 ? handleRemove : handleMoveToBag}
            className={`w-full py-2.5 rounded-md font-bold text-[13px] uppercase tracking-wide transition-all ${
              variant.stock === 0
                ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                : "bg-white border border-[#FD7100] text-[#FD7100] hover:bg-[#FD7100] hover:text-white"
            }`}
          >
            {variant.stock === 0 ? "Remove" : "Move to Bag"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WishlistCard;
