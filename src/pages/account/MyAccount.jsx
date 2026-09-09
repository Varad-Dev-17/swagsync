import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  User, 
  Package, 
  Heart, 
  ShoppingBag, 
  Bell, 
  Ticket, 
  HelpCircle, 
  Headphones,
  Lock, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import api from '../../api/axiosConfig';
import ProfileSection from '../../components/account/profile/ProfileSection';
import OrdersSection from '../../components/account/orders/OrdersSection';
import AccountWishlistSection from '../../components/account/wishlist/AccountWishlistSection';
import AccountBagSection from '../../components/account/bag/AccountBagSection';
import NotificationsSection from '../../components/account/notifications/NotificationsSection';
import CouponsSection from '../../components/account/coupons/CouponsSection';
import TicketsSection from '../../components/account/tickets/TicketsSection';
import HelpSupportSection from '../../components/account/support/HelpSupportSection';
import ChangePasswordSection from '../../components/account/security/ChangePasswordSection';
import SavedAddressSection from '../../components/account/addresses/SavedAddressSection';

const MyAccount = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { logout } = useAuth();
  const { wishlistItems } = useWishlist();
  const { cartCount } = useCart();
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const activeTab = tab || 'profile';
  const wishlistCount = wishlistItems?.length || 0;

  useEffect(() => {
    let isMounted = true;
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        if (isMounted && res.data?.success) {
          setUnreadNotificationsCount(res.data.count || 0);
        }
      } catch {
        // Silently catch when unauthenticated
      }
    };

    fetchUnreadCount();

    const handleUpdate = (e) => {
      if (e?.detail?.count !== undefined) {
        setUnreadNotificationsCount(e.detail.count);
      } else {
        fetchUnreadCount();
      }
    };
    window.addEventListener('notifications-updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('notifications-updated', handleUpdate);
    };
  }, [activeTab]);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logout();
      navigate('/signin');
    }
  };

  const navItems = [
    {
      id: 'profile',
      label: 'My Profile',
      path: '/account/profile',
      icon: User,
    },
    {
      id: 'orders',
      label: 'Orders',
      path: '/account/orders',
      icon: Package,
    },
    {
      id: 'wishlist',
      label: 'Wishlist',
      path: '/account/wishlist',
      icon: Heart,
      badge: wishlistCount,
    },
    {
      id: 'bag',
      label: 'Bag',
      path: '/account/bag',
      icon: ShoppingBag,
      badge: cartCount,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      path: '/account/notifications',
      icon: Bell,
      badge: unreadNotificationsCount,
    },
    {
      id: 'coupons',
      label: 'Coupons',
      path: '/account/coupons',
      icon: Ticket,
    },
    {
      id: 'tickets',
      label: 'Tickets',
      path: '/account/tickets',
      icon: Headphones,
      matches: ['tickets', 'ticket'],
    },
    {
      id: 'help',
      label: 'Help & Support',
      path: '/account/help',
      icon: HelpCircle,
      matches: ['help', 'support'],
    },
  ];

  return (
    <div className="bg-white min-h-screen pt-[62px] sm:pt-[68px] md:pt-[72px]">
      <div className="w-full border-t border-gray-200">
        <div className="bg-white flex flex-row min-h-[calc(100dvh-62px)] sm:min-h-[calc(100dvh-68px)] md:min-h-[calc(100vh-72px)] items-start">
          {/* Left Sidebar: Fixed/Sticky on mobile and desktop */}
          <div className="w-[125px] min-[390px]:w-[140px] md:w-64 border-r border-gray-200 py-3 px-1.5 min-[390px]:px-2 md:p-6 shrink-0 flex flex-col justify-between bg-white sticky top-[62px] sm:top-[68px] md:top-[72px] h-[calc(100dvh-62px)] sm:h-[calc(100dvh-68px)] md:h-[calc(100vh-72px)] overflow-y-auto scrollbar-hide select-none">
            <nav className="space-y-1 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.matches 
                  ? item.matches.includes(activeTab) 
                  : activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`w-full text-left px-2 min-[390px]:px-3 py-2.5 md:py-3 text-[12px] min-[390px]:text-[13px] md:text-[14px] transition-all flex items-center justify-between border-l-[3px] md:border-l-[4px] rounded-r-md ${
                      isActive
                        ? 'bg-[#FFF5ED] text-[#FD7100] font-bold border-[#FD7100]'
                        : 'border-transparent text-gray-600 hover:text-slate-800 hover:bg-gray-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-[390px]:gap-2 md:gap-3 min-w-0">
                      <Icon
                        size={16}
                        className={`shrink-0 ${
                          isActive ? 'text-[#FD7100]' : 'text-gray-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="hidden min-[390px]:inline-flex items-center justify-center text-[10px] md:text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[#FD7100] text-white shrink-0 ml-1">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 md:pt-6 border-t border-gray-200 flex flex-col space-y-1 mt-4">
              <button
                onClick={() => navigate('/account/security')}
                className={`w-full text-left px-2 min-[390px]:px-3 py-2.5 md:py-3 font-medium text-[11px] min-[390px]:text-[12.5px] md:text-[14px] transition-all flex items-center gap-1.5 min-[390px]:gap-2 md:gap-3 border-l-[3px] md:border-l-[4px] rounded-r-md ${
                  activeTab === 'security'
                    ? 'bg-[#FFF5ED] text-[#FD7100] font-bold border-[#FD7100]'
                    : 'border-transparent text-gray-600 hover:text-slate-700 hover:bg-gray-50'
                }`}
              >
                <Lock size={16} className={`shrink-0 ${activeTab === 'security' ? 'text-[#FD7100]' : 'text-gray-400'}`} />
                <span className="leading-tight truncate">Change Password</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-2 min-[390px]:px-3 py-2.5 md:py-3 font-medium text-[12px] min-[390px]:text-[13px] md:text-[14px] transition-all flex items-center gap-1.5 min-[390px]:gap-2 md:gap-3 border-l-[3px] md:border-l-[4px] border-transparent text-red-600 hover:bg-red-50 rounded-r-md"
              >
                <LogOut size={16} className="shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content: Natural scroll with bottom padding */}
          <div className="flex-1 min-w-0 px-3 py-4 min-[390px]:px-4 sm:px-6 md:px-10 md:py-6 lg:px-12 lg:py-6 pb-16 bg-white">
            {activeTab === 'profile' && <ProfileSection />}
            {activeTab === 'orders' && <OrdersSection />}
            {activeTab === 'wishlist' && <AccountWishlistSection />}
            {activeTab === 'bag' && <AccountBagSection />}
            {activeTab === 'notifications' && <NotificationsSection />}
            {activeTab === 'coupons' && <CouponsSection />}
            {(activeTab === 'tickets' || activeTab === 'ticket') && <TicketsSection />}
            {(activeTab === 'help' || activeTab === 'support') && <HelpSupportSection />}
            {activeTab === 'addresses' && <SavedAddressSection />}
            {activeTab === 'security' && <ChangePasswordSection />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;
