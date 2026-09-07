import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeartCrack } from "lucide-react";
import { useWishlist } from "../../context/WishlistContext";
import WishlistCard from "../../components/wishlist/WishlistCard";
import { useAuth } from "../../context/AuthContext";

const WishlistPage = () => {
  const { wishlistItems, isLoading } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen pt-[100px] flex flex-col items-center justify-center px-4 bg-white">
        <h2 className="text-2xl font-bold text-[#282c3f] mb-4">PLEASE LOG IN</h2>
        <p className="text-[#7e818c] mb-8 text-center max-w-md">
          Login to view items in your wishlist.
        </p>
        <button
          onClick={() => navigate("/signin")}
          className="border border-[#FD7100] text-[#FD7100] px-10 py-3 rounded-md font-bold hover:bg-[#FD7100] hover:text-white transition-colors"
        >
          LOGIN
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-[100px] flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD7100]"></div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen pt-[100px] flex flex-col items-center justify-center px-4 bg-white">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <HeartCrack size={40} className="text-gray-400" />
        </div>
        <h2 className="text-[20px] font-bold text-[#282c3f] mb-2">YOUR WISHLIST IS EMPTY</h2>
        <p className="text-[14px] text-[#7e818c] mb-8 text-center max-w-md">
          Add items that you like to your wishlist. Review them anytime and easily move them to the bag.
        </p>
        <Link
          to="/products"
          className="border border-[#FD7100] text-[#FD7100] px-10 py-3 rounded-md font-bold hover:bg-[#FD7100] hover:text-white transition-colors"
        >
          CONTINUE SHOPPING
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[100px] pb-20 bg-white">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className="text-[14px] text-[#535766] mb-6">
          <Link to="/" className="hover:text-[#FD7100] transition-colors">Home</Link> / <span className="text-[#282c3f] font-bold">Wishlist</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        {wishlistItems.map((item, index) => (
          <WishlistCard key={`${item.productId?._id}-${item.variantId?._id}-${index}`} item={item} />
        ))}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
