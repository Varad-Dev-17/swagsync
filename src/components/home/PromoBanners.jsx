import { Link } from "react-router-dom";
import TiltCard from "../../animations/TiltCard";
import MagneticButton from "../../animations/MagneticButton";

const PromoBanners = () => {
  return (
    <section className="py-8 bg-white px-4 md:px-6 lg:px-8 max-w-[1500px] mx-auto">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8">
        {/* Banner 1: iPhone 16 Pro Max */}
        <div className="flex-1">
          <TiltCard
            className="w-full h-full"
            maxTilt={7}
            scaleOnHover={1.015}
            borderRadius="rounded-3xl"
          >
            <Link
              to="/products?department=Electronics&category=Phone&brand=Apple"
              className="group block relative w-full h-full rounded-3xl select-none"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Card Background Container with Rounded Corners and Shadow */}
              <div className="relative aspect-[16/9] md:aspect-[21/9] lg:aspect-[21/9] rounded-3xl overflow-hidden shadow-lg bg-gray-900 z-0">
                <img
                  src="/orange-iphone.png"
                  alt="iPhone 16 Pro Max Promo"
                  className="w-full h-full object-cover object-[center_15%] transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />

                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-l from-[#080d24]/70 via-[#080d24]/30 to-transparent w-[70%] md:w-[50%] ml-auto z-0 pointer-events-none" />
              </div>

              {/* Text Content Overlay with 3D Depth */}
              <div className="absolute inset-0 flex items-center justify-end p-6 sm:p-8 md:p-10 lg:p-12 z-10 pointer-events-none">
                <div
                  className="flex flex-col items-start text-left text-white w-[48%] sm:w-[42%] lg:w-[38%] pointer-events-auto"
                  style={{
                    transform: "translateZ(36px)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <span className="text-[11px] sm:text-[13px] md:text-base font-normal tracking-wide mb-1 opacity-90">
                    iPhone 16 Pro Max
                  </span>
                  <span className="text-[15px] sm:text-lg md:text-2xl font-bold mb-3 sm:mb-4 tracking-tight">
                    From ₹ 50,769*
                  </span>

                  <p className="text-[10px] sm:text-xs md:text-sm text-white/80 leading-snug">
                    A18 chip. Superfast. Supersmart
                  </p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-white/80 leading-snug mb-6 sm:mb-8">
                    History. Biggest Price Drop
                  </p>

                  <MagneticButton strength={0.3} maxDistance={14}>
                    <div
                      className="px-5 sm:px-6 py-2 sm:py-2.5 bg-[#0A102A] hover:bg-[#182654] transition-colors rounded-full text-white text-[11px] sm:text-sm font-medium shadow-md flex items-center justify-center cursor-pointer"
                      style={{ transform: "translateZ(12px)" }}
                    >
                      Shop Now
                    </div>
                  </MagneticButton>
                </div>
              </div>
            </Link>
          </TiltCard>
        </div>

        {/* Banner 2: Sports Gear */}
        <div className="flex-1">
          <TiltCard
            className="w-full h-full"
            maxTilt={7}
            scaleOnHover={1.015}
            borderRadius="rounded-3xl"
          >
            <Link
              to="/products?department=Sports"
              className="group block relative w-full h-full rounded-3xl select-none"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Card Background Container with Rounded Corners and Shadow */}
              <div className="relative aspect-[16/9] md:aspect-[21/9] lg:aspect-[21/9] rounded-3xl overflow-hidden shadow-lg bg-[#FDF8F5] z-0">
                <img
                  src="/home/shoes_banner.png"
                  alt="Sports Gear Promo"
                  className="w-full h-full object-contain object-right transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />

                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#FDF8F5] via-[#FDF8F5]/90 to-transparent w-[75%] md:w-[65%] z-0 pointer-events-none" />
              </div>

              {/* Text Content Overlay with 3D Depth */}
              <div className="absolute inset-0 flex flex-col justify-center items-start p-6 sm:p-8 md:p-10 lg:p-12 z-10 pointer-events-none">
                <div
                  className="flex flex-col items-start max-w-[65%] sm:max-w-[55%] pointer-events-auto"
                  style={{
                    transform: "translateZ(36px)",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <span className="text-[11px] sm:text-[13px] md:text-base font-bold text-[#FF5722] tracking-wider mb-1 uppercase">
                    Performance Sale
                  </span>
                  <span className="text-[15px] sm:text-lg md:text-2xl font-black text-slate-800 mb-2 sm:mb-3 leading-tight tracking-tight">
                    Up to 50% Off<br />Sports Gear
                  </span>

                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 leading-relaxed mb-6 sm:mb-8 font-medium">
                    Elevate your game with premium activewear and equipment.
                  </p>

                  <MagneticButton strength={0.3} maxDistance={14}>
                    <div
                      className="px-5 sm:px-6 py-2 sm:py-2.5 bg-[#FF5722] hover:bg-[#E64A19] transition-colors rounded-full text-white text-[11px] sm:text-sm font-bold shadow-md flex items-center justify-center cursor-pointer"
                      style={{ transform: "translateZ(12px)" }}
                    >
                      Shop Collection
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 sm:h-4 sm:w-4 ml-1.5 sm:ml-2 transition-transform duration-300 group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </div>
                  </MagneticButton>
                </div>
              </div>
            </Link>
          </TiltCard>
        </div>
      </div>
    </section>
  );
};

export default PromoBanners;

