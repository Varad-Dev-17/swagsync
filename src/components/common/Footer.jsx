import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, X, ShieldCheck, Truck, FileText, Info, Store } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api/axiosConfig";

// Social Icons
const FacebookIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const YoutubeIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const PinterestIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.19-.331 1.357-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
  </svg>
);

const socialLinks = [
  {
    Icon: FacebookIcon,
    label: "Facebook",
    href: "https://facebook.com",
    bgColor: "bg-[#eaf1fb]",
    textColor: "text-[#1877F2]",
    hoverBg: "hover:bg-[#1877F2]/15",
  },
  {
    Icon: InstagramIcon,
    label: "Instagram",
    href: "https://instagram.com",
    bgColor: "bg-[#fcecef]",
    textColor: "text-[#E4405F]",
    hoverBg: "hover:bg-[#E4405F]/15",
  },
  {
    Icon: XIcon,
    label: "X",
    href: "https://x.com",
    bgColor: "bg-[#f0f2f5]",
    textColor: "text-gray-900",
    hoverBg: "hover:bg-gray-200",
  },
  {
    Icon: YoutubeIcon,
    label: "Youtube",
    href: "https://youtube.com",
    bgColor: "bg-[#feecec]",
    textColor: "text-[#FF0000]",
    hoverBg: "hover:bg-[#FF0000]/15",
  },
  {
    Icon: PinterestIcon,
    label: "Pinterest",
    href: "https://pinterest.com",
    bgColor: "bg-[#fbebec]",
    textColor: "text-[#BD081C]",
    hoverBg: "hover:bg-[#BD081C]/15",
  },
];

// Fallback departments in case API is offline (real active departments in database)
const DEFAULT_DEPARTMENTS = [
  { name: "Men" },
  { name: "Women" },
  { name: "Electronics" },
  { name: "Beauty" },
  { name: "Sports" },
];

