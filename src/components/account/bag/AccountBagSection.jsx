import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ArrowUpRight, ShieldCheck } from 'lucide-react';
import api from '../../../api/axiosConfig';
import { useCart } from '../../../context/CartContext';
import toast from 'react-hot-toast';

const AccountBagSection = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const { updateCartCount, refreshCart } = useCart();
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cart');
      if (res.data.success) {
        setCart(res.data.data);
        if (res.data.data.itemCount !== undefined) {
          updateCartCount(res.data.data.itemCount);
        }
      }
    } catch (err) {
      console.error('Failed to load bag', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;
    try {
      const res = await api.put(`/cart/${itemId}`, { quantity });
      if (res.data.success) {
        setCart(res.data.data);
        updateCartCount(res.data.data.itemCount);
        refreshCart();
        toast.success('Bag updated');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update quantity');
    }
  };

  const removeItem = async (itemId) => {
    try {
      const res = await api.delete(`/cart/${itemId}`);
      if (res.data.success) {
        setCart(res.data.data);
        updateCartCount(res.data.data.itemCount);
        refreshCart();
        toast.success('Item removed from bag');
      }
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const items = cart?.items || [];
  const totalMRP = items.reduce((acc, item) => acc + (item.mrp || item.price) * item.quantity, 0);
  const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalSavings = totalMRP > totalPrice ? totalMRP - totalPrice : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Shopping Bag</h1>
            {items.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF5ED] text-[#FD7100] border border-[#FD7100]/30">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Review your selected products and checkout seamlessly.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => navigate('/bag')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#FD7100] hover:text-[#e06400] transition-colors self-start sm:self-auto"
          >
            <span>Full Checkout View</span>
            <ArrowUpRight size={16} />
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#FD7100] border-t-transparent"></div>
          <p className="text-sm text-gray-500 mt-4">Loading your shopping bag...</p>
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const productLink = `/product/${item.slug || item.productId}${
                item.variantId ? `?variant=${item.variantId}` : ''
              }`;

              return (
                <div
                  key={item._id}
                  className="bg-white border border-gray-200/80 rounded-xl p-3 sm:p-4 flex gap-3 sm:gap-4 hover:border-gray-300 transition-shadow hover:shadow-sm"
                >
                  <Link to={productLink} className="shrink-0">
                    <img
                      src={item.image || '/placeholder.png'}
                      alt={item.title}
                      className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-lg bg-gray-50 border border-gray-100"
                    />
                  </Link>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={productLink}
                          className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1 hover:text-[#FD7100] transition-colors"
                        >
                          {item.title}
                        </Link>
                        <button
                          onClick={() => removeItem(item._id)}
                          className="text-gray-400 hover:text-red-500 p-1 transition-colors rounded-md"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                        {item.size && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded font-medium text-gray-700">
                            Size: {item.size}
                          </span>
                        )}
                        {item.colorName && item.colorName !== 'default' && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded font-medium text-gray-700">
                            Color: {item.colorName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-gray-900 text-sm sm:text-base">
                          {formatPrice(item.price)}
                        </span>
                        {item.mrp > item.price && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(item.mrp)}
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="px-3 py-0.5 text-xs font-bold text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-4 sm:p-5 sticky top-28 space-y-4">
              <h3 className="font-bold text-gray-900 text-base">Bag Summary</h3>

              <div className="space-y-2.5 text-xs sm:text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Items</span>
                  <span className="font-semibold text-gray-800">{cart?.itemCount || items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total MRP</span>
                  <span>{formatPrice(totalMRP)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount on MRP</span>
                    <span>- {formatPrice(totalSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="text-emerald-600 font-medium">FREE</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                <span className="font-bold text-gray-900 text-sm sm:text-base">Subtotal</span>
                <span className="font-extrabold text-[#FD7100] text-lg sm:text-xl">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <button
                onClick={() => navigate('/bag')}
                className="w-full py-3 px-4 rounded-xl bg-[#FD7100] hover:bg-[#e06400] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-[#FD7100]/20 active:scale-[0.98]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 pt-1">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>100% Safe & Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-center px-4 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 rounded-full bg-[#FFF5ED] flex items-center justify-center text-[#FD7100] mb-4 shadow-sm">
            <ShoppingBag size={28} className="stroke-[1.75]" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Your bag is empty</h3>
          <p className="text-sm text-gray-500 max-w-sm mb-6">
            There are no items currently in your shopping bag. Let's add something cool!
          </p>
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FD7100] hover:bg-[#e06400] text-white text-sm font-semibold transition-all shadow-md shadow-[#FD7100]/20 active:scale-95"
          >
            <span>Start Shopping</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountBagSection;
