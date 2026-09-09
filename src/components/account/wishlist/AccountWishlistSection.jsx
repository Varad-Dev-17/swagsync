import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Heart, 
  ArrowRight, 
  ShoppingBag, 
  Trash2, 
  LayoutGrid, 
  List,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { useWishlist } from '../../../context/WishlistContext';
import { useCart } from '../../../context/CartContext';
import api from '../../../api/axiosConfig';
import toast from 'react-hot-toast';
import WishlistCard from '../../wishlist/WishlistCard';

// Dedicated Horizontal Wishlist Card
const HorizontalWishlistCard = ({ item }) => {
  const { removeFromWishlist } = useWishlist();
  const { refreshCart, updateCartCount } = useCart();

  const product = item.productId;
  const variant = item.variantId;

  if (!product || !variant) return null;

  const colorAttr = variant.attributes?.find(
    (attr) => attr.attribute?.name?.toLowerCase() === 'color'
  );
  const colorName = colorAttr?.option?.displayName || 'default';

  const sizeAttr = variant.attributes?.find(
    (attr) => attr.attribute?.name?.toLowerCase() === 'size'
  );
  const sizeName = sizeAttr?.option?.displayName || '';

  const price = variant.price || product.price || 0;
  const mrp = variant.mrp || product.mrp || price;
  const discountPercentage =
    mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const formatPrice = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  const imageUrl =
    variant.mainImage?.url || product.mainImage?.url || product.images?.[0]?.url;
  const productUrl = `/product/${product.slug}?variant=${variant._id}`;

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromWishlist(product._id, variant._id);
    toast.success('Removed from wishlist');
  };

  const handleMoveToBag = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await api.post('/cart', {
        productId: product._id,
        variantId: variant._id,
        quantity: 1,
        addedFromWishlist: true,
      });

      if (res.data.success) {
        removeFromWishlist(product._id, variant._id);
        toast.success('Moved to bag');

        if (updateCartCount && res.data.data?.itemCount !== undefined) {
          updateCartCount(res.data.data.itemCount);
        }
        if (refreshCart) {
          refreshCart();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to move to bag');
    }
  };

  return (
    <div className="bg-white border border-gray-200/80 hover:border-gray-300 rounded-2xl p-3.5 sm:p-4 transition-all duration-200 hover:shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      {/* Left: Product Thumbnail & Details */}
      <div className="flex items-center gap-3.5 sm:gap-5 min-w-0 flex-1">
        <Link
          to={productUrl}
          className="relative shrink-0 rounded-xl overflow-hidden bg-gray-100 group w-24 h-28 sm:w-28 sm:h-32"
        >
          <img
            src={imageUrl || '/placeholder.png'}
            alt={product.title}
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {variant.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-red-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded uppercase">
                Out of Stock
              </span>
            </div>
          )}
          {discountPercentage > 0 && (
            <span className="absolute top-1.5 left-1.5 bg-[#FD7100] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs">
              {discountPercentage}% OFF
            </span>
          )}
        </Link>

        <div className="flex-1 min-w-0 space-y-1">
          {/* Brand */}
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            {product.brand?.name || 'Brand'}
          </p>

          {/* Title */}
          <Link
            to={productUrl}
            className="block font-semibold text-gray-900 text-sm sm:text-base hover:text-[#FD7100] transition-colors truncate"
          >
            {product.title}
          </Link>

          {/* Attributes */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 pt-0.5">
            {colorName && colorName !== 'default' && (
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                Color: {colorName}
              </span>
            )}
            {sizeName && (
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                Size: {sizeName}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-extrabold text-gray-900 text-base sm:text-lg">
              {formatPrice(price)}
            </span>
            {mrp > price && (
              <span className="text-xs sm:text-sm text-gray-400 line-through">
                {formatPrice(mrp)}
              </span>
            )}
            {discountPercentage > 0 && (
              <span className="text-xs font-bold text-[#FD7100]">
                ({discountPercentage}% OFF)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
        <button
          onClick={handleMoveToBag}
          disabled={variant.stock === 0}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FD7100] hover:bg-[#e06400] text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-[#FD7100]/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <ShoppingBag size={15} />
          <span>MOVE TO BAG</span>
        </button>

        <button
          onClick={handleRemove}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 size={14} />
          <span>Remove</span>
        </button>
      </div>
    </div>
  );
};

const AccountWishlistSection = () => {
  const { wishlistItems, isLoading } = useWishlist();
  const [viewMode, setViewMode] = useState('horizontal'); // 'horizontal' | 'grid'
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Wishlist</h1>
            {wishlistItems?.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF5ED] text-[#FD7100] border border-[#FD7100]/30">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Keep track of items you love and move them to your bag anytime.
          </p>
        </div>

        {wishlistItems?.length > 0 && (
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setViewMode('horizontal')}
                title="Horizontal list view"
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'horizontal'
                    ? 'bg-white text-[#FD7100] shadow-xs'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Grid view"
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#FD7100] shadow-xs'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            <button
              onClick={() => navigate('/wishlist')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#FD7100] hover:text-[#e06400] transition-colors cursor-pointer"
            >
              <span>View Fullscreen</span>
              <ArrowUpRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#FD7100] border-t-transparent"></div>
          <p className="text-sm text-gray-500 mt-4">Loading your wishlist...</p>
        </div>
      ) : wishlistItems && wishlistItems.length > 0 ? (
        viewMode === 'horizontal' ? (
          /* Horizontal Cards Layout */
          <div className="space-y-3.5">
            {wishlistItems.map((item) => (
              <HorizontalWishlistCard key={item._id} item={item} />
            ))}
          </div>
        ) : (
          /* Grid Cards Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {wishlistItems.map((item) => (
              <WishlistCard key={item._id} item={item} />
            ))}
          </div>
        )
      ) : (
        <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-center px-4 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 rounded-full bg-[#FFF5ED] flex items-center justify-center text-[#FD7100] mb-4 shadow-sm">
            <Heart size={28} className="stroke-[1.75]" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Your wishlist is empty</h3>
          <p className="text-sm text-gray-500 max-w-sm mb-6">
            Explore our curated collections and save items you want to purchase later.
          </p>
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FD7100] hover:bg-[#e06400] text-white text-sm font-semibold transition-all shadow-md shadow-[#FD7100]/20 active:scale-95 cursor-pointer"
          >
            <ShoppingBag size={16} />
            <span>Discover Products</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountWishlistSection;
