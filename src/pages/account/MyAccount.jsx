import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Package, Lock, MapPin, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ProfileSection from '../../components/account/profile/ProfileSection';
import OrdersSection from '../../components/account/orders/OrdersSection';
import ChangePasswordSection from '../../components/account/security/ChangePasswordSection';
import SavedAddressSection from '../../components/account/addresses/SavedAddressSection';

const MyAccount = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { logout } = useAuth();

  const activeTab = tab || 'profile';

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logout();
      navigate('/signin');
    }
  };

  return (
    <div className="bg-white min-h-screen pt-[62px] sm:pt-[68px] md:pt-[72px]">
      <div className="w-full border-t border-gray-200">
        <div className="bg-white flex flex-row h-[calc(100dvh-62px)] sm:h-[calc(100dvh-68px)] md:h-auto md:min-h-[calc(100vh-72px)] overflow-hidden md:overflow-visible">
          {/* Left Sidebar: Fixed on mobile, sticky on desktop */}
          <div className="w-[125px] min-[390px]:w-[140px] md:w-64 border-r border-gray-200 py-3 px-1.5 min-[390px]:px-2 md:p-6 shrink-0 flex flex-col justify-between bg-white h-full md:sticky md:top-[76px] md:h-[calc(100vh-76px)] overflow-y-auto overscroll-contain scrollbar-hide select-none">
            <nav className="space-y-1 flex-1">
              <button
                onClick={() => navigate('/account/profile')}
                className={`w-full text-left px-2 min-[390px]:px-3 py-2.5 md:py-3 font-bold text-[12px] min-[390px]:text-[13px] md:text-[14px] transition-all flex items-center gap-1.5 min-[390px]:gap-2 md:gap-3 border-l-[3px] md:border-l-[4px] ${
                  activeTab === 'profile'
                    ? 'bg-[#FFF5ED] text-[#FD7100] border-[#FD7100]'
                    : 'border-transparent text-gray-600 hover:text-slate-700 hover:bg-gray-50'
                }`}
              >
                <User size={16} className={`shrink-0 ${activeTab === 'profile' ? 'text-[#FD7100]' : 'text-gray-400'}`} />
                <span className="truncate">My Profile</span>
              </button>
              <button
                onClick={() => navigate('/account/orders')}
                className={`w-full text-left px-2 min-[390px]:px-3 py-2.5 md:py-3 font-medium text-[12px] min-[390px]:text-[13px] md:text-[14px] transition-all flex items-center gap-1.5 min-[390px]:gap-2 md:gap-3 border-l-[3px] md:border-l-[4px] ${
                  activeTab === 'orders'
                    ? 'bg-[#FFF5ED] text-[#FD7100] font-bold border-[#FD7100]'
                    : 'border-transparent text-gray-600 hover:text-slate-700 hover:bg-gray-50'
                }`}
              >
                <Package size={16} className={`shrink-0 ${activeTab === 'orders' ? 'text-[#FD7100]' : 'text-gray-400'}`} />
                <span className="truncate">Orders</span>
              </button>
            </nav>

            <div className="pt-3 md:pt-6 border-t border-gray-200 flex flex-col space-y-1">
              <button
                onClick={() => navigate('/account/security')}
                className={`w-full text-left px-2 min-[390px]:px-3 py-2.5 md:py-3 font-medium text-[11px] min-[390px]:text-[12.5px] md:text-[14px] transition-all flex items-center gap-1.5 min-[390px]:gap-2 md:gap-3 border-l-[3px] md:border-l-[4px] ${
                  activeTab === 'security'
                    ? 'bg-[#FFF5ED] text-[#FD7100] font-bold border-[#FD7100]'
                    : 'border-transparent text-gray-600 hover:text-slate-700 hover:bg-gray-50'
                }`}
              >
                <Lock size={16} className={`shrink-0 ${activeTab === 'security' ? 'text-[#FD7100]' : 'text-gray-400'}`} />
                <span className="leading-tight">Change Password</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-2 min-[390px]:px-3 py-2.5 md:py-3 font-medium text-[12px] min-[390px]:text-[13px] md:text-[14px] transition-all flex items-center gap-1.5 min-[390px]:gap-2 md:gap-3 border-l-[3px] md:border-l-[4px] border-transparent text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} className="shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content: Scrollable on right */}
          <div className="flex-1 min-w-0 h-full overflow-y-auto overscroll-contain px-3 py-4 min-[390px]:px-4 sm:px-6 md:px-10 md:py-6 lg:px-12 lg:py-6 bg-white">
            {activeTab === 'profile' && <ProfileSection />}
            {activeTab === 'orders' && <OrdersSection />}
            {activeTab === 'addresses' && <SavedAddressSection />}
            {activeTab === 'security' && <ChangePasswordSection />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;
