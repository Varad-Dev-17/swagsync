import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useWishlist } from "../../context/WishlistContext";
import toast from "react-hot-toast";

const BagItem = ({ item, isSelected, toggleSelection, updateQuantity, removeItem }) => {
  const { addToWishlist } = useWishlist();

  // Format price helper
  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const isOutOfStock = item.stock < 1;
  const maxQty = Math.min(10, item.stock || 10);

  const hasDiscount = item.mrp > item.price;
  const discountAmount = item.mrp - item.price;

  const productLink = `/product/${item.slug || item.productId}${item.variantId ? `?variant=${item.variantId}` : (item.colorName && item.colorName !== 'default' ? `?color=${encodeURIComponent(item.colorName)}` : '')}`;

  const handleMoveToWishlist = async () => {
    const res = await addToWishlist(item.productId, item.variantId);
    if (res.success) {
      toast.success(item.addedFromWishlist ? "Moved back to wishlist" : "Moved to wishlist");
      removeItem(item._id, true); 
    } else {
      toast.error(res.message || "Failed to move to wishlist");
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex p-3 mb-4 border-1 border-gray-200 rounded-[8px] bg-white relative group"
      >
        {/* Product Image */}
        <Link 
          to={productLink}
          className="block w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 relative group-hover:opacity-95 transition-opacity"
        >
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSelection();
            }}
            className={`absolute top-2 left-2 w-5 h-5 rounded-[4px] flex items-center justify-center shadow-sm z-10 transition-colors cursor-pointer ${
              isSelected ? 'bg-[#FD7100] border border-[#FD7100]' : 'bg-white border border-gray-300 hover:border-gray-400'
            }`}
          >
            {isSelected && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </button>
          <img
            src={item.image}
            alt={item.title}
            className={`w-full h-full object-cover ${isOutOfStock ? "opacity-50 grayscale" : ""}`}
           loading="lazy" decoding="async" />
        </Link>

        {/* Product Details */}
        <div className="ml-3 sm:ml-4 md:ml-6 flex flex-col flex-grow w-full min-w-0">
          
          <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 h-full">
            <div className="flex-grow min-w-0 w-full">
              <Link 
                to={productLink}
                className="text-[16px] md:text-[18px] font-semibold text-[#282c3f] mb-1 hover:text-[#FD7100] transition-colors block line-clamp-1"
              >
                {item.title}
              </Link>
              <p className="text-[13px] md:text-[14px] text-[#535766] mb-1.5 line-clamp-1">
                {item.brand?.name || item.brand || "SwagSync"}
              </p>

              {/* Pricing */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="text-[16px] md:text-[18px] font-bold text-[#282c3f]">
                  {formatPrice(item.price * item.quantity)}
                </span>
                
                {hasDiscount && (
                  <span className="text-[13px] md:text-[14px] text-[#7e818c] line-through">
                    {formatPrice(item.mrp * item.quantity)}
                  </span>
                )}
              </div>
              
              {/* Controls: Size and Quantity */}
              <div className="flex items-center gap-3 mb-4 md:mb-0 flex-wrap">
                <span
                  className="flex items-center gap-1.5 bg-[#f5f5f6] rounded px-2.5 py-1 text-[13px] font-bold text-[#282c3f]"
                >
                  Size: {item.sizeName || "Standard"}
                </span>
                
                {!isOutOfStock ? (
                  <div className="flex items-center bg-[#f5f5f6] border border-gray-200/90 rounded px-1.5 py-0.5 gap-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.quantity > 1) {
                          updateQuantity(item._id, item.quantity - 1);
                        }
                      }}
                      disabled={item.quantity <= 1}
                      className="w-5 h-5 flex items-center justify-center text-[#282c3f] hover:text-[#FD7100] hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#282c3f] disabled:cursor-not-allowed cursor-pointer"
                      title="Decrease quantity"
                    >
                      <Minus size={12} strokeWidth={2.5} />
                    </button>

                    <span className="text-[13px] font-bold text-[#282c3f] px-1 select-none whitespace-nowrap">
                      Qty: {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (item.quantity < maxQty) {
                          updateQuantity(item._id, item.quantity + 1);
                        } else {
                          toast.error(`Maximum available stock reached (${maxQty})`);
                        }
                      }}
                      disabled={item.quantity >= maxQty}
                      className="w-5 h-5 flex items-center justify-center text-[#282c3f] hover:text-[#FD7100] hover:bg-gray-200 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#282c3f] disabled:cursor-not-allowed cursor-pointer"
                      title="Increase quantity"
                    >
                      <Plus size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <span className="text-red-500 font-bold text-[13px] px-2 py-1 bg-red-50 rounded">Out of Stock</span>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex-shrink-0 flex flex-row sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0 border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
              {item.addedFromWishlist && (
                <button
                  onClick={handleMoveToWishlist}
                  className="flex items-center justify-center gap-1.5 text-[#535766] hover:text-pink-500 hover:border-pink-500 transition-all px-3 py-2 rounded-lg border-2 border-[#eaeaec] bg-white hover:bg-pink-40 text-[12px] font-bold uppercase tracking-wide cursor-pointer flex-1 sm:flex-none"
                  title="Move back to wishlist"
                >
                  <Heart size={14} strokeWidth={2.5} />
                  <span className="whitespace-nowrap">Move Back</span>
                </button>
              )}
              <button
                onClick={() => removeItem(item._id)}
                className="flex items-center justify-center gap-1.5 text-[#535766] hover:text-[#EB001B] hover:border-[#EB001B] transition-all px-3 py-2 rounded-lg border-2 border-[#eaeaec] bg-white hover:bg-red-40 text-[12px] font-bold uppercase tracking-wide cursor-pointer flex-1 sm:flex-none"
                title="Remove item"
              >
                <Trash2 size={14} strokeWidth={2.5} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default BagItem;
