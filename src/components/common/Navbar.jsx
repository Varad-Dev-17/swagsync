import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import api from "../../api/axiosConfig";
import {
  User,
  Heart,
  ShoppingBag,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  Lock,
  LayoutDashboard,
  Users,
  Package,
  ChevronDown,
} from "lucide-react";

const getCategorySection = (catName, deptName = "") => {
  const name = (catName || "").toLowerCase();
  const dept = (deptName || "").toLowerCase();

  if (dept.includes("electronic") || dept.includes("gadget") || dept.includes("tech") || dept.includes("appliance")) {
    if (/laptop|computer|desktop|mac|pc|notebook/.test(name)) return "Computers";
    if (/phone|mobile|smartphone|tablet|ipad|iphone/.test(name)) return "Mobiles";
    if (/tv|camera|speaker|headphone|earbud|monitor|console|gaming/.test(name)) return "Home Entertainment & Gaming";
    if (/wire|cable|charger|battery|adapter|case|cover|stand/.test(name)) return "Accessories & Peripherals";
    return "Gadgets & Tech";
  }

  if (/laptop|computer|desktop|mac|pc|notebook/.test(name)) {
    return "Computers";
  }
  if (/phone|tablet|mobile|ipad|iphone|smartphone/.test(name)) {
    return "Mobiles";
  }
  if (/camera|speaker|headphone|earbud|gadget|monitor|keyboard|mouse|electronic|tv|console|cable|charger/.test(name)) {
    return "Gadgets & Tech";
  }
  if (/shirt|t-shirt|tshirt|\btops?\b|sweater|jacket|blazer|suit|hoodie|coat|kurta|sherwani|dress|gown|pullover|cardigan|polo|sweatshirt|rain/.test(name)) {
    return "Topwear";
  }
  if (/jean|trouser|short|pant|jogger|legging|skirt|bottom|cargo|capri|track/.test(name)) {
    return "Bottomwear";
  }
  if (/shoe|sneaker|sandal|floater|boot|slipper|flip|heel|flat|wedge|footwear|sock|loafer/.test(name)) {
    return "Footwear";
  }
  if (/brief|trunk|boxer|vest|sleepwear|loungewear|lingerie|underwear|thermal|bra|pajama|nightwear/.test(name)) {
    return "Innerwear & Sleepwear";
  }
  if (/kurti|saree|lehenga|salwar|dupatta|nehru|ethnic|festive|traditional|dhoti/.test(name)) {
    return "Festive Wear";
  }
  if (/sport|active|gym|fitness|tracksuit|swim|running|jersey|athletic/.test(name)) {
    return "Sports & Active Wear";
  }
  if (/watch|belt|wallet|perfume|deodorant|sunglass|frame|cap|hat|scarf|muffler|glove|tie|cufflink|bag|backpack|luggage|trolley|jewelry|ring|bracelet|chain|necklace|earring|pendant|accessory|helmet|case/.test(name)) {
    return "Accessories";
  }
  if (/makeup|skin|hair|grooming|beauty|lotion|cream|trimmer|shaver|fragrance|mist|lipstick|cosmetic/.test(name)) {
    return "Beauty & Grooming";
  }
  if (/bed|cushion|curtain|rug|blanket|lamp|table|chair|sofa|decor|kitchen|cookware|utensil|dining/.test(name)) {
    return "Home & Decor";
  }

  if (dept.includes("home") || dept.includes("kitchen")) return "Home Essentials";
  if (dept.includes("beauty") || dept.includes("care")) return "Personal Care";
  if (dept.includes("sport")) return "Collection";
  if (dept.includes("men") || dept.includes("women") || dept.includes("kid") || dept.includes("fashion")) return "Trending Fashion";
  return "Collection";
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [departments, setDepartments] = useState([]);
  const [categoriesByDept, setCategoriesByDept] = useState({});
  const [activeHoverDept, setActiveHoverDept] = useState(null);
  const [mobileExpandedDept, setMobileExpandedDept] = useState(null);

  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const currentDeptParam = searchParams.get("department");

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) {
      setSearchQuery(q);
    } else if (location.pathname !== "/products") {
      setSearchQuery("");
    }
  }, [searchParams, location.pathname]);

  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistItems } = useWishlist();
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const wishlistCount = wishlistItems?.length || 0;
  const isAdmin = user?.isAdmin;
  const isHomePage = location.pathname === "/home" || location.pathname === "/";

  useEffect(() => {
    if (!user) {
      setUnreadNotificationsCount(0);
      return;
    }

    let isMounted = true;
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get("/notifications/unread-count");
        if (isMounted && res.data?.success) {
          setUnreadNotificationsCount(res.data.count || 0);
        }
      } catch {
        // Silently catch
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

    window.addEventListener("notifications-updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("notifications-updated", handleUpdate);
    };
  }, [user, location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      // If we are on the homepage, transition navbar after scrolling 50px
      if (isHomePage) {
        setIsScrolled(window.scrollY > 50);
      } else {
        setIsScrolled(true); // Always solid on other pages
      }
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
    navigate("/signin");
  };

  useEffect(() => {
    setActiveHoverDept(null);
    setIsMenuOpen(false);
  }, [location.pathname, location.search]);

  // Lock body scroll when mobile menu is open on iPhone/Android
  useEffect(() => {
    if (isMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const fetchNavData = async () => {
      try {
        const [deptRes, catRes] = await Promise.all([
          axios.get("/departments?limit=50&status=Active"),
          axios.get("/categories?limit=100&status=Active")
        ]);

        const depts = deptRes.data.success ? (deptRes.data.departments || []) : [];
        const getDeptPriority = (name) => {
          const lower = (name || "").toLowerCase();
          if (lower === "men" || lower === "mens" || lower === "men's") return 1;
          if (lower === "women" || lower === "womens" || lower === "women's") return 2;
          if (lower === "kids" || lower === "kid" || lower === "kid's") return 3;
          if (lower === "electronics" || lower === "electronic" || lower === "gadgets") return 4;
          if (lower === "beauty" || lower === "grooming") return 5;
          if (lower === "home" || lower === "living" || lower === "decor") return 6;
          return 99;
        };
        depts.sort((a, b) => {
          const pA = getDeptPriority(a.name);
          const pB = getDeptPriority(b.name);
          if (pA !== pB) return pA - pB;
          return a.name.localeCompare(b.name);
        });
        const cats = catRes.data.success ? (catRes.data.categories || []) : [];

        setDepartments(depts);

        const catMap = {};
        depts.forEach((d) => {
          catMap[d.name] = [];
        });

        cats.forEach((cat) => {
          if (Array.isArray(cat.departmentIds)) {
            cat.departmentIds.forEach((deptRef) => {
              const deptName = typeof deptRef === "object" ? deptRef.name : null;
              if (deptName && catMap[deptName]) {
                if (!catMap[deptName].some((c) => c._id === cat._id)) {
                  catMap[deptName].push(cat);
                }
              } else {
                const foundDept = depts.find(d => d._id === (typeof deptRef === "object" ? deptRef._id : deptRef));
                if (foundDept && catMap[foundDept.name]) {
                  if (!catMap[foundDept.name].some((c) => c._id === cat._id)) {
                    catMap[foundDept.name].push(cat);
                  }
                }
              }
            });
          }
        });

        Object.keys(catMap).forEach((deptName) => {
          catMap[deptName].sort((a, b) => a.name.localeCompare(b.name));
        });

        setCategoriesByDept(catMap);
      } catch (error) {
        console.error("Error loading navbar catalog data:", error);
      }
    };

    if (!isAdmin) {
      fetchNavData();
    }
  }, [isAdmin]);

  const adminNavLinks = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Products", path: "/admin/products", icon: Package },
    { name: "Orders", path: "/admin/orders", icon: ShoppingBag },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  // Determine styles based on scroll, hover state, mobile menu, and page
  const isNavSolid = isScrolled || Boolean(activeHoverDept) || isMenuOpen;
  const navBg = isNavSolid ? "bg-white" : "bg-transparent";
  const navBorder = isNavSolid ? "border-b border-[#E5E7EB]" : "border-transparent";
  const textColor = isNavSolid ? "text-[#111827]" : "text-white";
  const searchBg = isNavSolid ? "bg-white" : "bg-white/10";
  const searchBorder = isNavSolid ? "border-[#D1D5DB]" : "border-white/20";
  const searchPlaceholder = isNavSolid ? "placeholder:text-gray-400" : "placeholder:text-gray-200";
  const searchIconColor = isNavSolid ? "text-gray-400" : "text-white";

  return (
    <div className="fixed top-0 left-0 right-0 z-50" style={{ fontFamily: "'Poppins', sans-serif" }} onMouseLeave={() => setActiveHoverDept(null)}>
      {/* Navbar */}
      <nav className={`${navBg} ${navBorder} transition-all duration-300`}>
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[62px] sm:h-[68px] lg:h-[70px]">

            {/* Left: Logo */}
            <div className="flex-shrink-0 flex items-center h-full" onMouseEnter={() => setActiveHoverDept(null)}>
              <Link
                to={isAdmin ? "/admin/dashboard" : "/home"}
                className="flex items-center"
              >
                <img
                  src="/Logo/logo.png"
                  alt="SwagSync Logo"
                  fetchPriority="high"
                  className="h-9 sm:h-11 lg:h-14 w-auto transition-all duration-300 object-contain"
                  style={{ filter: isNavSolid ? "none" : "drop-shadow(0px 0px 4px rgba(255,255,255,1)) drop-shadow(0px 0px 10px rgba(255,255,255,0.8))" }}
                />
              </Link>
            </div>

            {/* Nav Links */}
            <div className="hidden lg:flex flex-1 justify-center items-center gap-8 xl:gap-10 h-full">
              {isAdmin
                ? adminNavLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`relative py-1 flex items-center gap-1.5 font-bold tracking-wide transition-colors hover:text-[#FD7100]`}
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: "14px",
                      color: isActive(link.path) ? "#FD7100" : (isNavSolid ? "#111827" : "white"),
                    }}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                    {isActive(link.path) && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FD7100] rounded-full transition-all duration-200" />
                    )}
                  </Link>
                ))
                : (
                  <div className="flex items-center gap-8 xl:gap-10 h-full">

                    {departments.map((dept) => {
                      const isCurrent = location.pathname === "/products" && currentDeptParam === dept.name;
                      const isHovered = activeHoverDept === dept.name;
                      const deptCategories = categoriesByDept[dept.name] || [];

                      return (
                        <div
                          key={dept._id}
                          className="relative flex items-center h-full"
                          onMouseEnter={() => setActiveHoverDept(dept.name)}
                          onMouseLeave={() => setActiveHoverDept(null)}
                        >
                          <Link
                            to={`/products?department=${encodeURIComponent(dept.name)}`}
                            onClick={() => setActiveHoverDept(null)}
                            className="relative py-1 font-bold tracking-wide transition-colors uppercase hover:text-[#FD7100] flex items-center gap-1"
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: "14px",
                              color: isCurrent || isHovered ? "#FD7100" : (isNavSolid ? "#111827" : "white"),
                            }}
                          >
                            {dept.name}
                            {(isCurrent || isHovered) && (
                              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FD7100] rounded-full transition-all duration-200" />
                            )}
                          </Link>

                          {/* Desktop Mega-Menu Dropdown (Anchored directly below category tab) */}
                          {!isAdmin && isHovered && (() => {
                            // Group categories by smart section header
                            const sectionGroups = {};
                            deptCategories.forEach((cat) => {
                              const section = getCategorySection(cat.name, dept.name);
                              if (!sectionGroups[section]) sectionGroups[section] = [];
                              sectionGroups[section].push(cat);
                            });
                            const sectionNames = Object.keys(sectionGroups);

                            // Determine dynamic columns based on section count and items
                            const sectionCount = Math.max(1, sectionNames.length);
                            const numCols = Math.min(5, Math.max(1, sectionCount));

                            // Distribute section headers into columns
                            const columns = Array.from({ length: numCols }, () => []);
                            if (deptCategories.length === 0) {
                              columns[0] = [];
                            } else {
                              sectionNames.forEach((secName, idx) => {
                                columns[idx % numCols].push({ title: secName, items: sectionGroups[secName] });
                              });
                            }

                            // Dynamic width styling based on column count - snug and compact to minimize excess whitespace
                            const getWidthClass = (cols) => {
                              if (cols === 1) return "w-[220px]";
                              if (cols === 2) return "w-[420px]";
                              if (cols === 3) return "w-[580px]";
                              if (cols === 4) return "w-[760px]";
                              return "w-[920px]";
                            };

                            // Center the dropdown horizontally right beneath its corresponding parent department tab
                            const getPositionClass = (cols) => {
                              return "left-1/2 -translate-x-1/2";
                            };

                            const getGridColsClass = (cols) => {
                              if (cols === 1) return "grid-cols-1";
                              if (cols === 2) return "grid-cols-2";
                              if (cols === 3) return "grid-cols-3";
                              if (cols === 4) return "grid-cols-4";
                              return "grid-cols-5";
                            };

                            return (
                              <div
                                className={`hidden lg:block absolute top-full ${getPositionClass(numCols)} ${getWidthClass(numCols)} max-w-[95vw] bg-white rounded-none border border-[#E5E7EB] shadow-[0_25px_50px_-12px_rgba(17,24,39,0.18)] transition-all duration-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
                              >
                                {/* Dynamic Height Grid with Vertical Column Dividers */}
                                <div className={`grid ${getGridColsClass(numCols)} divide-x divide-[#E5E7EB] h-auto max-h-[75vh] overflow-y-auto`}>
                                  {deptCategories.length > 0 ? (
                                    columns.map((colSections, colIdx) => (
                                      <div key={colIdx} className="py-5 px-4 flex flex-col items-center">
                                        <div className="w-fit flex flex-col items-start gap-4 text-left">
                                          {colSections.map((sec, secIdx) => (
                                            <div key={sec.title} className={`flex flex-col items-start text-left ${secIdx > 0 ? "border-t border-[#E5E7EB]/70 pt-4 w-full" : ""}`}>
                                              {/* Section Header */}
                                              <h4
                                                className="text-[12px] font-extrabold tracking-wider uppercase text-[#FD7100] mb-2.5 select-none text-left whitespace-nowrap"
                                                style={{ fontFamily: "'Poppins', sans-serif" }}
                                              >
                                                {sec.title}
                                              </h4>

                                              {/* Category Links List */}
                                              <ul className="space-y-1.5 flex flex-col items-start text-left w-full">
                                                {sec.items.map((cat) => {
                                                  const isCatSelected = location.pathname === "/products" && currentDeptParam === dept.name && searchParams.get("category") === cat.name;
                                                  return (
                                                    <li key={cat._id} className="w-full text-left">
                                                      <Link
                                                        to={`/products?department=${encodeURIComponent(dept.name)}&category=${encodeURIComponent(cat.name)}`}
                                                        onClick={() => setActiveHoverDept(null)}
                                                        className={`text-[13px] transition-all block duration-150 py-0.5 truncate text-left ${isCatSelected
                                                          ? "text-[#FD7100] font-bold"
                                                          : "text-[#4B5563] font-medium hover:text-[#111827] hover:font-semibold hover:translate-x-0.5"
                                                          }`}
                                                        style={{ fontFamily: "'Poppins', sans-serif" }}
                                                      >
                                                        {cat.name}
                                                      </Link>
                                                    </li>
                                                  );
                                                })}
                                              </ul>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="col-span-full p-8 flex flex-col items-center justify-center text-center text-[#6B7280]">
                                      <p className="text-sm font-semibold text-[#374151]">No categories added under {dept.name} yet</p>
                                      <p className="text-xs text-gray-400 mt-1">Check back soon for upcoming arrivals!</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>

            {/* Right: Search Bar & Icons */}
            <div className="flex items-center justify-end gap-4 sm:gap-6 flex-shrink-0 h-full" onMouseEnter={() => setActiveHoverDept(null)}>
              {/* Search Bar (Desktop) */}
              {!isAdmin && (
                <div className="hidden lg:flex relative items-center w-[220px] xl:w-[280px] h-[38px]">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchQuery.trim()) {
                        navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                      }
                    }}
                    placeholder="Search products..."
                    className={`w-full h-[38px] pl-10 pr-8 py-0 rounded-none focus:outline-none focus:border-[#FD7100] focus:ring-1 focus:ring-[#FD7100] text-[13px] border ${searchBg} ${searchBorder} ${textColor} ${searchPlaceholder} transition-all duration-300 backdrop-blur-sm`}
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  />
                  <Search
                    size={16}
                    className={`absolute z-10 left-3.5 top-1/2 -translate-y-1/2 ${searchIconColor} transition-colors pointer-events-none`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className={`absolute z-10 right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200/50 ${textColor} opacity-60 hover:opacity-100 transition-opacity`}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}

              {/* Icons */}
              <div className="flex items-center gap-1.5 sm:gap-4 lg:gap-5">
                {!isAdmin && (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Link
                      to="/wishlist"
                      className={`relative p-2 rounded-full ${textColor} transition-all duration-200 ${
                        isScrolled ? "hover:bg-gray-100 hover:text-[#FD7100]" : "hover:bg-white/10 hover:text-white"
                      }`}
                      aria-label="Wishlist"
                      title="Wishlist"
                    >
                      <Heart size={21} strokeWidth={1.75} />
                      {wishlistCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-[#FD7100] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none shadow-xs">
                          {wishlistCount > 99 ? "99" : wishlistCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/bag"
                      className={`relative p-2 rounded-full ${textColor} transition-all duration-200 ${
                        isScrolled ? "hover:bg-gray-100 hover:text-[#FD7100]" : "hover:bg-white/10 hover:text-white"
                      }`}
                      aria-label="Shopping Bag"
                      title="Bag"
                    >
                      <ShoppingBag size={21} strokeWidth={1.75} />
                      {cartCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-[#FD7100] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none shadow-xs">
                          {cartCount > 99 ? "99" : cartCount}
                        </span>
                      )}
                    </Link>

                    {user && (
                      <Link
                        to="/account/notifications"
                        className={`relative p-2 rounded-full ${textColor} transition-all duration-200 ${
                          isScrolled ? "hover:bg-gray-100 hover:text-[#FD7100]" : "hover:bg-white/10 hover:text-white"
                        }`}
                        aria-label="Notifications"
                        title="Notifications"
                      >
                        <Bell size={21} strokeWidth={1.75} />
                        {unreadNotificationsCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-[#FD7100] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none shadow-xs">
                            {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
                )}

                {/* Profile / Auth Section */}
                {user ? (
                  <Link
                    to="/account"
                    className={`flex items-center gap-2 ${textColor} transition-all duration-300 p-1 sm:pl-2 sm:pr-3 sm:py-1.5 rounded-full ${isScrolled ? "hover:bg-gray-100 hover:text-[#FD7100]" : "hover:bg-white/10 hover:text-white"
                      }`}
                    aria-label="My Account"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden shrink-0 border border-gray-300/60">
                      {user?.profileImage?.url ? (
                        <img src={user.profileImage.url} alt="Profile" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <span className="text-[13px] sm:text-[14px] font-bold text-gray-700">{user?.username?.charAt(0).toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold hidden md:block">
                      {user.username || "User"}
                    </span>
                  </Link>
                ) : (
                  <>
                    {/* Desktop Login Button */}
                    <Link
                      to="/signin"
                      className={`hidden md:flex items-center justify-center px-6 py-2 border rounded-full font-medium transition-all duration-300 ${isScrolled
                        ? "border-[#111827] text-[#111827] hover:bg-[#111827] hover:text-white"
                        : "border-white text-white hover:text-white/80"
                        }`}
                      style={{ fontSize: "14px", height: "38px" }}
                    >
                      Login
                    </Link>

                    {/* Mobile Login Icon */}
                    <Link
                      to="/signin"
                      className={`md:hidden flex items-center justify-center p-2 rounded-lg ${textColor} transition-all duration-300 ${isScrolled ? "hover:bg-gray-100 hover:text-[#FD7100]" : "hover:text-white/80"
                        }`}
                      aria-label="Sign In"
                    >
                      <User size={20} strokeWidth={1.5} />
                    </Link>
                  </>
                )}

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`lg:hidden p-2 rounded-lg ${textColor} hover:text-[#FD7100] active:bg-black/5 transition-colors focus:outline-none`}
                  aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer & Backdrop for iPhone and Android */}
        {isMenuOpen && (
          <div className="lg:hidden">
            {/* Backdrop overlay */}
            <div
              className="fixed inset-0 top-[62px] sm:top-[68px] bg-black/50 backdrop-blur-sm z-40 transition-opacity"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Slide-down Drawer Panel */}
            <div className="fixed top-[62px] sm:top-[68px] left-0 right-0 bottom-0 h-[calc(100dvh-62px)] sm:h-[calc(100dvh-68px)] max-h-[calc(100dvh-62px)] sm:max-h-[calc(100dvh-68px)] bg-white z-50 text-[#111827] flex flex-col overflow-hidden shadow-2xl border-t border-[#E5E7EB]">
              {/* Search Bar (Mobile - 16px text prevents iOS Safari viewport auto-zoom) */}
              <div className="px-4 py-3 border-b border-[#E5E7EB] bg-gray-50/50 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                        setIsMenuOpen(false);
                      }
                    }}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-none focus:outline-none focus:border-[#FD7100] focus:ring-1 focus:ring-[#FD7100] text-[16px] md:text-[13px] bg-white border border-[#D1D5DB] text-[#111827] shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                      aria-label="Clear search"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Navigation Area */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 overscroll-contain">
                {isAdmin ? (
                  adminNavLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-lg font-bold tracking-wide hover:bg-gray-50 text-[15px] transition-colors"
                      style={{ color: isActive(link.path) ? "#FD7100" : "#111827" }}
                    >
                      <link.icon className="w-5 h-5 text-[#FD7100]" />
                      {link.name}
                    </Link>
                  ))
                ) : (
                  <div className="flex flex-col space-y-1">
                    {departments.map((dept) => {
                      const isDeptSelected = location.pathname === "/products" && currentDeptParam === dept.name;
                      const isExpanded = mobileExpandedDept === dept.name;
                      const deptCats = categoriesByDept[dept.name] || [];

                      return (
                        <div key={dept._id} className="flex flex-col border-b border-[#E5E7EB]/60 last:border-0 py-1">
                          <div
                            onClick={() => {
                              if (deptCats.length > 0) {
                                setMobileExpandedDept(isExpanded ? null : dept.name);
                              } else {
                                navigate(`/products?department=${encodeURIComponent(dept.name)}`);
                                setIsMenuOpen(false);
                              }
                            }}
                            className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer select-none"
                          >
                            <Link
                              to={`/products?department=${encodeURIComponent(dept.name)}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen(false);
                              }}
                              className={`font-bold tracking-wide text-[15px] uppercase transition-colors ${
                                isDeptSelected ? "text-[#FD7100]" : "text-[#111827] hover:text-[#FD7100]"
                              }`}
                            >
                              {dept.name}
                            </Link>

                            {deptCats.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMobileExpandedDept(isExpanded ? null : dept.name);
                                }}
                                className="p-1.5 -mr-1 text-[#4B5563] hover:text-[#FD7100] focus:outline-none"
                                aria-label={`Toggle ${dept.name} categories`}
                              >
                                <ChevronDown
                                  size={18}
                                  className={`transition-transform duration-200 ${isExpanded ? "rotate-180 text-[#FD7100]" : ""}`}
                                />
                              </button>
                            )}
                          </div>

                          {/* Expandable Categories Accordion Grouped by Section */}
                          {isExpanded && deptCats.length > 0 && (() => {
                            const sectionGroups = {};
                            deptCats.forEach((cat) => {
                              const section = getCategorySection(cat.name, dept.name);
                              if (!sectionGroups[section]) sectionGroups[section] = [];
                              sectionGroups[section].push(cat);
                            });

                            return (
                              <div className="pl-3 pr-2 py-3 space-y-3 bg-gray-50/70 rounded-xl my-1.5 border-l-2 border-[#FD7100] ml-2 animate-in fade-in duration-200">
                                <Link
                                  to={`/products?department=${encodeURIComponent(dept.name)}`}
                                  onClick={() => setIsMenuOpen(false)}
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FD7100] hover:text-[#E06400] px-2 py-1 uppercase tracking-wider"
                                >
                                  <span>Explore All {dept.name}</span>
                                  <span>→</span>
                                </Link>

                                {Object.entries(sectionGroups).map(([sectionTitle, items]) => (
                                  <div key={sectionTitle} className="space-y-1.5 pt-1">
                                    <span className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 px-2 select-none">
                                      {sectionTitle}
                                    </span>
                                    <div className="grid grid-cols-2 gap-1 px-1">
                                      {items.map((cat) => {
                                        const isCatSelected = isDeptSelected && searchParams.get("category") === cat.name;
                                        return (
                                          <Link
                                            key={cat._id}
                                            to={`/products?department=${encodeURIComponent(dept.name)}&category=${encodeURIComponent(cat.name)}`}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`py-2 px-2.5 text-[13px] rounded-lg transition-colors truncate ${
                                              isCatSelected
                                                ? "text-[#FD7100] font-bold bg-[#FD7100]/10"
                                                : "text-gray-700 hover:text-[#FD7100] hover:bg-white active:bg-gray-100 font-medium"
                                            }`}
                                          >
                                            {cat.name}
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Quick User Footer for Mobile */}
              <div className="border-t border-[#E5E7EB] bg-gray-50 px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] shrink-0">
                {user ? (
                  <div className="flex items-center justify-between">
                    <Link
                      to="/account"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 min-w-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#FD7100]/10 border border-[#FD7100]/30 flex items-center justify-center text-[#FD7100] font-bold text-sm shrink-0">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[#111827] truncate">{user.username}</p>
                        <p className="text-[11px] text-gray-500 truncate">View Account</p>
                      </div>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      to="/signin"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex-1 py-2.5 text-center text-sm font-semibold bg-[#FD7100] text-white rounded-lg shadow-sm hover:bg-[#E06400] transition-colors"
                    >
                      Sign In / Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
