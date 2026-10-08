import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const privacySections = [
  {
    number: "1",
    title: "Information We Collect",
    content:
      "We collect information that you provide to us directly, such as when you create an account, place an order, subscribe to our newsletter or contact our support team. This may include your name, contact details, shipping address, payment information and other necessary details.",
  },
  {
    number: "2",
    title: "How We Use Your Information",
    content:
      "We use the information we collect to process and deliver your orders, provide customer support, improve our products and services, send order updates and promotional offers (with your consent), and ensure a safe and secure shopping experience.",
  },
  {
    number: "3",
    title: "Information Sharing",
    content:
      "We do not sell your personal information. We may share your information with trusted third-party service providers such as payment partners, logistics companies and analytics services, only to the extent necessary to deliver our services.",
  },
  {
    number: "4",
    title: "Cookies and Tracking Technologies",
    content:
      "We use cookies and similar technologies to improve your browsing experience, understand how you use our platform and show relevant products and offers. You can manage your cookie preferences through your browser settings.",
  },
  {
    number: "5",
    title: "Data Security",
    content:
      "We take reasonable security measures to protect your personal information from unauthorized access, misuse or disclosure. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
  },
  {
    number: "6",
    title: "Contact Us",
    content: (
      <>
        If you have any questions or concerns about this Privacy Policy, please reach out to us at{" "}
        <a
          href="mailto:support@swagsync.com"
          className="text-[#FD7100] font-semibold hover:underline"
        >
          support@swagsync.com
        </a>
        .
      </>
    ),
  },
];

const LegalPrivacy = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();

      // Hero Timeline
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl
        .from(".privacy-hero-bg", { scale: 1.06, duration: 1.2, ease: "power2.out" })
        .from(".privacy-hero-title", { y: 25, opacity: 0, duration: 0.75 }, "-=0.8")
        .from(".privacy-hero-divider", { scaleX: 0, transformOrigin: "left", duration: 0.6 }, "-=0.45")
        .from(".privacy-hero-content", { y: 20, opacity: 0, duration: 0.65 }, "-=0.35");

      // Content Header
      gsap.from(".privacy-intro > *", {
        scrollTrigger: {
          trigger: ".privacy-intro",
          start: "top 85%",
        },
        y: 25,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
      });

      // Policy Items Stagger
      gsap.from(".privacy-item", {
        scrollTrigger: {
          trigger: ".privacy-list",
          start: "top 82%",
        },
        y: 30,
        opacity: 0,
        duration: 0.65,
        stagger: 0.1,
        ease: "power3.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="bg-white min-h-screen text-[#111827] pt-[62px] sm:pt-[68px] lg:pt-[70px] pb-24 overflow-hidden"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* ========================================================= */}
      {/* TOP HERO BANNER (Full Page Viewport, Edge-to-Edge)        */}
      {/* ========================================================= */}
      <section className="privacy-hero-section relative w-full min-h-[calc(100vh-62px)] sm:min-h-[calc(100vh-68px)] lg:min-h-[calc(100vh-70px)] bg-black overflow-hidden flex items-center">
        {/* Full-bleed Hero Image across viewport */}
        <img
          src="/privacypolicy/hero.png"
          alt="Privacy Policy - SwagSync"
          className="privacy-hero-bg absolute inset-0 w-full h-full object-cover object-[center_30%] select-none"
          loading="eager"
        />

        {/* Cinematic gradient overlay on left for punchy white text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 sm:via-black/35 to-transparent pointer-events-none" />

        {/* Content Container aligned with site grid */}
        <div className="relative z-10 w-full max-w-[1460px] mx-auto px-6 sm:px-10 lg:px-14 py-12">
          <div className="max-w-[600px] text-white">
            <h1 className="privacy-hero-title text-5xl sm:text-6xl md:text-[68px] lg:text-[76px] font-black tracking-tight leading-tight">
              Privacy Policy
            </h1>

            {/* Thin underline separator */}
            <div className="privacy-hero-divider w-full max-w-[400px] sm:max-w-[480px] h-[1.5px] bg-white/40 my-5 sm:my-6" />

            <div className="privacy-hero-content space-y-3">
              <h2 className="text-[20px] sm:text-[22px] lg:text-[24px] font-bold tracking-tight text-white">
                Your privacy matters to us.
              </h2>
              <p className="text-[15px] sm:text-[16px] lg:text-[17px] text-white/90 leading-relaxed font-normal max-w-[540px]">
                We respect your privacy and are committed to keeping your personal
                information safe while you shop with SwagSync.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* LOWER CONTENT SECTION (Single-column Editorial Layout)    */}
      {/* ========================================================= */}
      <div className="max-w-[960px] mx-auto px-6 sm:px-10 pt-16 sm:pt-20 space-y-12 sm:space-y-14">
        {/* Section Intro Header */}
        <div className="privacy-intro space-y-3">
          <span className="inline-block text-[#FD7100] text-[13px] sm:text-[14px] font-extrabold tracking-widest uppercase">
            PRIVACY POLICY
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-[#0F172A] tracking-tight leading-tight">
            Privacy Policy
          </h2>

          <p className="text-[15px] sm:text-[16px] text-gray-600 leading-relaxed font-normal pt-1">
            At SwagSync, we value your trust. This Privacy Policy explains how we
            collect, use, share and protect your personal information when you use
            our website or mobile application.
          </p>
        </div>

        {/* Numbered Policy Clauses (1 to 6) */}
        <div className="privacy-list divide-y divide-gray-100">
          {privacySections.map((section) => (
            <div
              key={section.number}
              className="privacy-item flex items-start gap-5 sm:gap-7 py-8 sm:py-9 first:pt-4 last:pb-0 group"
            >
              {/* Soft Cream/Peach Circle Badge */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#FFF4EA] text-[#0F172A] font-bold text-[16px] sm:text-[17px] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                {section.number}
              </div>

              {/* Text Block */}
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="text-[17px] sm:text-[18px] font-bold text-[#0F172A] leading-snug">
                  {section.title}
                </h3>
                <p className="text-[13.5px] sm:text-[14px] text-gray-500 leading-relaxed mt-1.5 font-normal">
                  {section.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LegalPrivacy;
