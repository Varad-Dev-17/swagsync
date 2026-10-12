import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Smartphone, Truck } from "lucide-react";
import { motion } from "framer-motion";

const HomeAboutFeatures = () => {
  const handleNavClick = () => {
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { immediate: false });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  const values = [
    {
      title: "Quality",
      description: "We bring you trusted brands and genuine products.",
      icon: (
        <svg
          className="w-16 h-16"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M24 6L11 12V22C11 31 16.5 39.5 24 42C31.5 39.5 37 31 37 22V12L24 6Z"
            stroke="#0F172A"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17 24L22 29L31 19"
            stroke="#FD7100"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      title: "Convenience",
      description: "Shop anytime, anywhere, with ease.",
      icon: (
        <svg
          className="w-16 h-16"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 19H13"
            stroke="#FD7100"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M4 24H11"
            stroke="#FD7100"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M7 29H14"
            stroke="#FD7100"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <rect
            x="15"
            y="15"
            width="17"
            height="14"
            rx="1.5"
            stroke="#0F172A"
            strokeWidth="2.4"
          />
          <path
            d="M32 20H37.5L41.5 25V29H32V20Z"
            stroke="#0F172A"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle
            cx="21"
            cy="31"
            r="2.8"
            stroke="#0F172A"
            strokeWidth="2.4"
            fill="white"
          />
          <circle
            cx="36"
            cy="31"
            r="2.8"
            stroke="#0F172A"
            strokeWidth="2.4"
            fill="white"
          />
        </svg>
      ),
    },
    {
      title: "Customer First",
      description: "Your happiness is our priority.",
      icon: (
        <svg
          className="w-16 h-16"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="22"
            cy="16"
            r="6.5"
            stroke="#0F172A"
            strokeWidth="2.4"
          />
          <path
            d="M11 34C11 27.5 16 25 22 25C24.5 25 26.8 25.5 28.5 26.5"
            stroke="#0F172A"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M32.5 29.5C30.5 27.5 27.5 29 27.5 31C27.5 34 32.5 37 32.5 37C32.5 37 37.5 34 37.5 31C37.5 29 34.5 27.5 32.5 29.5Z"
            stroke="#FD7100"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      ),
    },
  ];

  const features = [
    {
      icon: ShoppingBag,
      title: "Curated Products",
      desc: "Handpicked styles for every taste.",
    },
    {
      icon: Smartphone,
      title: "Easy Shopping",
      desc: "A smooth and simple experience.",
    },
    {
      icon: Truck,
      title: "Reliable Delivery",
      desc: "Your order, on time, always.",
    },
  ];

  return (
    <div
      className="bg-white text-[#111827] pt-8 sm:pt-12 pb-16 sm:pb-20 overflow-hidden"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="max-w-[1460px] mx-auto px-6 sm:px-10 lg:px-14 space-y-16 sm:space-y-20 lg:space-y-24">
        {/* ========================================================= */}
        {/* SECTION 1: OUR VALUES                                     */}
        {/* ========================================================= */}
        <section className="text-center pt-2">
          {/* Header */}
          <motion.div
            className="mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-[#FD7100] text-[15px] sm:text-[17px] font-extrabold tracking-widest uppercase">
              WHAT WE STAND FOR
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-[52px] font-black text-[#0F172A] mt-2.5 tracking-tight">
              Our Values
            </h2>
          </motion.div>

          {/* 3 Values Columns with Dividers */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {values.map((item, idx) => (
              <motion.div
                key={item.title}
                className="flex flex-col items-center px-6 py-6 md:py-2"
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
              >
                <div className="w-20 h-20 flex items-center justify-center mb-5 transition-transform duration-300 hover:scale-110">
                  {item.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-2">
                  {item.title}
                </h3>
                <p className="text-[14.5px] sm:text-[15px] text-gray-500 max-w-xs leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: WHY CHOOSE SWAGSYNC                            */}
        {/* ========================================================= */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Image */}
            <motion.div
              className="lg:col-span-6"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7 }}
            >
              <div className="w-full aspect-[4/3] rounded-2xl lg:rounded-3xl overflow-hidden shadow-xs bg-gray-50">
                <img
                  src="/aboutus/why_choose.png"
                  alt="Why Choose SwagSync"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </motion.div>

            {/* Right Features List */}
            <div className="lg:col-span-6 space-y-7">
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-block text-[#FD7100] text-[13px] sm:text-[14px] font-bold tracking-widest uppercase">
                  WHY SWAGSYNC
                </span>

                <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#0F172A] mt-1 leading-tight tracking-tight">
                  Why Choose SwagSync
                </h2>
              </motion.div>

              <div className="space-y-6 pt-2">
                {features.map((feat, idx) => {
                  const Icon = feat.icon;
                  return (
                    <motion.div
                      key={feat.title}
                      className="flex items-start gap-4"
                      initial={{ opacity: 0, x: 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.5, delay: idx * 0.12 }}
                    >
                      <div className="w-12 h-12 rounded-xl border border-orange-200 bg-orange-50/60 flex items-center justify-center text-[#FD7100] shrink-0 mt-0.5">
                        <Icon className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div>
                        <h3 className="text-[17px] font-bold text-[#0F172A]">
                          {feat.title}
                        </h3>
                        <p className="text-[14px] text-gray-500 mt-0.5">
                          {feat.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: OUR PROMISE BANNER                             */}
        {/* ========================================================= */}
        <section>
          <motion.div
            className="relative rounded-3xl overflow-hidden border border-gray-200/80 shadow-xs min-h-[300px] sm:min-h-[360px] lg:min-h-[400px] flex items-center bg-white"
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
          >
            {/* Full Background Image */}
            <img
              src="/aboutus/our_promise.png"
              alt="Our Promise - Made for Everyday Shopping"
              className="absolute inset-0 w-full h-full object-cover object-right select-none"
              loading="lazy"
            />

            {/* Subtle Gradient Overlay for enhanced readability on smaller viewports */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 sm:via-white/70 to-transparent sm:w-2/3 pointer-events-none" />

            {/* Left Text Content */}
            <div className="relative z-10 p-8 sm:p-12 lg:p-16 max-w-xl lg:max-w-2xl space-y-3">
              <span className="inline-block text-[#FD7100] text-[13px] sm:text-[14px] font-bold tracking-widest uppercase">
                OUR PROMISE
              </span>

              <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-extrabold text-[#0F172A] leading-tight tracking-tight">
                Made for Everyday Shopping
              </h2>

              <p className="text-[15px] sm:text-[16.5px] text-gray-500 leading-relaxed font-normal pt-1 max-w-md">
                Trendy fashion, lifestyle essentials and more — all in one
                place, just for you.
              </p>
            </div>
          </motion.div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 4: READY TO SHOP? / EXPLORE SWAGSYNC              */}
        {/* ========================================================= */}
        <section className="text-center pt-2 pb-6">
          <motion.div
            className="max-w-xl mx-auto space-y-4"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-[#FD7100] text-[12px] sm:text-[13px] font-bold tracking-widest uppercase">
              READY TO SHOP?
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#0F172A] tracking-tight">
              Explore SwagSync
            </h2>

            <p className="text-[15px] sm:text-[16.5px] text-gray-500 leading-relaxed">
              Discover your next favorite look today.
            </p>

            <div className="pt-3">
              <Link
                to="/products"
                onClick={handleNavClick}
                className="inline-flex items-center gap-2 bg-[#FD7100] hover:bg-[#ea580c] active:scale-95 text-white text-[15px] font-semibold px-8 py-3.5 rounded-full shadow-md hover:shadow-orange-200 transition-all duration-200 cursor-pointer"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default HomeAboutFeatures;
