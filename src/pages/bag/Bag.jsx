import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../../api/axiosConfig";
import { useCart } from "../../context/CartContext";
import BagItem from "../../components/bag/BagItem";
import BagSummary from "../../components/bag/BagSummary";
import ApplyCouponModal from "../../components/bag/ApplyCouponModal";
import { calculateBagTotals } from "../../utils/BagUtils";
import CheckoutTracker from "../../components/bag/CheckoutTracker";

const Bag = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const { updateCartCount, refreshCart } = useCart();

  // Coupon State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = sessionStorage.getItem("swagsync_applied_coupon");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [couponDiscount, setCouponDiscount] = useState(() => {
    try {
      const saved = sessionStorage.getItem("swagsync_coupon_discount");
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  const fetchCart = async () => {
    try {
      const res = await api.get("/cart");
      if (res.data.success) {
        setCart(res.data.data);
        updateCartCount(res.data.data.itemCount);
        // Initialize all items as selected by default
        if (selectedItems.length === 0 && res.data.data.items?.length > 0) {
          setSelectedItems(res.data.data.items.map((item) => item._id));
        }
      }
    } catch (err) {
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await api.put(`/cart/${itemId}`, { quantity });
      if (res.data.success) {
        setCart(res.data.data);
        updateCartCount(res.data.data.itemCount);
        refreshCart();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update quantity");
    }
  };

  const removeItem = async (itemId, silent = false) => {
    try {
      const res = await api.delete(`/cart/${itemId}`);
      if (res.data.success) {
        setCart(res.data.data);
        updateCartCount(res.data.data.itemCount);
        refreshCart();
        setSelectedItems((prev) => prev.filter((id) => id !== itemId));
        if (!silent) toast.success("Item removed from bag");
      }
    } catch (err) {
      if (!silent) toast.error("Failed to remove item");
    }
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map((item) => item._id));
    }
  };

  const cartItems = cart?.items || [];
  const selectedCartItems = cartItems.filter((item) =>
    selectedItems.includes(item._id)
  );
  const bagSubtotal = selectedCartItems.reduce(
    (acc, item) => acc + (parseFloat(item.price) || 0) * item.quantity,
    0
  );

  // Re-evaluate applied coupon if cart items or prices change
  useEffect(() => {
    if (appliedCoupon) {
      if (
        appliedCoupon.minimumOrderAmount > 0 &&
        bagSubtotal < appliedCoupon.minimumOrderAmount
      ) {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        sessionStorage.removeItem("swagsync_applied_coupon");
        sessionStorage.removeItem("swagsync_coupon_discount");
        toast.error(
          `Coupon "${appliedCoupon.code}" removed: Minimum order of ₹${appliedCoupon.minimumOrderAmount} not met.`
        );
      } else {
        let discount = 0;
        if (appliedCoupon.discountType === "percentage") {
          discount = Math.round(
            (bagSubtotal * appliedCoupon.discountValue) / 100
          );
          if (appliedCoupon.maximumDiscount > 0) {
            discount = Math.min(discount, appliedCoupon.maximumDiscount);
          }
        } else {
          discount = Math.min(appliedCoupon.discountValue, bagSubtotal);
        }
        setCouponDiscount(discount);
        sessionStorage.setItem("swagsync_coupon_discount", String(discount));
      }
    }
  }, [bagSubtotal, appliedCoupon]);

  const handleApplyCoupon = (coupon, discount) => {
    setAppliedCoupon(coupon);
    setCouponDiscount(discount);
    sessionStorage.setItem("swagsync_applied_coupon", JSON.stringify(coupon));
    sessionStorage.setItem("swagsync_coupon_discount", String(discount));
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    sessionStorage.removeItem("swagsync_applied_coupon");
    sessionStorage.removeItem("swagsync_coupon_discount");
    toast.success("Coupon removed");
  };

  const totals = calculateBagTotals(selectedCartItems, couponDiscount);
  const allSelected =
    cartItems.length > 0 && selectedItems.length === cartItems.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9fb] flex items-center justify-center pt-20">
        <div className="w-10 h-10 border-4 border-[#FD7100] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#f9f9fb] pt-[120px] pb-20 flex flex-col items-center justify-center">
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
          <ShoppingBag size={48} className="text-[#FD7100]" />
        </div>
        <h2 className="text-2xl font-bold text-[#111827] mb-2">
          Your cart is empty
        </h2>
        <p className="text-[#7e818c] mb-8 max-w-md mx-auto text-center">
          Looks like you haven't added anything to your cart yet. Discover something new and awesome today!
        </p>
        <Link
          to="/products"
          className="px-8 py-3 bg-[#FD7100] text-white rounded-lg font-bold hover:bg-[#E06400] transition-colors"
        >
          START SHOPPING
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9fb] pt-24 sm:pt-[100px] pb-12 sm:pb-24">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-24 mx-auto">
        <CheckoutTracker currentStep="bag" />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-6">
          {/* Left Column - Cart Items */}
          <div className="flex-grow lg:w-2/3">
            <div className="bg-white rounded-xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] p-4 sm:p-6 lg:p-10 min-h-[300px] lg:min-h-[600px]">
              <div className="border-b border-[#eaeaec] pb-4 sm:pb-5 mb-6 sm:mb-8 flex justify-between items-center">
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    onClick={toggleSelectAll}
                    className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-[4px] border cursor-pointer ${
                      allSelected
                        ? "bg-[#FD7100] border-[#FD7100]"
                        : "border-gray-300 hover:border-gray-400 bg-white"
                    }`}
                  >
                    {allSelected && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </button>
                  <h1 className="text-[26px] font-bold text-[#111827]">
                    Your Bag
                  </h1>
                  <span className="bg-[#FD7100]/10 text-[#FD7100] text-[12px] font-bold px-3 py-1 rounded-full">
                    {cartItems.length} {cartItems.length === 1 ? "Item" : "Items"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col">
                <AnimatePresence mode="popLayout">
                  {cartItems.map((item) => (
                    <BagItem
                      key={item._id}
                      item={item}
                      isSelected={selectedItems.includes(item._id)}
                      toggleSelection={() => toggleItemSelection(item._id)}
                      updateQuantity={updateQuantity}
                      removeItem={removeItem}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-white rounded-xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] p-6 mt-6 flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FD7100]/10 flex items-center justify-center text-[#FD7100]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <polyline points="9 12 11 14 15 10"></polyline>
                  </svg>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#282c3f]">
                    100% Original
                  </div>
                  <div className="text-[11px] text-[#7e818c]">
                    Genuine Products
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#03a685]/10 flex items-center justify-center text-[#03a685]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                  </svg>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#282c3f]">
                    Easy Returns
                  </div>
                  <div className="text-[11px] text-[#7e818c]">
                    15-Day Return Policy
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FD7100]/10 flex items-center justify-center text-[#FD7100]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#282c3f]">
                    Fast Delivery
                  </div>
                  <div className="text-[11px] text-[#7e818c]">
                    Quick & Reliable
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#282c3f]">
                    Secure Payments
                  </div>
                  <div className="text-[11px] text-[#7e818c]">
                    100% Protected
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-1/3">
            <BagSummary
              totals={totals}
              appliedCoupon={appliedCoupon}
              onOpenCouponModal={() => setIsCouponModalOpen(true)}
              onRemoveCoupon={handleRemoveCoupon}
            />
          </div>
        </div>
      </div>

      {/* Apply Coupon Modal */}
      <ApplyCouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        bagSubtotal={bagSubtotal}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
      />
    </div>
  );
};

export default Bag;
