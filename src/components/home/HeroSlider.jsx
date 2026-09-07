import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MousePointer2, ChevronDown } from "lucide-react";

const HeroSlider = () => {
  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* BACKGROUND VIDEO */}
      <video
        src="/videos/hero.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* GRADIENT OVERLAY */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(25deg, rgba(15,23,42,0.65) 0%, rgba(15,23,42,0.35) 35%, rgba(15,23,42,0.15) 60%, rgba(15,23,42,0) 100%)"
        }}
      />

      {/* TEXT CONTENT: Bottom-Left Overlay */}
      <div className="absolute left-[5%] md:left-[8%] bottom-[12%] md:bottom-[16%] z-20 w-[90%] md:w-[60%] lg:w-[45%] pointer-events-none">
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
            className="inline-block text-[15px] font-bold tracking-[0.15em] uppercase text-[#E72744] mb-4 md:mb-6 "
          >
            NEW SEASON 2026
          </motion.span>

          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
            }}
            className="text-3xl sm:text-4xl md:text-6xl lg:text-[72px] font-bold text-white leading-[1.05] tracking-tight mb-4 md:mb-6 whitespace-pre-line"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Welcome to SwagSync
          </motion.h1>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
            }}
            className="text-[15px] md:text-[17px] text-gray-200  max-w-[400px] mb-8 md:mb-10 leading-relaxed whitespace-pre-line"
          >
            Where timeless fashion meets modern living.{"\n"}Curated collections for every style, every season.
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
            }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-6"
          >
            <Link
              to="/products"
              className="w-full sm:w-auto px-10 py-4 bg-[#4F46E5] text-white font-medium  text-[15px] hover:bg-[#4338ca] transition-colors duration-250 rounded-[4px] text-center"
            >
              Explore Collection
            </Link>
            <Link
              to="/new-in"
              className="w-full sm:w-auto px-10 py-4 bg-transparent border border-white text-white font-medium  text-[15px] hover:bg-white hover:text-[#111827] transition-all duration-300 rounded-[4px] text-center"
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
