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
    <div className="bg-white min-h-screen pt-[72px]">
      <div className="w-full border-t border-gray-200">
        <div className="bg-white flex flex-col md:flex-row min-h-[calc(100vh-72px)]">
          {/* Sidebar */}
          <div className="w-full md:w-64 border-r border-gray-200 p-6 shrink-0 flex flex-col bg-white md:sticky md:top-[76px] md:h-[calc(100vh-76px)] md:overflow-y-auto md:overscroll-contain scrollbar-hide">
            <nav className="space-y-1 flex-1">
              <button
                onClick={() => navigate('/account/profile')}
                className={`w-full text-left px-4 py-3 font-bold text-[14px] transition-all flex items-center gap-3 border-l-[4px] ${activeTab === 'profile' ? 'bg-[#FFF5ED] text-[#FD7100] border-[#FD7100]' : 'border-transparent text-gray-600 hover:text-slate-700 hover:bg-gray-50'
                  }`}
              >
                <User size={18} className={activeTab === 'profile' ? 'text-[#FD7100]' : 'text-gray-400'} />
                <span>My Profile</span>
              </button>
              <button
                onClick={() => navigate('/account/orders')}
                className={`w-full text-left px-4 py-3 font-medium text-[14px] transition-all flex items-center gap-3 border-l-[4px] ${activeTab === 'orders' ? 'bg-[#FFF5ED] text-[#FD7100] font-bold border-[#FD7100]' : 'border-transparent text-gray-600 hover:text-slate-700 hover:bg-gray-50'
                  }`}
              >
                <Package size={18} className={activeTab === 'orders' ? 'text-[#FD7100]' : 'text-gray-400'} />
                <span>Orders</span>
              </button>

            </nav>
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col space-y-1">
              <button
                onClick={() => navigate('/account/security')}
                className={`w-full text-left px-4 py-3 font-medium text-[14px] transition-all flex items-center gap-3 border-l-[4px] ${activeTab === 'security' ? 'bg-[#FFF5ED] text-[#FD7100] font-bold border-[#FD7100]' : 'border-transparent text-gray-600 hover:text-slate-700 hover:bg-gray-50'
                  }`}
              >
                <Lock size={18} className={activeTab === 'security' ? 'text-[#FD7100]' : 'text-gray-400'} />
                <span>Change Password</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 font-medium text-[14px] transition-all flex items-center gap-3 border-l-[4px] border-transparent text-red-600 hover:bg-red-50"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 px-6 py-4 md:px-10 md:py-6 lg:px-12 lg:py-6 bg-white">
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
