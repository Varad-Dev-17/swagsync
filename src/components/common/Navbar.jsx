import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import {
  User,
  Heart,
  ShoppingBag,
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

  const wishlistCount = wishlistItems?.length || 0;
  const isAdmin = user?.isAdmin;
  const isHomePage = location.pathname === "/home" || location.pathname === "/";

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

  // Determine styles based on scroll, hover state, and page
  const isNavSolid = isScrolled || Boolean(activeHoverDept);
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
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[70px]">

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
                  className="h-10 sm:h-11 lg:h-14 w-auto transition-all duration-300 object-contain"
                  style={{ filter: isScrolled ? "none" : "drop-shadow(0px 0px 4px rgba(255,255,255,1)) drop-shadow(0px 0px 10px rgba(255,255,255,0.8))" }}
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
              <div className="flex items-center gap-3 sm:gap-5">
                {!isAdmin && (
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <Link
                      to="/wishlist"
                      className={`relative flex flex-col items-center justify-center gap-1 ${textColor} transition-all duration-300 px-2 py-1 rounded-lg ${isScrolled ? "hover:bg-gray-100 hover:text-[#FD7100]" : "hover:text-white/80"
                        }`}
                    >
                      <div className="relative">
                        <Heart size={18} strokeWidth={1.5} />
                        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#FD7100] text-white text-[8px] font-semibold rounded-full flex items-center justify-center leading-none">
                          {wishlistCount > 99 ? "99" : wishlistCount}
                        </span>
                      </div>
                      <span className="text-xs font-semibold hidden md:block">Wishlist</span>
                    </Link>

                    <Link
                      to="/bag"
                      className={`relative flex flex-col items-center justify-center gap-1 ${textColor} transition-all duration-300 px-2 py-1 rounded-lg ${isScrolled ? "hover:bg-gray-100 hover:text-[#FD7100]" : "hover:text-white/80"
                        }`}
                    >
                      <div className="relative">
                        <ShoppingBag size={18} strokeWidth={1.5} />
                        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#FD7100] text-white text-[8px] font-semibold rounded-full flex items-center justify-center leading-none">
                          {cartCount > 99 ? "99" : cartCount}
                        </span>
                      </div>
                      <span className="text-xs font-semibold hidden md:block">Bag</span>
                    </Link>
                  </div>
                )}

                {/* Profile / Auth Section */}
                {user ? (
                  <Link
                    to="/account"
                    className={`flex items-center gap-2 ${textColor} transition-all duration-300 pl-2 pr-3 py-1.5 rounded-full ${isScrolled ? "hover:bg-gray-100 hover:text-[#FD7100]" : "hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden shrink-0">
                      {user?.profileImage?.url ? (
                        <img src={user.profileImage.url} alt="Profile" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <span className="text-[14px] font-bold">{user?.username?.charAt(0).toUpperCase() || 'U'}</span>
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
                      className={`md:hidden flex flex-col items-center justify-center gap-1 ${textColor} transition-all duration-300 px-2 py-1.5 rounded-lg ${isScrolled ? "hover:bg-gray-100 hover:text-[#FD7100]" : "hover:text-white/80"
                        }`}
                    >
                      <User size={18} strokeWidth={1.5} />
                    </Link>
                  </>
                )}

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`lg:hidden ${textColor} hover:text-[#FD7100]`}
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>



        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-border bg-white shadow-lg text-[#111827] max-h-[calc(100vh-70px)] overflow-y-auto">
            <div className="px-4 py-3 border-b border-[#E5E7EB]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                  className="w-full pl-10 pr-4 py-2 rounded-none focus:outline-none focus:border-[#FD7100] focus:ring-1 focus:ring-[#FD7100] text-[13px] bg-white border border-[#D1D5DB] text-[#111827]"
                />
              </div>
            </div>
            <div className="px-4 py-3 space-y-1">
              {isAdmin
                ? adminNavLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold tracking-wide hover:bg-gray-50 text-[14px]"
                    style={{ color: isActive(link.path) ? "#FD7100" : "#111827" }}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                ))
                : (
                  <div className="flex flex-col space-y-1">

                    {departments.map((dept) => {
                      const isDeptSelected = location.pathname === "/products" && currentDeptParam === dept.name;
                      const isExpanded = mobileExpandedDept === dept.name;
                      const deptCats = categoriesByDept[dept.name] || [];

                      return (
                        <div key={dept._id} className="flex flex-col border-b border-[#E5E7EB]/50 last:border-0 py-1">
                          <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <Link
                              to={`/products?department=${encodeURIComponent(dept.name)}`}
                              onClick={() => setIsMenuOpen(false)}
                              className={`flex-1 font-bold tracking-wide text-[14px] transition-colors uppercase ${isDeptSelected ? "text-[#FD7100]" : "text-[#111827] hover:text-[#FD7100]"
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
                                className="p-1 text-[#4B5563] hover:text-[#FD7100] focus:outline-none"
                                aria-label={`Toggle ${dept.name} categories`}
                              >
                                <ChevronDown size={18} className={`transition-transform duration-200 ${isExpanded ? "rotate-180 text-[#FD7100]" : ""}`} />
                              </button>
                            )}
                          </div>

                          {/* Expandable Categories (Accordion) */}
                          {isExpanded && deptCats.length > 0 && (
                            <div className="pl-6 pr-3 py-2 space-y-1.5 bg-gray-50/70 rounded-lg mt-1 mb-2 border-l-2 border-[#FD7100]/30 ml-3 animate-in fade-in duration-200">
                              <Link
                                to={`/products?department=${encodeURIComponent(dept.name)}`}
                                onClick={() => setIsMenuOpen(false)}
                                className="block py-1.5 px-2 text-[13px] font-semibold text-[#111827] hover:text-[#FD7100]"
                              >
                                View All {dept.name}
                              </Link>
                              {deptCats.map((cat) => {
                                const isCatSelected = isDeptSelected && searchParams.get("category") === cat.name;
                                return (
                                  <Link
                                    key={cat._id}
                                    to={`/products?department=${encodeURIComponent(dept.name)}&category=${encodeURIComponent(cat.name)}`}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`block py-1.5 px-2 text-[13px] rounded transition-colors ${isCatSelected ? "text-[#FD7100] font-bold bg-[#FD7100]/10" : "text-[#4B5563] hover:text-[#FD7100]"
                                      }`}
                                  >
                                    {cat.name}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
