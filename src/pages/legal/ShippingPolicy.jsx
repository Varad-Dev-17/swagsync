import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Truck,
  CreditCard,
  Smartphone,
  Package,
  ArrowRight,
  ImageIcon,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const shippingCards = [
  {
    number: "01",
    title: "Shipping Locations",
    description: (
      <>
        We currently deliver across India. At the moment, we do not offer
        international shipping. If your location is not serviceable, you will be
        notified at checkout.
      </>
    ),
    image: "/shippingpolicy/shipping_locations.png",
    fallbackIcon: MapPin,
    fallbackText: "Delivery Locations Map",
    reverse: false,
  },
  {
    number: "02",
    title: "Order Processing Time",
    description: (
      <>
        Orders are typically processed and dispatched within{" "}
        <strong className="text-gray-800 font-semibold">1-2 business days</strong>{" "}
        after payment confirmation. Orders placed on weekends or public holidays
        will be processed on the next business day.
      </>
    ),
    image: "/shippingpolicy/order_processing.png",
    fallbackIcon: Calendar,
    fallbackText: "Processing & Dispatch Time",
    reverse: true,
  },
  {
    number: "03",
    title: "Delivery Time",
    description: (
      <>
        <strong className="text-gray-800 font-semibold">Once shipped</strong>,
        your order is usually delivered within{" "}
        <strong className="text-gray-800 font-semibold">3-7 business days</strong>
        , depending on your location. Delivery times may vary for remote or
        non-metro areas.
      </>
    ),
    image: "/shippingpolicy/delivery_time.png",
    fallbackIcon: Truck,
    fallbackText: "Express Courier Delivery",
    reverse: false,
  },
  {
    number: "04",
    title: "Shipping Charges",
    description: (
      <>
        Shipping charges are calculated at checkout based on your delivery
        location and order value. We may offer{" "}
        <strong className="text-gray-800 font-semibold">
          free shipping on selected products
        </strong>{" "}
        or orders above a certain amount, which will be clearly mentioned during
        checkout.
      </>
    ),
    image: "/shippingpolicy/shipping_charges.png",
    fallbackIcon: CreditCard,
    fallbackText: "Transparent Shipping Rates",
    reverse: true,
  },
  {
    number: "05",
    title: "Order Tracking",
    description: (
      <>
        Once your order is shipped, you will receive a tracking link via SMS and
        email. You can also track your order from the{" "}
        <Link
          to="/account/orders"
          className="text-[#FD7100] font-semibold hover:underline"
        >
          &ldquo;My Orders&rdquo;
        </Link>{" "}
        section in your account.
      </>
    ),
    image: "/shippingpolicy/order_tracking.png",
    fallbackIcon: Smartphone,
    fallbackText: "Live Order Tracking",
    reverse: false,
  },
  {
    number: "06",
    title: "Delivery Attempts & Delays",
    description: (
      <>
        Our courier partners usually make 2-3 delivery attempts at your address.
        If the delivery is unsuccessful, the package may be returned to us, and
        we will contact you for further assistance. Delays may occur due to
        weather conditions, high demand, courier issues, or other unforeseen
        circumstances.
      </>
    ),
    image: "/shippingpolicy/delivery_attempts.png",
    fallbackIcon: Package,
    fallbackText: "Safe Handling & Delivery Attempts",
    reverse: true,
  },
];

