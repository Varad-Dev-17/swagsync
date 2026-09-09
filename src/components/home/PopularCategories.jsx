import { Link } from "react-router-dom";
import { ChevronRight, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

const PopularCategories = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${(import.meta.env.PROD ? '' : 'http://localhost:8000')}/categories`, {
          params: { status: 'Active', limit: 8 }
        });
        if (response.data.success) {
          setCategories(response.data.categories || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);
  return (
    <section className="pt-16 sm:pt-20 md:pt-28 pb-4 bg-white px-4 md:px-8 lg:px-12 max-w-[1360px] mx-auto">
      <div className="flex flex-col items-center text-center mb-8 md:mb-12">
        <h2 className="text-3xl sm:text-4xl md:text-[42px] lg:text-[48px] font-extrabold text-[#111827] tracking-[-0.02em]">Explore Categories</h2>
      </div>

      <div className="relative">
        {isLoading ? (
          <div className="flex justify-center items-center w-full py-6">
             <div className="w-8 h-8 border-2 border-[#FD7100] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-x-2 xs:gap-x-3 sm:gap-x-4 lg:gap-x-6 gap-y-4 xs:gap-y-5 sm:gap-y-6 lg:gap-y-0 w-full">
            {categories.map((cat, index) => (
              <Link 
                key={cat._id || index} 
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center gap-1.5 sm:gap-2.5 group"
              >
                <div className="w-[66px] h-[66px] xs:w-[74px] xs:h-[74px] sm:w-[90px] sm:h-[90px] md:w-[100px] md:h-[100px] lg:w-[105px] lg:h-[105px] rounded-full overflow-hidden bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 border border-gray-100">
                  {cat.image?.url ? (
                    <img 
                      src={cat.image.url} 
                      alt={cat.name} 
                      className="w-full h-full object-contain p-0 mix-blend-multiply group-hover:scale-110 transition-transform duration-300"
                      loading="lazy" decoding="async" />
                  ) : (
                    <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 group-hover:scale-110 transition-transform duration-300" />
                  )}
                </div>
                <span className="text-[11px] xs:text-xs md:text-sm font-semibold text-[#111827] text-center line-clamp-1 max-w-full px-0.5">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PopularCategories;
