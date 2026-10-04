import React, { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

const ProductImageLightbox = ({
  images = [],
  currentIndex = 0,
  isOpen = false,
  onClose,
  onNavigate,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  // Reset zoom whenever image changes or modal closes
  useEffect(() => {
    setIsZoomed(false);
  }, [currentIndex, isOpen]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setIsZoomed(false);
    onNavigate((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setIsZoomed(false);
    onNavigate((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Touch swipe support for mobile
  const handleTouchStart = (e) => {
    if (isZoomed) return;
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (isZoomed || touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStartX(null);
  };

  if (!isOpen || !images.length) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md select-none transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Product Image Lightbox"
    >
      {/* Top Header Bar */}
      <div
        className="w-full flex items-center justify-between px-4 sm:px-8 py-4 z-10 shrink-0 bg-gradient-to-b from-black/60 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-white text-sm font-medium tracking-wide">
          <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs">
            {currentIndex + 1} / {images.length}
          </span>
          <span className="hidden sm:inline-block text-white/60 text-xs">
            Use arrows or click thumbnails to browse
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom toggle button */}
          <button
            onClick={() => setIsZoomed((prev) => !prev)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/15"
            aria-label={isZoomed ? "Zoom out" : "Zoom in"}
            title={isZoomed ? "Zoom out" : "Zoom in"}
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/15"
            aria-label="Close lightbox"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Display Area */}
      <div
        className="relative flex-1 flex items-center justify-center px-4 sm:px-16 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Previous Button */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 sm:left-6 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border border-white/20 shadow-lg"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Center Image Container */}
        <div
          className={`relative max-h-[75vh] max-w-[90vw] sm:max-w-[85vw] flex items-center justify-center overflow-auto transition-all duration-300 ${
            isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomed((prev) => !prev);
          }}
        >
          <img
            src={currentImage?.url}
            alt={`Product Full View ${currentIndex + 1}`}
            className={`max-h-[70vh] sm:max-h-[78vh] w-auto max-w-full object-contain rounded-lg transition-transform duration-300 shadow-2xl ${
              isZoomed ? 'scale-150 sm:scale-175' : 'scale-100'
            }`}
            draggable={false}
          />
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 sm:right-6 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border border-white/20 shadow-lg"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      <div
        className="w-full py-4 px-4 flex items-center justify-center gap-3 overflow-x-auto shrink-0 z-10 bg-gradient-to-t from-black/80 to-transparent scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => {
              setIsZoomed(false);
              onNavigate(idx);
            }}
            className={`relative w-14 h-18 sm:w-16 sm:h-20 rounded-lg overflow-hidden shrink-0 transition-all cursor-pointer border-2 ${
              idx === currentIndex
                ? 'border-white scale-105 shadow-md shadow-white/20 opacity-100 ring-2 ring-white/50'
                : 'border-white/20 opacity-50 hover:opacity-85 hover:border-white/60'
            }`}
          >
            <img
              src={img.url}
              alt={`Thumbnail ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductImageLightbox;
