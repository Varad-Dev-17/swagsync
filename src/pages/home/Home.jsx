import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import HeroSlider from "../../components/home/HeroSlider";
import CuratedCollections from "../../components/home/CuratedCollections";
import HomeNewArrivalsSection from "../../components/home/HomeNewArrivalsSection";
import PromoBanners from "../../components/home/PromoBanners";
import PopularCategories from "../../components/home/PopularCategories";
import OfficialBrandStores from "../../components/home/OfficialBrandStores";
import Newsletter from "../../components/common/Newsletter";

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const heroSectionRef = useRef(null);
  const heroCardRef = useRef(null);
  const heroOverlayRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.timeline({
        scrollTrigger: {
          trigger: heroSectionRef.current,
          start: "top top",
          end: "bottom top",
          pin: heroCardRef.current,
          pinSpacing: false,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      .to(heroCardRef.current, {
        scale: 0.92,
        borderRadius: "36px",
        ease: "none",
        transformOrigin: "center top",
      }, 0)
      .to(heroOverlayRef.current, {
        opacity: 0.55,
        ease: "none",
      }, 0);
    }, heroSectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* PINNED APPLE-STYLE HERO CONTAINER */}
      <div ref={heroSectionRef} className="relative w-full h-screen min-h-[100dvh] h-[100dvh] z-0">
        <div 
          ref={heroCardRef} 
          className="w-full h-full overflow-hidden will-change-transform bg-[#0F172A]"
        >
          <HeroSlider />
          {/* Depth Recession Scrim */}
          <div 
            ref={heroOverlayRef} 
            className="absolute inset-0 bg-[#0F172A] opacity-0 pointer-events-none z-30"
          />
        </div>
      </div>

      {/* RISING PAGE-COVER CONTENT */}
      <div className="relative z-10 bg-white rounded-t-[32px] sm:rounded-t-[40px] md:rounded-t-[52px] shadow-[0_-25px_60px_-15px_rgba(15,23,42,0.35)] border-t border-white/60 overflow-hidden -mt-4 md:-mt-6">
        <PopularCategories />
        <CuratedCollections />
        <PromoBanners />
        <HomeNewArrivalsSection
          title="New Arrivals"
          subtitle="Discover the latest additions to the SwagSync collection."
        />
        <OfficialBrandStores />
        <Newsletter />
      </div>
    </div>
  );
};

export default Home;