const ShippingPolicy = () => {
  const containerRef = useRef(null);
  const [heroError, setHeroError] = useState(false);
  const [imgErrors, setImgErrors] = useState({});

  const handleNavClick = () => {
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { immediate: false });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.refresh();

      // Hero Timeline Entrance
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl
        .from(".shipping-hero-eyebrow", { y: -20, opacity: 0, duration: 0.6 })
        .from(".shipping-hero-title", { y: 30, opacity: 0, duration: 0.8 }, "-=0.35")
        .from(".shipping-hero-desc", { y: 20, opacity: 0, duration: 0.65 }, "-=0.4");

      // Intro Header ScrollTrigger
      gsap.from(".shipping-intro > *", {
        scrollTrigger: {
          trigger: ".shipping-intro",
          start: "top 85%",
        },
        y: 25,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
      });

      // Cards ScrollTrigger Stagger
      gsap.from(".shipping-card", {
        scrollTrigger: {
          trigger: ".shipping-cards-container",
          start: "top 80%",
        },
        y: 35,
        opacity: 0,
        duration: 0.75,
        stagger: 0.15,
        ease: "power3.out",
      });

      // Help Card ScrollTrigger
      gsap.from(".shipping-help-card", {
        scrollTrigger: {
          trigger: ".shipping-help-card",
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
      className="bg-white min-h-screen text-[#111827] pt-[62px] sm:pt-[68px] lg:pt-[70px] pb-24 overflow-hidden"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* ========================================================= */}
      {/* FULL-PAGE HERO BANNER                                     */}
      {/* ========================================================= */}
      <section className="shipping-hero-section relative w-full min-h-[calc(100vh-62px)] sm:min-h-[calc(100vh-68px)] lg:min-h-[calc(100vh-70px)] bg-neutral-900 overflow-hidden flex items-center">
        {/* Full-bleed Hero Image */}
        {!heroError && (
          <img
            src="/shippingpolicy/hero.png"
            alt="Shipping Policy - SwagSync"
            className="shipping-hero-img absolute inset-0 w-full h-full object-cover object-[center_35%] select-none"
            loading="eager"
            onError={() => setHeroError(true)}
          />
        )}

        {/* Cinematic gradient overlay on left for readable white text */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 sm:via-black/45 to-transparent pointer-events-none" />

        {/* Ambient warm glow if hero image is pending */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#FD7100]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Content Container aligned with site grid */}
        <div className="relative z-10 w-full max-w-[1460px] mx-auto px-6 sm:px-10 lg:px-14 py-12">
          <div className="max-w-[580px] text-white space-y-4 sm:space-y-5">
            <span className="shipping-hero-eyebrow inline-block text-[#FD7100] text-[13px] sm:text-[14px] font-black tracking-widest uppercase">
              FAST, SAFE AND RELIABLE
            </span>

            <h1 className="shipping-hero-title text-5xl sm:text-6xl md:text-[68px] lg:text-[76px] font-black tracking-tight leading-[1.05]">
              Shipping
              <br />
              <span className="text-[#FD7100]">Policy</span>
            </h1>

            <p className="shipping-hero-desc text-[15px] sm:text-[17px] lg:text-[18px] text-white/90 leading-relaxed font-normal max-w-[480px]">
              We ensure your favourite products reach you safely and on time,
              every time.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* LOWER CONTENT SECTION                                     */}
      {/* ========================================================= */}
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-14 pt-16 sm:pt-20 lg:pt-24 space-y-16 sm:space-y-20">
        {/* Intro Header */}
        <div className="shipping-intro text-center max-w-[800px] mx-auto space-y-3.5">
          <span className="inline-block text-[#FD7100] text-[13px] sm:text-[14px] font-extrabold tracking-widest uppercase">
            OUR SHIPPING POLICY
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#0F172A] tracking-tight leading-tight">
            Delivering Happiness to Your Doorstep
          </h2>

          <p className="text-[14.5px] sm:text-[15.5px] text-gray-500 leading-relaxed font-normal">
            At SwagSync, we are committed to delivering your orders safely,
            quickly, and reliably. This Shipping Policy explains how we process,
            ship, and deliver your orders.
          </p>
        </div>

        {/* 6 Alternating Policy Cards (01 to 06) */}
        <div className="shipping-cards-container space-y-6 sm:space-y-8">
          {shippingCards.map((card) => {
            const IconComponent = card.fallbackIcon;
            return (
              <div
                key={card.number}
                className="shipping-card rounded-2xl sm:rounded-3xl bg-[#FBFBFC] border border-gray-100/90 p-6 sm:p-8 lg:p-10 shadow-xs hover:shadow-md transition-shadow"
              >
                <div
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center ${
                    card.reverse ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  {/* Left Column (Image on normal, Text on reverse) */}
                  <div
                    className={`lg:col-span-5 ${
                      card.reverse ? "lg:order-2" : "lg:order-1"
                    }`}
                  >
                    <div className="relative rounded-2xl bg-white border border-gray-100 p-6 sm:p-8 flex items-center justify-center aspect-[16/10] sm:aspect-[16/9] shadow-xs group overflow-hidden">
                      {!imgErrors[card.number] ? (
                        <img
                          src={card.image}
                          alt={card.title}
                          className="w-full h-full object-contain max-h-[180px] sm:max-h-[220px] select-none transition-transform duration-500 group-hover:scale-105"
                          onError={() => {
                            setImgErrors((prev) => ({
                              ...prev,
                              [card.number]: true,
                            }));
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-4">
                          <div className="w-14 h-14 rounded-2xl bg-[#FFF3E8] border border-orange-100 flex items-center justify-center text-[#FD7100] mb-3 group-hover:scale-110 transition-transform shadow-xs">
                            <IconComponent className="w-7 h-7 stroke-[2.2]" />
                          </div>
                          <span className="text-sm font-bold text-[#0F172A]">
                            {card.fallbackText}
                          </span>
                          <span className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5" /> Image slot ready
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column (Text on normal, Image on reverse) */}
                  <div
                    className={`lg:col-span-7 space-y-3 ${
                      card.reverse ? "lg:order-1" : "lg:order-2"
                    }`}
                  >
                    {/* Orange Number Badge + Title in Row */}
                    <div className="flex items-center gap-3 sm:gap-3.5">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FFF3E8] text-[#FD7100] font-black text-[13px] sm:text-[14px] flex items-center justify-center shrink-0 shadow-xs">
                        {card.number}
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                        {card.title}
                      </h3>
                    </div>

                    <p className="text-[14px] sm:text-[15px] text-gray-500 leading-relaxed font-normal">
                      {card.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Support / Help Banner */}
        <section className="pt-4">
          <div className="shipping-help-card rounded-2xl sm:rounded-3xl bg-[#FFF9F3] border border-orange-100 p-8 sm:p-10 lg:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
            {/* Text side */}
            <div className="space-y-1.5 text-center sm:text-left w-full sm:w-auto">
              <span className="inline-block text-[#FD7100] text-xs font-black tracking-widest uppercase">
                STILL HAVE QUESTIONS?
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                Need Help with Your Order?
              </h3>
              <p className="text-[14px] sm:text-[15px] text-gray-500 font-normal">
                If you have any questions about shipping or your order, feel
                free to contact our customer support team.
              </p>
            </div>

            {/* Action button */}
            <Link
              to="/account/support"
              onClick={handleNavClick}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#FD7100] text-white font-bold text-[14.5px] shadow-sm hover:bg-[#e06300] hover:shadow-md transition-all active:scale-[0.98] shrink-0"
            >
              <span>Contact Support</span>
              <ArrowRight className="w-4 h-4 stroke-[2.2]" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ShippingPolicy;
