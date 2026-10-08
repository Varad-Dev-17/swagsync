import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight } from "lucide-react";
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

const Footer = () => {
  const [email, setEmail] = useState("");
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);

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

  return (
    <footer className="bg-white border-t border-gray-200 pt-12 pb-8 text-gray-700">
      <div className="max-w-[1500px] mx-auto px-8 sm:px-10 lg:px-16">
        <div className="flex flex-col lg:flex-row justify-between gap-8 lg:gap-0">
          {/* Brand Info & Socials */}
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

          {/* Shop By Category */}
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

          {/* Customer Service */}
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
                <Link
                  to="/shipping-policy"
                  onClick={handleNavClick}
                  className="text-gray-500 hover:text-[#FD7100] transition-colors block"
                >
                  Shipping Policy
                </Link>
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

          {/* About SwagSync */}
          <div className="lg:w-[16%] lg:border-l lg:border-gray-200 lg:pl-5 lg:pr-3">
            <h3 className="text-[16px] font-bold text-gray-900 mb-4 tracking-tight">
              Company & Legal
            </h3>
            <ul className="space-y-3 text-[14.5px]">
              <li>
                <Link
                  to="/about"
                  onClick={handleNavClick}
                  className="text-gray-500 hover:text-[#FD7100] transition-colors block"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  onClick={handleNavClick}
                  className="text-gray-500 hover:text-[#FD7100] transition-colors block"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  onClick={handleNavClick}
                  className="text-gray-500 hover:text-[#FD7100] transition-colors block"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/vendor/register"
                  onClick={handleNavClick}
                  className="text-gray-500 hover:text-[#FD7100] transition-colors block"
                >
                  Become a Seller
                </Link>
              </li>
            </ul>
          </div>

          {/* Subscribe to Our Newsletter */}
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

        <div className="border-t border-b border-gray-200 mt-12 mb-8 py-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 lg:gap-0 lg:divide-x lg:divide-gray-200">
            {/* Free Delivery */}
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

            {/* Secure Payments */}
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

            {/* Easy Returns */}
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

            {/* 24/7 Support */}
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
        <div className="flex items-center justify-center text-gray-500 text-[14px] text-center">
          <p className="text-center">
            © 2026 SwagSync Premium. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
