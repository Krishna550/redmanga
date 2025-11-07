import { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';

export const ThumbnailStrip = ({ imageUrls, currentPage, onPageSelect }) => {
  const thumbnailRefs = useRef([]);
  const containerRef = useRef(null);

  // Auto-scroll to current thumbnail
  useEffect(() => {
    if (thumbnailRefs.current[currentPage] && containerRef.current) {
      const thumbnail = thumbnailRefs.current[currentPage];
      const container = containerRef.current;
      const thumbnailLeft = thumbnail.offsetLeft;
      const thumbnailWidth = thumbnail.offsetWidth;
      const containerWidth = container.offsetWidth;

      // Center the current thumbnail
      container.scrollTo({
        left: thumbnailLeft - containerWidth / 2 + thumbnailWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [currentPage]);

  return (
    <div className="glass-strong animate-slide-up py-4 px-2">
      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto overflow-y-hidden px-2 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {imageUrls.map((url, index) => {
          // Use proxy for external images to bypass CORS
          const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
          let thumbnailUrl;
          if (url.startsWith('http')) {
            thumbnailUrl = `${BACKEND_URL}/api/proxy-image?url=${encodeURIComponent(url)}`;
          } else if (url.startsWith('data:')) {
            thumbnailUrl = url;
          } else {
            // It's base64 without prefix
            thumbnailUrl = `data:image/jpeg;base64,${url}`;
          }
          
          return (
            <div
              key={index}
              ref={(el) => (thumbnailRefs.current[index] = el)}
              className="flex-shrink-0"
            >
              <Card
                onClick={() => onPageSelect(index)}
                className={`cursor-pointer overflow-hidden transition-all duration-300 ${
                  index === currentPage
                    ? 'ring-2 ring-primary shadow-glow scale-105'
                    : 'ring-1 ring-border/50 hover:ring-secondary hover:scale-105'
                }`}
              >
                <div className="relative w-20 h-28 sm:w-24 sm:h-32">
                  <img
                    src={thumbnailUrl}
                    alt={`Page ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-2">
                    <span className="text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                  </div>
                  {index === currentPage && (
                    <div className="absolute inset-0 bg-primary/20 pointer-events-none"></div>
                  )}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ThumbnailStrip;
