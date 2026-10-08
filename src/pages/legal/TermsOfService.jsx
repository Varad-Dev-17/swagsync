import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Headphones,
  ArrowRight,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const termsClauses = [
  {
    number: "01",
    title: "Using Our Platform",
    content:
      "You may use SwagSync only for lawful purposes and in a way that does not harm other users, sellers or our services.",
  },
  {
    number: "02",
    title: "Accounts",
    content:
      "You are responsible for keeping your account information secure. Any activity that happens in your account is your responsibility.",
  },
  {
    number: "03",
    title: "Products, Orders & Payments",
    content:
      "We strive to provide accurate product information, pricing and availability. Orders are subject to confirmation. Payments must be made through our supported secure payment methods.",
  },
  {
    number: "04",
    title: "Returns & Refunds",
    content: (
      <>
        Our return and refund policy is available on the{" "}
        <Link
          to="/account/orders"
          className="text-[#FD7100] font-semibold hover:underline"
        >
          Returns & Refunds
        </Link>{" "}
        page. Please review it for eligibility, timelines and process details.
      </>
    ),
  },
  {
    number: "05",
    title: "Intellectual Property",
    content:
      "All content on SwagSync, including text, images, logos and designs, is owned by SwagSync or its partners and may not be used without permission.",
  },
  {
    number: "06",
    title: "Limitation of Liability",
    content:
      "SwagSync is not liable for any indirect, incidental or consequential damages arising from the use of our platform. Our total liability is limited to the extent permitted by applicable law.",
  },
];

