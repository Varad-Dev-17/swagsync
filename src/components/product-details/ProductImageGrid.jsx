import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import ProductImageLightbox from './ProductImageLightbox';

const ProductImageGrid = ({ variant }) => {
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);

  if (!variant) return null;

  const images = [];
  if (variant.mainImage) images.push(variant.mainImage);
  if (variant.galleryImages && variant.galleryImages.length > 0) {
    images.push(...variant.galleryImages);
  }

  const displayImages = images.slice(0, 4);

  return (
    <>
      <div
        className="flex overflow-x-auto snap-x md:grid md:grid-cols-2 gap-3 sm:gap-4 pb-4 md:pb-0 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayImages.map((img, idx) => (
          <div
            key={idx}
            onClick={() => setActiveLightboxIndex(idx)}
            className="group relative w-[85vw] shrink-0 md:w-full aspect-[3/4] overflow-hidden bg-[#f5f5f6] snap-center cursor-pointer select-none"
            role="button"
            tabIndex={0}
            aria-label={`View full image for view ${idx + 1}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveLightboxIndex(idx);
              }
            }}
          >
            <img
              src={img.url}
              alt={`Product View ${idx + 1}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />

            {/* Subtle hover overlay with expand icon */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-end justify-end p-3 pointer-events-none">
              <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 w-8 h-8 rounded-full bg-white/90 shadow-md backdrop-blur-xs flex items-center justify-center text-gray-700">
                <Maximize2 className="w-4 h-4" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Full Screen Image Lightbox */}
      <ProductImageLightbox
        images={images}
        currentIndex={activeLightboxIndex ?? 0}
        isOpen={activeLightboxIndex !== null}
        onClose={() => setActiveLightboxIndex(null)}
        onNavigate={(newIdx) => setActiveLightboxIndex(newIdx)}
      />
    </>
  );
};

export default ProductImageGrid;