const MODAL_DATA = {
  shipping: {
    title: "Shipping & Delivery Policy",
    icon: Truck,
    content: [
      {
        heading: "Free Delivery Above ₹499",
        text: "We offer complimentary standard shipping on all prepaid and cash-on-delivery orders exceeding ₹499. Orders below ₹499 incur a nominal delivery fee of ₹49.",
      },
      {
        heading: "Dispatch & Delivery Timeline",
        text: "Orders are processed and dispatched within 24 business hours from our nearest fulfillment hub. Delivery typically takes 2 to 5 business days depending on your location.",
      },
      {
        heading: "Live Order Tracking",
        text: "Once your package is picked up by our logistics partner (Delhivery, BlueDart, DTDC, Xpressbees), you will receive a tracking link via SMS and email. You can also monitor real-time updates directly in your SwagSync account under 'My Orders'.",
      },
      {
        heading: "Secure & Contactless Delivery",
        text: "All items are packed securely with tamper-evident seals to ensure pristine condition upon arrival.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    icon: FileText,
    content: [
      {
        heading: "Welcome to SwagSync",
        text: "By accessing and purchasing from SwagSync, you agree to comply with our user agreement, genuine purchase terms, and platform security standards.",
      },
      {
        heading: "User Accounts & Security",
        text: "You are responsible for maintaining the confidentiality of your account credentials. All activity under your account is your responsibility.",
      },
      {
        heading: "Product Authenticity & Pricing",
        text: "All products listed on SwagSync are 100% genuine and verified. Prices, promotional discounts, and availability are subject to change without prior notice.",
      },
      {
        heading: "Orders & Cancellations",
        text: "You may cancel an order anytime before it enters the dispatch phase directly from your account. Once dispatched, our standard 7-day return process applies.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    icon: ShieldCheck,
    content: [
      {
        heading: "Your Privacy Matters",
        text: "SwagSync respects your privacy. We strictly never sell, trade, or rent your personal identifiable information to third parties.",
      },
      {
        heading: "Information We Collect",
        text: "We collect only essential details necessary for order fulfillment and seamless communication: your name, shipping address, contact phone number, and email.",
      },
      {
        heading: "Encrypted & Secure Payments",
        text: "All payment transactions are encrypted using industry-standard 256-bit SSL encryption. We never store complete credit/debit card credentials on our servers.",
      },
      {
        heading: "Your Rights & Control",
        text: "You can update your personal details, manage saved addresses, or delete your account anytime from your Profile settings.",
      },
    ],
  },
  about: {
    title: "About SwagSync",
    icon: Info,
    content: [
      {
        heading: "The SwagSync Vision",
        text: "SwagSync is your curated e-commerce destination bringing together premium fashion, modern lifestyle, latest electronics, beauty, and active sports gear all under one roof.",
      },
      {
        heading: "Direct From Trusted Brands",
        text: "We collaborate directly with verified sellers and renowned brands to ensure every item you receive is 100% authentic, brand-new, and backed by manufacturer warranty.",
      },
      {
        heading: "Customer-First Experience",
        text: "From fast dispatch to transparent order tracking, responsive 24/7 customer support, and seamless 7-day returns, your satisfaction is at the core of everything we build.",
      },
    ],
  },
  seller: {
    title: "Become a Seller on SwagSync",
    icon: Store,
    content: [
      {
        heading: "Grow Your Brand With Us",
        text: "Reach thousands of fashion and lifestyle shoppers across India. SwagSync empowers verified brands and manufacturers with high-visibility shelf space.",
      },
      {
        heading: "Low Commissions & Fast Payouts",
        text: "Benefit from competitive commission rates, weekly automated payment settlements, and intuitive inventory management dashboards.",
      },
      {
        heading: "How to Get Started",
        text: "Contact our merchant onboarding team at partners@swagsync.com with your brand profile, GSTIN, and product catalog to begin onboarding.",
      },
    ],
  },
};

const Footer = () => {
  const [email, setEmail] = useState("");
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [activeModalKey, setActiveModalKey] = useState(null);

  // Fetch real active departments dynamically from API
  useEffect(() => {
    let isMounted = true;
    const fetchDepartments = async () => {
      try {
        const res = await api.get("/departments?limit=50&status=Active");
        if (isMounted && res.data?.success && res.data.departments?.length > 0) {
          const depts = res.data.departments;
          const getDeptPriority = (name) => {
            const lower = (name || "").toLowerCase();
            if (lower === "men" || lower === "mens" || lower === "men's") return 1;
            if (lower === "women" || lower === "womens" || lower === "women's") return 2;
            if (lower === "kids" || lower === "kid" || lower === "kid's") return 3;
            if (lower === "electronics" || lower === "electronic" || lower === "gadgets") return 4;
            if (lower === "beauty" || lower === "grooming") return 5;
            if (lower === "sports" || lower === "sport") return 6;
            return 99;
          };
          depts.sort((a, b) => {
            const pA = getDeptPriority(a.name);
            const pB = getDeptPriority(b.name);
            if (pA !== pB) return pA - pB;
            return a.name.localeCompare(b.name);
          });
          setDepartments(depts);
        }
      } catch (err) {
        console.error("Failed to load departments in footer", err);
      }
    };
    fetchDepartments();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    toast.success("Thank you for subscribing to SwagSync newsletter!");
    setEmail("");
  };

  const handleNavClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const activeModalData = activeModalKey ? MODAL_DATA[activeModalKey] : null;

  return (
    <>
      <footer className="bg-white border-t border-gray-200 pt-12 pb-8 text-gray-700">
        <div className="max-w-[1500px] mx-auto px-8 sm:px-10 lg:px-16">
          <div className="flex flex-col lg:flex-row justify-between gap-8 lg:gap-0">
            {/* Column 1: Brand Info & Socials */}
            <div className="lg:w-[25%] lg:pr-5 flex flex-col justify-between">
              <div>
                <Link to="/" onClick={handleNavClick} className="inline-block">
                  <img
                    src="/Logo/logo.png"
                    alt="SwagSync"
                    className="h-21 w-auto object-contain"
                  />
                </Link>
                <p className="mt-4 text-[14.5px] leading-relaxed text-gray-500 max-w-sm">
                  Your one-stop destination for fashion, lifestyle, electronics and more.
                  Shop from trusted sellers and get the best deals on premium products.
                </p>
              </div>

              {/* Social Icons */}
              <div className="flex items-center gap-2.5 mt-6">
                {socialLinks.map(({ Icon, label, href, bgColor, textColor, hoverBg }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`w-9 h-9 rounded-full ${bgColor} ${textColor} ${hoverBg} flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-xs`}
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Shop By Category (REAL EXISTING ACTIVE DEPARTMENTS) */}
            <div className="lg:w-[15%] lg:px-4">
              <h3 className="text-[16px] font-bold text-gray-900 mb-4 tracking-tight">
                Shop By Category
              </h3>
              <ul className="space-y-3 text-[14.5px]">
                {departments.map((dept) => (
                  <li key={dept._id || dept.name}>
                    <Link
                      to={`/products?department=${encodeURIComponent(dept.name)}`}
                      onClick={handleNavClick}
                      className="text-gray-500 hover:text-[#FD7100] transition-colors block"
                    >
                      {dept.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-1">
                  <Link
                    to="/products"
                    onClick={handleNavClick}
                    className="inline-flex items-center gap-1.5 font-medium text-gray-900 hover:text-[#FD7100] transition-colors group text-[14.5px]"
                  >
                    <span>View All Categories</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Service (REAL WORKING LINKS) */}
            <div className="lg:w-[16%] lg:border-l lg:border-gray-200 lg:pl-5 lg:pr-3">
              <h3 className="text-[16px] font-bold text-gray-900 mb-4 tracking-tight">
                Customer Service
              </h3>
              <ul className="space-y-3 text-[14.5px]">
                <li>
                  <Link
                    to="/account/orders"
                    onClick={handleNavClick}
                    className="text-gray-500 hover:text-[#FD7100] transition-colors block"
                  >
                    Track Your Order
                  </Link>
                </li>
                <li>
                  <Link
                    to="/account/orders"
                    onClick={handleNavClick}
                    className="text-gray-500 hover:text-[#FD7100] transition-colors block"
                  >
                    Returns & Refunds
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModalKey("shipping")}
                    className="text-gray-500 hover:text-[#FD7100] transition-colors text-left cursor-pointer"
                  >
                    Shipping Policy
                  </button>
                </li>
                <li>
                  <Link
                    to="/account/support"
                    onClick={handleNavClick}
                    className="text-gray-500 hover:text-[#FD7100] transition-colors block"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: About SwagSync (REAL WORKING INFORMATION) */}
            <div className="lg:w-[16%] lg:border-l lg:border-gray-200 lg:pl-5 lg:pr-3">
              <h3 className="text-[16px] font-bold text-gray-900 mb-4 tracking-tight">
                About SwagSync
              </h3>
              <ul className="space-y-3 text-[14.5px]">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModalKey("about")}
                    className="text-gray-500 hover:text-[#FD7100] transition-colors text-left cursor-pointer"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModalKey("terms")}
                    className="text-gray-500 hover:text-[#FD7100] transition-colors text-left cursor-pointer"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModalKey("privacy")}
                    className="text-gray-500 hover:text-[#FD7100] transition-colors text-left cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModalKey("seller")}
                    className="text-gray-500 hover:text-[#FD7100] transition-colors text-left cursor-pointer"
                  >
                    Become a Seller
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 5: Subscribe to Our Newsletter */}
            <div className="lg:w-[28%] lg:border-l lg:border-gray-200 lg:pl-6">
              <h3 className="text-[16px] font-bold text-gray-900 mb-2 tracking-tight">
                Subscribe to Our Newsletter
              </h3>
              <p className="text-[14.5px] text-gray-500 leading-relaxed mb-4">
                Get the latest offers, new arrivals and exclusive deals delivered to your inbox.
              </p>

              <form onSubmit={handleSubscribe} className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0 border border-gray-200 rounded-lg px-3.5 py-2.5 flex items-center bg-white focus-within:border-[#FD7100] focus-within:ring-1 focus-within:ring-[#FD7100] transition-all">
                  <Mail className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full text-[14px] text-gray-700 placeholder-gray-400 outline-none bg-transparent min-w-0"
                    aria-label="Email address"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#FD7100] hover:bg-[#ea580c] text-white text-[14px] font-medium px-4.5 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap active:scale-95 flex-shrink-0"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

        {/* ========================================================= */}
        {/* ROW 2: VALUE PROPOSITIONS / TRUST BADGES                   */}
        {/* ========================================================= */}
        <div className="border-t border-b border-gray-200 mt-12 mb-8 py-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 lg:gap-0 lg:divide-x lg:divide-gray-200">
            {/* Feature 1: Free Delivery */}
            <div className="flex items-center gap-3.5 px-2 lg:px-4 justify-start lg:justify-center">
              <div className="flex-shrink-0">
                <svg
                  className="w-10 h-10"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Speed lines in orange */}
                  <path d="M4 19H12" stroke="#FD7100" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M2 24H10" stroke="#FD7100" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M5 29H13" stroke="#FD7100" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Truck cargo body */}
                  <rect
                    x="13"
                    y="14"
                    width="19"
                    height="16"
                    rx="1.5"
                    stroke="#111827"
                    strokeWidth="2.4"
                    fill="none"
                  />
                  {/* Truck cabin */}
                  <path
                    d="M32 19H38.5L42.5 24.5V30H32V19Z"
                    stroke="#111827"
                    strokeWidth="2.4"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  {/* Window */}
                  <path
                    d="M33 21H37.8L40.8 25H33V21Z"
                    fill="#111827"
                    fillOpacity="0.12"
                  />
                  {/* Wheels */}
                  <circle cx="20" cy="32" r="3.2" stroke="#111827" strokeWidth="2.4" fill="#FFFFFF" />
                  <circle cx="37" cy="32" r="3.2" stroke="#111827" strokeWidth="2.4" fill="#FFFFFF" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-[15.5px] text-gray-900 leading-tight">
                  Free Delivery
                </h4>
                <p className="text-[13.5px] text-gray-500 mt-0.5">
                  On orders above ₹499
                </p>
              </div>
            </div>

            {/* Feature 2: Secure Payments */}
            <div className="flex items-center gap-3.5 px-2 lg:px-4 justify-start lg:justify-center">
              <div className="flex-shrink-0">
                <svg
                  className="w-10 h-10"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Shield outline */}
                  <path
                    d="M24 7L12 12.5V22.5C12 30.5 17.2 38 24 40.5C30.8 38 36 30.5 36 22.5V12.5L24 7Z"
                    stroke="#111827"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  {/* Checkmark in orange */}
                  <path
                    d="M18.5 24L22.5 28L29.5 19.5"
                    stroke="#FD7100"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-[15.5px] text-gray-900 leading-tight">
                  Secure Payments
                </h4>
                <p className="text-[13.5px] text-gray-500 mt-0.5">
                  100% secure and trusted
                </p>
              </div>
            </div>

            {/* Feature 3: Easy Returns */}
            <div className="flex items-center gap-3.5 px-2 lg:px-4 justify-start lg:justify-center">
              <div className="flex-shrink-0">
                <svg
                  className="w-10 h-10"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* 3D Isometric Box */}
                  <path
                    d="M24 9L36 15.5V27.5L24 34L12 27.5V15.5L24 9Z"
                    stroke="#111827"
                    strokeWidth="2.4"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path d="M24 9V34" stroke="#111827" strokeWidth="2.4" strokeLinejoin="round" />
                  <path d="M12 15.5L24 22L36 15.5" stroke="#111827" strokeWidth="2.4" strokeLinejoin="round" />
                  {/* Orange Curved Return Arrow */}
                  <path
                    d="M12 36C8 33.5 6 29 7.5 24.5"
                    stroke="#FD7100"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6 37H12.5V30.5"
                    stroke="#FD7100"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-[15.5px] text-gray-900 leading-tight">
                  Easy Returns
                </h4>
                <p className="text-[13.5px] text-gray-500 mt-0.5">
                  7 days return policy
                </p>
              </div>
            </div>

            {/* Feature 4: 24/7 Support */}
            <div className="flex items-center gap-3.5 px-2 lg:px-4 justify-start lg:justify-center">
              <div className="flex-shrink-0">
                <svg
                  className="w-10 h-10"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Headband */}
                  <path
                    d="M13 24V18C13 11.925 17.925 7 24 7C30.075 7 35 11.925 35 18V24"
                    stroke="#111827"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  {/* Left & Right Ear Cushions */}
                  <rect
                    x="9"
                    y="22"
                    width="6"
                    height="12"
                    rx="3"
                    stroke="#111827"
                    strokeWidth="2.4"
                    fill="#111827"
                  />
                  <rect
                    x="33"
                    y="22"
                    width="6"
                    height="12"
                    rx="3"
                    stroke="#111827"
                    strokeWidth="2.4"
                    fill="#111827"
                  />
                  {/* Microphone stem & head */}
                  <path
                    d="M36 32C36 37.5 31 39 26.5 39H25"
                    stroke="#111827"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  <circle cx="23.5" cy="39" r="2.2" fill="#FD7100" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-[15.5px] text-gray-900 leading-tight">
                  24/7 Support
                </h4>
                <p className="text-[13.5px] text-gray-500 mt-0.5">
                  We're here to help
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ROW 3: COPYRIGHT, PAYMENT METHODS, LEGAL LINKS            */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 text-gray-500 text-[14px]">
          {/* Left: Copyright */}
          <p className="text-center md:text-left order-2 md:order-1">
            © 2026 SwagSync Premium. All rights reserved.
          </p>

          {/* Center: Payment Method Badges */}
          <div className="flex items-center flex-wrap justify-center gap-2 order-1 md:order-2">
            {/* VISA */}
            <div
              className="bg-white border border-gray-200/90 rounded px-2.5 py-1 h-7 flex items-center justify-center shadow-2xs hover:border-gray-300 transition-colors"
              title="Visa"
            >
              <svg className="h-3 w-auto" viewBox="0 0 50 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M19.78 0.5L12.97 15.5H8.52L5.2 3.82C5 3.03 4.41 2.33 3.65 1.95C2.26 1.25 0.5 0.65 0 0.5V0.5H7.13C8.03 0.5 8.82 1.09 9.02 2.11L10.74 10.89L15.35 0.5H19.78ZM37.28 10.55C37.3 6.55 31.42 6.33 31.46 4.54C31.48 4 32.01 3.42 33.15 3.27C33.72 3.19 35.29 3.13 37.03 3.9L37.72 0.84C36.78 0.52 35.56 0.22 34.02 0.22C29.89 0.22 26.97 2.31 26.93 5.31C26.89 7.52 28.96 8.76 30.54 9.49C32.16 10.24 32.71 10.72 32.7 11.4C32.68 12.44 31.39 12.9 30.19 12.92C28.08 12.95 26.85 12.38 25.88 11.95L25.17 15.11C26.13 15.53 27.91 15.89 29.74 15.91C34.14 15.91 37.26 13.84 37.28 10.55ZM48.24 15.5H52.12L48.74 0.5H45.14C44.34 0.5 43.67 0.94 43.37 1.63L37.07 15.5H41.52L42.4 13.19H47.83L48.24 15.5ZM43.62 10.02L45.85 4.19L47.14 10.02H43.62ZM26.24 0.5L22.78 15.5H18.54L22 0.5H26.24Z"
                  fill="#1434CB"
                />
              </svg>
            </div>

            {/* Mastercard */}
            <div
              className="bg-white border border-gray-200/90 rounded px-2.5 py-1 h-7 flex items-center justify-center shadow-2xs hover:border-gray-300 transition-colors"
              title="Mastercard"
            >
              <svg className="h-4.5 w-auto" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#EB001B" />
                <circle cx="24" cy="12" r="10" fill="#F79E1B" />
                <path
                  d="M18 4.87A10 10 0 0 1 21.87 12 10 10 0 0 1 18 19.13 10 10 0 0 1 14.13 12 10 10 0 0 1 18 4.87Z"
                  fill="#FF5F00"
                />
              </svg>
            </div>

            {/* RuPay */}
            <div
              className="bg-white border border-gray-200/90 rounded px-2.5 py-1 h-7 flex items-center justify-center shadow-2xs hover:border-gray-300 transition-colors"
              title="RuPay"
            >
              <svg className="h-3 w-auto" viewBox="0 0 54 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="13" fontFamily="Montserrat, sans-serif" fontWeight="800" fontSize="13" fill="#092B65">
                  RuPay
                </text>
                <path d="M43 3L47 8L43 13H46L50 8L46 3H43Z" fill="#1A51A5" />
                <path d="M47 3L51 8L47 13H50L54 8L50 3H47Z" fill="#F37021" />
              </svg>
            </div>

            {/* UPI */}
            <div
              className="bg-white border border-gray-200/90 rounded px-2.5 py-1 h-7 flex items-center justify-center shadow-2xs hover:border-gray-300 transition-colors"
              title="UPI"
            >
              <svg className="h-3.5 w-auto" viewBox="0 0 46 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 13L9 2H15L8 13H2Z" fill="#097939" />
                <path d="M10 13L17 2H23L16 13H10Z" fill="#ED752E" />
                <text x="21" y="13" fontFamily="sans-serif" fontWeight="900" fontStyle="italic" fontSize="13" fill="#000000">
                  UPI
                </text>
              </svg>
            </div>

            {/* Paytm */}
            <div
              className="bg-white border border-gray-200/90 rounded px-2.5 py-1 h-7 flex items-center justify-center shadow-2xs hover:border-gray-300 transition-colors"
              title="Paytm"
            >
              <svg className="h-3.5 w-auto" viewBox="0 0 46 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="13" fontFamily="sans-serif" fontWeight="900" fontSize="14" fill="#00BAF2">
                  pay
                </text>
                <text x="26" y="13" fontFamily="sans-serif" fontWeight="900" fontSize="14" fill="#002970">
                  tm
                </text>
              </svg>
            </div>

            {/* Apple Pay */}
            <div
              className="bg-white border border-gray-200/90 rounded px-2.5 py-1 h-7 flex items-center justify-center shadow-2xs hover:border-gray-300 transition-colors"
              title="Apple Pay"
            >
              <svg className="h-3.5 w-auto" viewBox="0 0 54 20" fill="currentColor">
                <path
                  d="M9.16 7.64c-.58.7-1.42 1.16-2.34 1.1-.12-1.04.38-2.1 1-2.7.6-.72 1.52-1.18 2.36-1.12.12 1.07-.44 2.02-1.02 2.72zm.98 1.48c-1.44-.08-2.66.82-3.34.82-.68 0-1.74-.78-2.88-.76-1.48.02-2.84.86-3.6 2.18-1.54 2.66-.4 6.6 1.1 8.78.74 1.06 1.6 2.24 2.74 2.2 1.1-.04 1.52-.72 2.86-.72 1.32 0 1.7.72 2.86.7 1.18-.02 1.94-1.06 2.66-2.12.84-1.22 1.18-2.4 1.2-2.46-.02-.02-2.32-.88-2.34-3.52-.02-2.22 1.8-3.28 1.88-3.34-1.04-1.52-2.64-1.7-3.14-1.74z"
                  fill="#000000"
                />
                <text
                  x="18"
                  y="15"
                  fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                  fontWeight="600"
                  fontSize="13"
                  fill="#000000"
                >
                  Pay
                </text>
              </svg>
            </div>
          </div>

          {/* Right: Legal Links */}
          <div className="flex items-center gap-3 text-center md:text-right order-3">
            <button
              type="button"
              onClick={() => setActiveModalKey("terms")}
              className="hover:text-gray-900 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => setActiveModalKey("privacy")}
              className="hover:text-gray-900 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-gray-300">|</span>
            <Link
              to="/products"
              onClick={handleNavClick}
              className="hover:text-gray-900 transition-colors"
            >
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>

    {/* Policy / Informational Modal */}
    {activeModalData && (
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        onClick={() => setActiveModalKey(null)}
      >
        <div
          className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-50 text-[#FD7100] flex items-center justify-center flex-shrink-0">
                <activeModalData.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {activeModalData.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveModalKey(null)}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Sections */}
          <div className="mt-4 space-y-3.5">
            {activeModalData.content.map((item, idx) => (
              <div key={idx} className="bg-gray-50/70 rounded-xl p-3.5 border border-gray-100">
                <h4 className="text-[13.5px] font-semibold text-gray-900 mb-1">
                  {item.heading}
                </h4>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          {/* Footer Close Button */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveModalKey(null)}
              className="bg-[#FD7100] hover:bg-[#ea580c] text-white text-[13.5px] font-medium px-5 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default Footer;