const TermsOfService = () => {
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

      // Hero Timeline
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl
        .from(".terms-title", { y: 30, opacity: 0, duration: 0.75 })
        .from(".terms-subtitle", { y: 20, opacity: 0, duration: 0.65 }, "-=0.35")
        .from(".terms-hero-img", { x: 40, opacity: 0, duration: 0.85 }, "-=0.6");

      // Commitment Column
      gsap.from(".terms-commitment > *", {
        scrollTrigger: {
          trigger: ".terms-commitment",
          start: "top 85%",
        },
        y: 30,
        opacity: 0,
        duration: 0.75,
        stagger: 0.14,
        ease: "power3.out",
      });

      // Clauses Stagger
      gsap.from(".clause-item", {
        scrollTrigger: {
          trigger: ".clauses-list",
          start: "top 80%",
        },
        y: 35,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
      });

      // Bottom Question Card
      gsap.from(".terms-help-card", {
        scrollTrigger: {
          trigger: ".terms-help-card",
          start: "top 88%",
        },
        scale: 0.96,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="bg-white min-h-screen text-[#111827] pt-[62px] sm:pt-[68px] lg:pt-[70px] pb-20 overflow-hidden"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* ========================================================= */}
      {/* FULL-WIDTH HERO SECTION (Edge-to-Edge, No Border)         */}
      {/* ========================================================= */}
      <section className="terms-hero-section relative w-full min-h-[calc(100vh-70px)] flex items-center bg-white overflow-hidden">
        {/* Full-bleed Hero Image across entire viewport */}
        <img
          src="/termsofservices/hero.png"
          alt="Terms of Service - SwagSync"
          className="terms-hero-img absolute inset-0 w-full h-full object-cover object-right select-none"
          loading="eager"
        />

        {/* Soft gradient overlay on left for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 sm:via-white/50 to-transparent sm:w-3/5 pointer-events-none" />

        {/* Content container aligned with main site grid */}
        <div className="relative z-10 w-full max-w-[1490px] mx-auto px-6 sm:px-9 lg:px-12 py-12 lg:py-16">
          <div className="max-w-[460px] sm:max-w-[480px] lg:max-w-[500px] space-y-4 sm:space-y-5">
            <span className="inline-block text-[#FD7100] text-[14px] sm:text-[15px] font-extrabold tracking-widest uppercase">
              TRANSPARENT &amp; FAIR GUIDELINES
            </span>

            <h1 className="terms-title text-4xl sm:text-5xl md:text-[54px] lg:text-[60px] xl:text-[64px] font-black text-[#0F172A] leading-[1.08] tracking-tight sm:whitespace-nowrap">
              Terms of Service
            </h1>

            <p className="terms-subtitle text-[15px] sm:text-[16.5px] lg:text-[17.5px] text-gray-600 leading-relaxed font-normal max-w-[460px]">
              Simple, transparent guidelines and commitments designed to keep your
              online shopping experience safe, fair, and enjoyable across every
              order you place with SwagSync.
            </p>

            <div className="pt-1.5 flex items-center gap-2.5 text-[14px] sm:text-[14.5px] text-gray-500 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0" />
              <span>Effective for all customers &bull; Updated for 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* LOWER CONTENT CONTAINER (Clauses & Support)              */}
      {/* ========================================================= */}
      <div className="max-w-[1490px] mx-auto px-6 sm:px-9 lg:px-12 pt-12 sm:pt-16 lg:pt-20 space-y-16 sm:space-y-24 lg:space-y-28">
        {/* ========================================================= */}
        {/* MAIN CLAUSES SECTION                                      */}
        {/* ========================================================= */}
        <section className="pt-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Column: Our Commitment & Arch Image */}
            <div className="terms-commitment lg:col-span-4 space-y-4 lg:sticky lg:top-24 -mt-2 lg:-mt-4">
              <div>
                {/* Orange Dash Accent */}
                <div className="w-[85px] sm:w-[95px] h-1.5 bg-[#FD7100] rounded-full mb-3" />

                <h2 className="text-[30px] sm:text-[38px] lg:text-[44px] xl:text-[46px] font-black text-[#0F172A] leading-tight sm:whitespace-nowrap">
                  Our Commitment
                </h2>

                <p className="text-[12.5px] sm:text-[13px] text-gray-500 leading-relaxed font-normal mt-3">
                  These Terms of Service (&ldquo;Terms&rdquo;) explain how
                  SwagSync works and what you can expect when you use our
                  platform. By accessing or using SwagSync, you agree to these
                  Terms and our Privacy Policy.
                </p>
              </div>

              {/* Arch Shaped Image Container with Floating Bag Badge */}
              <div className="relative pt-0">
                <div className="w-full max-w-[280px] sm:max-w-[320px] mx-auto lg:mx-0 aspect-[3/4] rounded-t-[140px] rounded-b-3xl overflow-hidden shadow-lg border border-gray-100 bg-white group">
                  <img
                    src="/termsofservices/ourcommitment.png"
                    alt="Our Commitment - Clothing Collection"
                    className="w-full h-full object-cover select-none transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Floating Orange Bag Badge */}
                <div className="absolute bottom-6 right-2 sm:right-6 lg:-right-3 w-14 h-14 rounded-full bg-white shadow-lg border border-orange-100 flex items-center justify-center text-[#FD7100] transition-transform hover:scale-110">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Numbered Timeline (01 to 06) */}
            <div className="clauses-list lg:col-span-8 space-y-6 sm:space-y-7 lg:pl-6 lg:pt-[16px]">
              {termsClauses.map((clause) => (
                <div
                  key={clause.number}
                  className="clause-item flex items-center gap-5 sm:gap-7 group"
                >
                  {/* Number Badge */}
                  <span className="text-[24px] sm:text-[28px] font-extrabold text-[#94A3B8]/60 font-mono tracking-tight shrink-0 w-10 select-none group-hover:text-[#FD7100]/60 transition-colors">
                    {clause.number}
                  </span>

                  {/* Bullet Dot */}
                  <div className="shrink-0">
                    <span className="block w-2 h-2 rounded-full bg-[#FD7100] shadow-xs" />
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] sm:text-[15.5px] font-bold text-[#0F172A] leading-snug">
                      {clause.title}
                    </h3>
                    <p className="text-[12.5px] sm:text-[13px] text-gray-500 leading-relaxed mt-1 font-normal">
                      {clause.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* BOTTOM QUESTION / SUPPORT CARD                            */}
        {/* ========================================================= */}
        <section className="pt-4">
          <div className="terms-help-card rounded-2xl sm:rounded-3xl bg-[#F8FAFC] border border-gray-200/80 p-6 sm:p-8 lg:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
            {/* Left: Icon & Text */}
            <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FD7100] shrink-0">
                <Headphones className="w-7 h-7 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0F172A]">
                  Still have questions?
                </h3>
                <p className="text-[14px] sm:text-[14.5px] text-gray-500 mt-0.5">
                  We&apos;re here to help. Contact our support team anytime.
                </p>
              </div>
            </div>

            {/* Right: Contact Us CTA */}
            <div className="shrink-0 w-full sm:w-auto flex justify-start sm:justify-end">
              <Link
                to="/account/support"
                onClick={handleNavClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FD7100] hover:bg-[#ea580c] active:scale-95 text-white text-[14.5px] font-semibold px-7 py-3 rounded-xl shadow-xs transition-all duration-200 cursor-pointer"
              >
                <span>Contact Us</span>
                <ArrowRight className="w-4 h-4 stroke-[2.2]" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
