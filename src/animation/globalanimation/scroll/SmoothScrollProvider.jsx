import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLocation } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const SmoothScrollProvider = ({ children }) => {
  const lenisRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08, // Snappier, more responsive deceleration
      smoothWheel: true,
      wheelMultiplier: 1.0, // Standard scroll distance ratio
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisRef.current = lenis;
    window.__lenis = lenis;

    // Synchronize Lenis scrolling with GSAP ScrollTrigger updates
    lenis.on("scroll", ScrollTrigger.update);

    // Link Lenis RAF execution directly to GSAP precision ticker for 100% frame sync
    const updateLenis = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateLenis);

    // Disable lag smoothing to prevent visual jumps and flickering during scroll events
    gsap.ticker.lagSmoothing(0, 0);

    return () => {
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  // Scroll to top instantly when route or search params change, unless navigating to hash
  useEffect(() => {
    if (lenisRef.current) {
      if (location.hash) {
        setTimeout(() => {
          lenisRef.current?.scrollTo(location.hash, {
            offset: -70,
            duration: 1.2,
          });
        }, 150);
      } else {
        lenisRef.current.scrollTo(0, { immediate: true });
      }
    }
  }, [location.pathname, location.search]);

  return <>{children}</>;
};

export default SmoothScrollProvider;
