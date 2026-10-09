import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShoppingBag,
  Smartphone,
  Truck,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const AboutUs = () => {
  const containerRef = useRef(null);

  const handleNavClick = () => {
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { immediate: false });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();

      // 1. HERO ENTRANCE TIMELINE
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl
        .from(".hero-eyebrow", { y: -20, opacity: 0, duration: 0.6 })
        .from(".hero-title", { y: 35, opacity: 0, duration: 0.8 }, "-=0.35")
        .from(".hero-desc", { y: 25, opacity: 0, duration: 0.7 }, "-=0.4")
        .from(
          ".hero-btn",
          { scale: 0.85, y: 15, opacity: 0, duration: 0.65, ease: "back.out(1.8)" },
          "-=0.3"
        )
        .from(
          ".hero-img",
          { x: 50, scale: 0.94, opacity: 0, duration: 1 },
          "-=0.8"
        );

      // Subtle continuous idle float on hero visual
      gsap.to(".hero-img", {
        y: -9,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.2,
      });

      // 2. OUR STORY SECTION (ScrollTrigger)
      gsap.from(".story-img", {
        scrollTrigger: {
          trigger: ".story-section",
          start: "top 80%",
        },
        x: -60,
        opacity: 0,
        duration: 0.95,
        ease: "power3.out",
      });

      gsap.from(".story-content > *", {
        scrollTrigger: {
          trigger: ".story-section",
          start: "top 80%",
        },
        y: 32,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
      });

      // 3. OUR VALUES SECTION (ScrollTrigger Stagger)
      gsap.from(".values-header > *", {
        scrollTrigger: {
          trigger: ".values-section",
          start: "top 85%",
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
      });

      gsap.from(".value-card", {
        scrollTrigger: {
          trigger: ".values-section",
          start: "top 78%",
        },
        y: 45,
        opacity: 0,
        duration: 0.85,
        stagger: 0.18,
        ease: "power3.out",
      });

      gsap.from(".value-icon", {
        scrollTrigger: {
          trigger: ".values-section",
          start: "top 78%",
        },
        scale: 0.5,
        opacity: 0,
        duration: 0.75,
        stagger: 0.18,
        ease: "back.out(2)",
      });

      // 4. WHY CHOOSE SWAGSYNC SECTION (ScrollTrigger Stagger)
      gsap.from(".why-img", {
        scrollTrigger: {
          trigger: ".why-section",
          start: "top 80%",
        },
        x: -50,
        opacity: 0,
        duration: 0.95,
        ease: "power3.out",
      });

      gsap.from(".why-header > *", {
        scrollTrigger: {
          trigger: ".why-section",
          start: "top 80%",
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
      });

      gsap.from(".why-feature", {
        scrollTrigger: {
          trigger: ".why-features-list",
          start: "top 85%",
        },
        x: 40,
        opacity: 0,
        duration: 0.75,
        stagger: 0.16,
        ease: "power3.out",
      });

      // 5. OUR PROMISE BANNER (ScrollTrigger Zoom & Reveal)
      gsap.from(".promise-card", {
        scrollTrigger: {
          trigger: ".promise-section",
          start: "top 82%",
        },
        scale: 0.95,
        opacity: 0,
        duration: 0.95,
        ease: "power3.out",
      });

      gsap.from(".promise-content > *", {
        scrollTrigger: {
          trigger: ".promise-section",
          start: "top 80%",
        },
        y: 25,
        opacity: 0,
        duration: 0.75,
        stagger: 0.14,
        ease: "power3.out",
      });

      // 6. EXPLORE SWAGSYNC CTA (ScrollTrigger)
      gsap.from(".cta-section > div > *", {
        scrollTrigger: {
          trigger: ".cta-section",
          start: "top 85%",
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="bg-white min-h-screen text-[#111827] pt-20 sm:pt-24 pb-16 overflow-hidden"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="max-w-[1460px] mx-auto px-6 sm:px-10 lg:px-14 space-y-16 sm:space-y-20 lg:space-y-24">
        {/* ========================================================= */}
        {/* SECTION 1: HERO SECTION                                   */}
        {/* ========================================================= */}
        <section className="hero-section relative min-h-[calc(100vh-140px)] flex items-center py-6 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center w-full">
            {/* Left Content */}
            <div className="lg:col-span-6 xl:col-span-6 space-y-4 sm:space-y-5 lg:pr-2">
              <span className="hero-eyebrow inline-block text-[#FD7100] text-[13px] sm:text-[14px] font-bold tracking-widest uppercase">
                ABOUT US
              </span>

              <h1 className="hero-title text-4xl sm:text-5xl lg:text-[58px] xl:text-[64px] font-extrabold text-[#0F172A] leading-[1.1] tracking-tight">
                About SwagSync
              </h1>

              <p className="hero-desc text-[16px] sm:text-[17px] text-gray-500 leading-relaxed max-w-xl font-normal">
                SwagSync is your one-stop destination for trendy fashion,
                lifestyle and more. Shop what you love, all in one place.
              </p>

              <div className="hero-btn pt-2 sm:pt-3">
                <Link
                  to="/products"
                  onClick={handleNavClick}
                  className="inline-flex items-center gap-2 bg-[#FD7100] hover:bg-[#ea580c] active:scale-95 text-white text-[15px] font-semibold px-8 py-3.5 rounded-full shadow-md hover:shadow-orange-200 transition-all duration-200 cursor-pointer"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              </div>
            </div>

            {/* Right Visual Container */}
            <div className="lg:col-span-6 xl:col-span-6 relative flex justify-center lg:justify-end items-center">
              <img
                src="/aboutus/women_with_bag.png"
                alt="About SwagSync"
                className="hero-img w-full max-w-[560px] sm:max-w-[620px] lg:max-w-[710px] xl:max-w-[730px] h-auto object-contain select-none"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: OUR STORY                                      */}
        {/* ========================================================= */}
        <section className="story-section">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Image */}
            <div className="lg:col-span-6">
              <div className="story-img w-full aspect-[4/3] rounded-2xl lg:rounded-3xl overflow-hidden shadow-xs bg-gray-50">
                <img
                  src="/aboutus/our_story.png"
                  alt="Our Story - SwagSync"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Right Text Content */}
            <div className="story-content lg:col-span-6 space-y-4">
              <span className="inline-block text-[#FD7100] text-[13px] sm:text-[14px] font-bold tracking-widest uppercase">
                OUR STORY
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#0F172A] leading-tight tracking-tight">
                It Started with a Simple Idea
              </h2>

              <p className="text-[15px] sm:text-[16.5px] text-gray-500 leading-relaxed font-normal pt-1">
                SwagSync began with a{" "}
                <span className="font-semibold text-gray-700">simple idea</span>{" "}
                — to make everyday online shopping simple, modern and reliable.
                We wanted to create a platform where you can{" "}
                <span className="font-semibold text-gray-700">discover</span>{" "}
                great products, shop with confidence and enjoy a better
                shopping experience, every time.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: OUR VALUES                                     */}
        {/* ========================================================= */}
        <section className="values-section text-center pt-2">
          {/* Header */}
          <div className="values-header mb-12 sm:mb-16">
            <span className="inline-block text-[#FD7100] text-[15px] sm:text-[17px] font-extrabold tracking-widest uppercase">
              WHAT WE STAND FOR
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-[52px] font-black text-[#0F172A] mt-2.5 tracking-tight">
              Our Values
            </h2>
          </div>

          {/* 3 Values Columns with Dividers */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* Value 1: Quality */}
            <div className="value-card flex flex-col items-center px-6 py-6 md:py-2">
              {/* Icon: Shield with Checkmark */}
              <div className="value-icon w-20 h-20 flex items-center justify-center mb-5">
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
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-2">Quality</h3>
              <p className="text-[14.5px] sm:text-[15px] text-gray-500 max-w-xs leading-relaxed">
                We bring you trusted brands and genuine products.
              </p>
            </div>

            {/* Value 2: Convenience */}
            <div className="value-card flex flex-col items-center px-6 py-6 md:py-2">
              {/* Icon: Fast Delivery Truck */}
              <div className="value-icon w-20 h-20 flex items-center justify-center mb-5">
                <svg
                  className="w-16 h-16"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Motion Lines in Orange */}
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
                  {/* Truck Body */}
                  <rect
                    x="15"
                    y="15"
                    width="17"
                    height="14"
                    rx="1.5"
                    stroke="#0F172A"
                    strokeWidth="2.4"
                  />
                  {/* Cabin */}
                  <path
                    d="M32 20H37.5L41.5 25V29H32V20Z"
                    stroke="#0F172A"
                    strokeWidth="2.4"
                    strokeLinejoin="round"
                  />
                  {/* Wheels */}
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
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-2">Convenience</h3>
              <p className="text-[14.5px] sm:text-[15px] text-gray-500 max-w-xs leading-relaxed">
                Shop anytime, anywhere, with ease.
              </p>
            </div>

            {/* Value 3: Customer First */}
            <div className="value-card flex flex-col items-center px-6 py-6 md:py-2">
              {/* Icon: Person with Heart */}
              <div className="value-icon w-20 h-20 flex items-center justify-center mb-5">
                <svg
                  className="w-16 h-16"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Person Head */}
                  <circle
                    cx="22"
                    cy="16"
                    r="6.5"
                    stroke="#0F172A"
                    strokeWidth="2.4"
                  />
                  {/* Person Shoulders */}
                  <path
                    d="M11 34C11 27.5 16 25 22 25C24.5 25 26.8 25.5 28.5 26.5"
                    stroke="#0F172A"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  {/* Heart in Orange */}
                  <path
                    d="M32.5 29.5C30.5 27.5 27.5 29 27.5 31C27.5 34 32.5 37 32.5 37C32.5 37 37.5 34 37.5 31C37.5 29 34.5 27.5 32.5 29.5Z"
                    stroke="#FD7100"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A] mb-2">
                Customer First
              </h3>
              <p className="text-[14.5px] sm:text-[15px] text-gray-500 max-w-xs leading-relaxed">
                Your happiness is our priority.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 4: WHY CHOOSE SWAGSYNC                            */}
        {/* ========================================================= */}
        <section className="why-section">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Left Image */}
            <div className="lg:col-span-6">
              <div className="why-img w-full aspect-[4/3] rounded-2xl lg:rounded-3xl overflow-hidden shadow-xs bg-gray-50">
                <img
                  src="/aboutus/why_choose.png"
                  alt="Why Choose SwagSync"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Right Features List */}
            <div className="lg:col-span-6 space-y-7">
              <div className="why-header">
                <span className="inline-block text-[#FD7100] text-[13px] sm:text-[14px] font-bold tracking-widest uppercase">
                  WHY SWAGSYNC
                </span>

                <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#0F172A] mt-1 leading-tight tracking-tight">
                  Why Choose SwagSync
                </h2>
              </div>

              <div className="why-features-list space-y-6 pt-2">
                {/* Feature 1 */}
                <div className="why-feature flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl border border-orange-200 bg-orange-50/60 flex items-center justify-center text-[#FD7100] shrink-0 mt-0.5">
                    <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-[#0F172A]">
                      Curated Products
                    </h3>
                    <p className="text-[14px] text-gray-500 mt-0.5">
                      Handpicked styles for every taste.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="why-feature flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl border border-orange-200 bg-orange-50/60 flex items-center justify-center text-[#FD7100] shrink-0 mt-0.5">
                    <Smartphone className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-[#0F172A]">
                      Easy Shopping
                    </h3>
                    <p className="text-[14px] text-gray-500 mt-0.5">
                      A smooth and simple experience.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="why-feature flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl border border-orange-200 bg-orange-50/60 flex items-center justify-center text-[#FD7100] shrink-0 mt-0.5">
                    <Truck className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-[#0F172A]">
                      Reliable Delivery
                    </h3>
                    <p className="text-[14px] text-gray-500 mt-0.5">
                      Your order, on time, always.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 5: OUR PROMISE BANNER                             */}
        {/* ========================================================= */}
        <section className="promise-section">
          <div className="promise-card relative rounded-3xl overflow-hidden border border-gray-200/80 shadow-xs min-h-[300px] sm:min-h-[360px] lg:min-h-[400px] flex items-center bg-white">
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
            <div className="promise-content relative z-10 p-8 sm:p-12 lg:p-16 max-w-xl lg:max-w-2xl space-y-3">
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
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 6: READY TO SHOP? / EXPLORE SWAGSYNC              */}
        {/* ========================================================= */}
        <section className="cta-section text-center pt-2 pb-6">
          <div className="max-w-xl mx-auto space-y-4">
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
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
