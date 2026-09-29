import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Store,
  Tags,
  Package,
  Boxes,
  ShoppingCart,
  RefreshCcw,
  Headphones,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  ExternalLink,
  User as UserIcon,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  WalletCards,
} from "lucide-react";

const navItems = [
  { path: "/vendor/portal", label: "Dashboard", icon: LayoutDashboard, end: true },
  { path: "/vendor/portal/store", label: "Store", icon: Store },
  { path: "/vendor/portal/catalog", label: "Catalog", icon: Tags },
  { path: "/vendor/portal/products", label: "Products", icon: Package },
  { path: "/vendor/portal/inventory", label: "Inventory", icon: Boxes },
  { path: "/vendor/portal/orders", label: "Orders", icon: ShoppingCart },
  { path: "/vendor/portal/returns", label: "Returns", icon: RefreshCcw },
  { path: "/vendor/portal/tickets", label: "Tickets", icon: Headphones },
  { path: "/vendor/portal/reviews", label: "Reviews", icon: MessageSquare },
  { path: "/vendor/portal/payments", label: "Payments & Earnings", icon: WalletCards },
];

const VendorLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/vendor/login");
  };

  const storeName = user?.storeName || user?.vendorProfile?.storeName || user?.username || "My Store";
  const vendorId = user?.vendorId || "VEND-Active";

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-800 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Open Navigation"
            >
              <Menu size={22} />
            </button>

            <Link to="/vendor/portal" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#fe4a03] to-[#ff7d42] text-white flex items-center justify-center font-black text-lg shadow-sm shadow-[#fe4a03]/25 group-hover:scale-105 transition-transform">
                S
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-lg tracking-tight leading-tight">
                    SwagSync
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-orange-50 text-[#fe4a03] rounded-md border border-orange-200">
                    Vendor
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline leading-none">
                  Partner Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Store Badge, Status, Profile Dropdown */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Store Identification Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/80 text-xs">
              <Store size={14} className="text-[#fe4a03]" />
              <span className="font-bold text-slate-800 max-w-[160px] truncate">{storeName}</span>
              <span className="text-slate-300">|</span>
              <span className="font-mono text-slate-500 font-medium">{vendorId}</span>
            </div>

            {/* Approved Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
              <ShieldCheck size={13} className="text-emerald-600" />
              <span>Approved</span>
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-700"
              >
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#fe4a03] font-bold flex items-center justify-center text-xs">
                  {storeName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">{storeName}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs text-slate-400 font-medium">Logged in Vendor</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{storeName}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{user?.email}</p>
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                        ID: {vendorId}
                      </div>
                    </div>

                    <div className="py-1 text-xs">
                      <Link
                        to="/vendor/portal/store"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-orange-50/70 hover:text-[#fe4a03] font-medium transition-colors"
                      >
                        <Store size={15} /> Store Settings & Address
                      </Link>
                      <Link
                        to="/vendor/portal/inventory"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-orange-50/70 hover:text-[#fe4a03] font-medium transition-colors"
                      >
                        <Boxes size={15} /> Manage Stock & Inventory
                      </Link>
                      <Link
                        to="/"
                        target="_blank"
                        className="flex items-center justify-between px-4 py-2.5 text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <ExternalLink size={15} /> Visit Marketplace
                        </span>
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-semibold transition-colors"
                      >
                        <LogOut size={15} /> Logout from Portal
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex min-h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar (Fixed, No Scroll) */}
        <aside
          className={`hidden lg:flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 select-none fixed left-0 top-16 bottom-0 z-20 overflow-hidden ${
            isCollapsed ? "w-20" : "w-64"
          }`}
        >
          {/* Collapse Toggle */}
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            {!isCollapsed && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
                Vendor Navigation
              </span>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors mx-auto"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-gradient-to-r from-[#fe4a03] to-[#ff6622] text-white shadow-md shadow-[#fe4a03]/25"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    } ${isCollapsed ? "justify-center px-0" : ""}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={18}
                        className={`shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? "text-white" : "text-slate-500 group-hover:text-slate-800"
                        }`}
                      />
                      {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer info */}
          {!isCollapsed && (
            <div className="p-3 m-3 rounded-2xl bg-orange-50/70 border border-orange-100 text-xs text-orange-950 shrink-0">
              <div className="font-bold flex items-center gap-1.5 text-[#fe4a03]">
                <ShieldCheck size={15} /> Verified Merchant
              </div>
              <p className="text-[11px] text-orange-900/80 mt-1 leading-snug">
                Vendor-scoped isolation active. Products and inventory belong strictly to your store.
              </p>
            </div>
          )}
        </aside>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 lg:hidden shadow-2xl flex flex-col"
              >
                {/* Mobile Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#fe4a03] text-white flex items-center justify-center font-black text-base shadow-sm">
                      S
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">SwagSync Vendor</p>
                      <p className="text-[11px] text-slate-400">{storeName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Mobile Nav items */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? "bg-[#fe4a03] text-white shadow-md shadow-[#fe4a03]/25"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon size={18} className={isActive ? "text-white" : "text-slate-500"} />
                            <div className="flex-1 flex items-center justify-between">
                              <span>{item.label}</span>
                              {item.badge && (
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </nav>

                {/* Mobile Logout */}
                <div className="p-3 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition-colors"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Content Outlet */}
        <main
          className={`flex-1 min-w-0 transition-all duration-300 ${
            isCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default VendorLayout;
