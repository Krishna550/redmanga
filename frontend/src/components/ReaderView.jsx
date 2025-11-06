import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2, Grid3x3, Download } from 'lucide-react';
import ThumbnailStrip from '@/components/ThumbnailStrip';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const ReaderView = ({ imageUrls, currentPage, onPageChange, onExit }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const controlsTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  const imageRefs = useRef([]);

  const totalPages = imageUrls.length;

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle keyboard shortcuts (only fullscreen toggle and escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          exitFullscreen();
        }
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  // Track scroll position and update progress
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    setScrollProgress(progress);

    // Determine which page is currently in view
    let currentIndex = 0;
    const viewportCenter = scrollTop + container.clientHeight / 2;

    for (let i = 0; i < imageRefs.current.length; i++) {
      const img = imageRefs.current[i];
      if (img) {
        const imgTop = img.offsetTop;
        const imgBottom = imgTop + img.offsetHeight;
        if (viewportCenter >= imgTop && viewportCenter < imgBottom) {
          currentIndex = i;
          break;
        }
      }
    }

    if (currentIndex !== activePageIndex) {
      setActivePageIndex(currentIndex);
      onPageChange(currentIndex);
    }
  }, [activePageIndex, onPageChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        toast.success('Fullscreen enabled');
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        toast.success('Fullscreen disabled');
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      toast.error('Fullscreen not supported');
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    if (!isFullscreen) {
      setShowControls(true);
    }
  };

  const handleContainerClick = (e) => {
    // Only toggle controls in fullscreen mode
    if (isFullscreen) {
      // Don't toggle if clicking on buttons or interactive elements
      if (e.target.closest('button') || e.target.closest('[role="button"]')) {
        return;
      }
      setShowControls(!showControls);
    }
  };

  const handleDownloadChapter = async () => {
    setIsDownloading(true);
    toast.info('Preparing chapter for download...');

    try {
      const zip = new JSZip();
      const folder = zip.folder('manga_chapter');

      // Fetch all images and add to zip (use proxy for external URLs)
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
      
      for (let i = 0; i < imageUrls.length; i++) {
        try {
          // Use proxy for external images to bypass CORS
          const imageUrl = imageUrls[i].startsWith('http')
            ? `${BACKEND_URL}/api/proxy-image?url=${encodeURIComponent(imageUrls[i])}`
            : imageUrls[i];
          
          const response = await fetch(imageUrl);
          
          // Check if response is ok before consuming body
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          // Clone the response before reading body to avoid "body already used" error
          const blob = await response.blob();
          
          // Get file extension from URL
          const urlParts = imageUrls[i].split('.');
          const extension = urlParts[urlParts.length - 1].split('?')[0] || 'jpg';
          
          // Pad page numbers with zeros (e.g., 001, 002, etc.)
          const pageNumber = String(i + 1).padStart(3, '0');
          folder.file(`page_${pageNumber}.${extension}`, blob);
          
          toast.info(`Downloaded ${i + 1}/${imageUrls.length} pages...`);
        } catch (error) {
          console.error(`Failed to download page ${i + 1}:`, error);
          toast.error(`Failed to download page ${i + 1}`);
        }
      }

      // Generate zip file
      toast.info('Creating ZIP file...');
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Save file
      const timestamp = new Date().toISOString().slice(0, 10);
      saveAs(content, `manga_chapter_${timestamp}.zip`);
      
      toast.success(`Successfully downloaded ${imageUrls.length} pages!`);
      setIsDownloading(false);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download chapter');
      setIsDownloading(false);
    }
  };

  const handlePageSelect = (pageIndex) => {
    const targetImage = imageRefs.current[pageIndex];
    if (targetImage && containerRef.current) {
      containerRef.current.scrollTo({
        top: targetImage.offsetTop,
        behavior: 'smooth'
      });
      setShowThumbnails(false);
    }
  };

  return (
    <div
      className="relative w-screen h-screen bg-background overflow-hidden"
      onMouseMove={handleMouseMove}
      onClick={handleContainerClick}
    >
      {/* Scrollable Long Strip Container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-auto overflow-x-hidden"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* All Images in Vertical Strip */}
        <div className="w-full">
          {imageUrls.map((url, index) => {
            // Use proxy for external images (mangapark, etc.) to bypass CORS
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
            const imageUrl = url.startsWith('http') 
              ? `${BACKEND_URL}/api/proxy-image?url=${encodeURIComponent(url)}`
              : url;
            
            return (
              <div
                key={index}
                ref={(el) => (imageRefs.current[index] = el)}
                className="w-full"
                style={{ margin: 0, padding: 0, display: 'block' }}
              >
                <img
                  src={imageUrl}
                  alt={`Manga page ${index + 1}`}
                  className="w-full h-auto block"
                  style={{ 
                    margin: 0, 
                    padding: 0, 
                    display: 'block',
                    userSelect: 'none'
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Controls Bar */}
      <div
        className={`absolute top-0 left-0 right-0 glass-strong transition-all duration-300 z-40 ${
          showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onExit();
            }}
            variant="ghost"
            size="icon"
            className="text-foreground hover:text-primary hover:bg-primary/10"
          >
            <X className="w-6 h-6" />
          </Button>

          <div className="text-center">
            <div className="text-sm font-semibold text-foreground">
              Page {activePageIndex + 1} of {totalPages}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round(scrollProgress)}% Complete
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadChapter();
              }}
              disabled={isDownloading}
              variant="ghost"
              size="icon"
              className="text-foreground hover:text-accent hover:bg-accent/10"
              title="Download Chapter"
            >
              {isDownloading ? (
                <div className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin"></div>
              ) : (
                <Download className="w-6 h-6" />
              )}
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setShowThumbnails(!showThumbnails);
              }}
              variant="ghost"
              size="icon"
              className="text-foreground hover:text-secondary hover:bg-secondary/10"
            >
              <Grid3x3 className="w-6 h-6" />
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              variant="ghost"
              size="icon"
              className="text-foreground hover:text-primary hover:bg-primary/10"
            >
              {isFullscreen ? (
                <Minimize2 className="w-6 h-6" />
              ) : (
                <Maximize2 className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Thumbnail Strip */}
      {showThumbnails && (
        <div className="absolute bottom-0 left-0 right-0 z-50">
          <ThumbnailStrip
            imageUrls={imageUrls}
            currentPage={activePageIndex}
            onPageSelect={handlePageSelect}
          />
        </div>
      )}

      {/* Progress Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1 bg-muted/20 transition-all duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ReaderView;
