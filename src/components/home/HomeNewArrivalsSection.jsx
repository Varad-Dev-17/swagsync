import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Star, ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import axios from "axios";

gsap.registerPlugin(ScrollTrigger);

const api = axios.create({
  baseURL: "",
  withCredentials: true,
});

const HomeArrivalCard = ({ product }) => {
  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  const displayPrice = product.price || product.variants?.[0]?.price || 0;
  const displayMrp = product.mrp || product.variants?.[0]?.mrp || 0;
  const firstVariantWithImage = product.variants?.find(v => v.mainImage?.url);
  const displayImages = product.images || (firstVariantWithImage ? [firstVariantWithImage.mainImage, ...(firstVariantWithImage.galleryImages || [])] : []);
  const discountPercentage = product.discountPercentage || (displayMrp > 0 && displayMrp > displayPrice ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : 0);

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex flex-col h-full bg-white cursor-pointer transition-transform duration-300 ease-out hover:-translate-y-1 block rounded-sm shadow-sm hover:shadow-md overflow-hidden"
    >
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-50">
        {displayImages?.[0]?.url && (
          <img
            src={displayImages[0].url}
            alt={product.name || product.title}
            className="w-full h-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        )}

        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {product.rating ? (
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded shadow text-[11px] font-extrabold text-[#111827]">
              <span>{product.rating}</span>
              <Star size={11} className="fill-[#FFB800] text-[#FFB800] -ml-0.5" />
              <span className="text-gray-300 font-normal">|</span>
              <span className="text-[#111827] font-bold">{product.ratingCount}</span>
            </div>
          ) : (
            <div className="bg-white px-2.5 py-1 rounded-full shadow text-[11px] font-bold text-[#111827] uppercase tracking-wider">
              New
            </div>
          )}
        </div>

        <div className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[#111827]">
          <ArrowUpRight size={16} strokeWidth={2} />
        </div>
      </div>

      <div className="p-3 bg-white flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#FD7100] mb-1 line-clamp-1">
            {product.brand?.name || product.brand}
          </h3>
          <p className="text-[14px] font-semibold text-[#111827] mb-2 line-clamp-1 group-hover:text-[#FD7100] transition-colors">
            {product.name || product.title}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100">
          <span className="text-[15px] font-extrabold text-[#111827]">
            {formatPrice(displayPrice)}
          </span>
          {displayMrp > displayPrice && (
            <>
              <span className="text-[13px] text-[#6B7280] line-through font-normal">
                {formatPrice(displayMrp)}
              </span>
              <span className="text-[12px] font-bold text-[#ff905a]">
                ({discountPercentage}% OFF)
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

const HomeNewArrivalsSection = ({ title, subtitle }) => {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchRandomProducts = async () => {
      try {
        const res = await api.get("/products?limit=12&sort=random");
        if (res.data.success) {
          setProducts(res.data.data.products || []);
        }
      } catch (error) {
        console.error("Failed to fetch random products:", error);
      }
    };
    fetchRandomProducts();
  }, []);

  useEffect(() => {
    if (products.length === 0) return;

    let mm = gsap.matchMedia();

    mm.add("all", () => {
      const track = trackRef.current;
      const container = track.parentElement;
      const getScrollAmount = () => {
        const style = window.getComputedStyle(container);
        const padding = parseFloat(style.paddingLeft || 0) + parseFloat(style.paddingRight || 0);
        return -(track.scrollWidth - container.offsetWidth + padding);
      };

      gsap.to(track, {
        x: getScrollAmount,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80px",
          end: () => `+=${Math.abs(getScrollAmount())}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
    });

    return () => mm.revert();
  }, [products]);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-white overflow-hidden relative z-10 flex flex-col justify-center h-[calc(100vh-80px)]"
    >
      <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8 lg:px-12 mb-6 sm:mb-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-4">
          <h2 className="text-3xl sm:text-[40px] md:text-[56px] lg:text-[68px] font-bold text-[#111827] leading-[1.1] tracking-[-0.02em]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[15px] md:text-[16px] font-normal text-[#6B7280] leading-[1.6] mt-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Pinned Horizontal Runway Track */}
      <div 
        className="w-full overflow-hidden px-4 md:px-8 lg:px-12 pb-6" 
      >
        <div
          ref={trackRef}
          className="flex gap-4 sm:gap-5 md:gap-6 will-change-transform w-[max-content]"
        >
          {products.map((product) => (
            <div
              key={product._id}
              className="w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px] shrink-0"
            >
              <HomeArrivalCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeNewArrivalsSection;
