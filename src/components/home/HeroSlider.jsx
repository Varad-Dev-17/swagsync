import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MousePointer2, ChevronDown } from "lucide-react";

const HeroSlider = () => {
  return (
    <section className="relative w-full h-screen min-h-[100dvh] h-[100dvh] overflow-hidden">
      {/* BACKGROUND VIDEO */}
      <video
        src="https://res.cloudinary.com/dbjw0t8lz/video/upload/f_auto,q_auto,w_1920,c_limit,ac_none/swagsync/hero.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />



      {/* TEXT CONTENT: Bottom-Left Overlay */}
      <div className="absolute left-[5%] md:left-[8%] bottom-[12%] min-[406px]:bottom-[8%] sm:bottom-[12%] md:bottom-[16%] z-20 w-[90%] md:w-[60%] lg:w-[45%] pointer-events-none">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
            hidden: {},
          }}
          className="pointer-events-auto"
        >
          <motion.span
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
            className="inline-block text-[14px] sm:text-[15px] font-bold tracking-[0.15em] uppercase text-[#FD7100] mb-3 sm:mb-4 md:mb-6 hero-mobile-text-shadow"
          >
            NEW SEASON 2026
          </motion.span>

          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
            }}
            className="text-[30px] min-[390px]:text-[34px] sm:text-4xl md:text-6xl lg:text-[72px] font-bold text-white leading-[1.1] sm:leading-[1.05] tracking-tight mb-3 sm:mb-4 md:mb-6 whitespace-pre-line hero-mobile-text-shadow"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Welcome to Swag<span className="text-[#FD7100]">Sync</span>
          </motion.h1>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
            }}
            className="text-[15px] min-[390px]:text-[16px] md:text-[17px] text-gray-200 max-w-[400px] mb-6 sm:mb-8 md:mb-10 leading-relaxed whitespace-pre-line hero-mobile-text-shadow"
          >
            Where timeless fashion meets modern living.{"\n"}Curated collections for every style, every season.
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
            }}
            className="flex flex-row items-center gap-2.5 sm:gap-4 mb-4 sm:mb-6 max-w-[420px] sm:max-w-none"
          >
            <Link
              to="/products"
              className="flex-1 sm:flex-initial sm:w-auto px-3 sm:px-10 py-3 sm:py-4 bg-[#FD7100] text-white font-medium text-[14px] sm:text-[15px] hover:bg-[#E06400] transition-colors duration-250 rounded-[4px] text-center hero-mobile-btn-shadow sm:shadow-none active:scale-95 whitespace-nowrap"
            >
              Explore Collection
            </Link>
            <Link
              to="/new-in"
              className="flex-1 sm:flex-initial sm:w-auto px-3 sm:px-10 py-3 sm:py-4 bg-transparent border border-white text-white font-medium text-[14px] sm:text-[15px] hover:bg-white hover:text-[#111827] transition-all duration-300 rounded-[4px] text-center hero-mobile-btn-shadow sm:shadow-none active:scale-95 whitespace-nowrap"
            >
              Shop New Arrivals
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* SCROLL INDICATOR */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
      >
        <span className="text-[11px] uppercase tracking-widest text-white/70 ">Scroll to Discover</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ChevronDown className="text-white/70 w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSlider;
