import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2, ArrowLeft, ArrowRight, Loader2, BookOpen, Scroll } from 'lucide-react';
import { api } from '@/utils/api';
import { storage } from '@/utils/storage';
import { toast } from 'sonner';

const ReaderPage = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [readingMode, setReadingMode] = useState('longstrip'); // 'longstrip' or 'paged'
  const [currentPage, setCurrentPage] = useState(0);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const controlsTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  const imageRefs = useRef([]);
  const lastTap = useRef(0);
  const imageRef = useRef(null);

  useEffect(() => {
    loadChapter();
    // Load saved reading mode
    const savedMode = localStorage.getItem('readingMode') || 'longstrip';
    setReadingMode(savedMode);
  }, [chapterId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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

  const loadChapter = async () => {
    try {
      const chapterData = await api.getChapterDetails(chapterId);
      setChapter(chapterData);
      
      const mangaData = await api.getMangaDetails(chapterData.mangaId);
      setManga(mangaData);
      
      storage.updateHistory(
        mangaData.id,
        mangaData.title,
        mangaData.coverImage,
        chapterData.id,
        chapterData.chapterNumber,
        chapterData.title,
        0
      );
    } catch (error) {
      console.error('Failed to load chapter:', error);
      toast.error('Failed to load chapter');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = useCallback(() => {
    if (!containerRef.current || readingMode !== 'longstrip') return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    setScrollProgress(progress);

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
      if (manga && chapter) {
        storage.updateHistory(
          manga.id,
          manga.title,
          manga.coverImage,
          chapter.id,
          chapter.chapterNumber,
          chapter.title,
          currentIndex
        );
      }
    }
  }, [activePageIndex, manga, chapter, readingMode]);

  useEffect(() => {
    const container = containerRef.current;
    if (container && readingMode === 'longstrip') {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll, readingMode]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      toast.error('Fullscreen not supported');
    }
  };

  const toggleReadingMode = () => {
    const newMode = readingMode === 'longstrip' ? 'paged' : 'longstrip';
    setReadingMode(newMode);
    localStorage.setItem('readingMode', newMode);
    if (newMode === 'paged') {
      setCurrentPage(activePageIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
    toast.success(`Switched to ${newMode === 'longstrip' ? 'Long Strip' : 'Paged'} mode`);
  };

  const handleMouseMove = () => {
    if (!isFullscreen) {
      setShowControls(true);
    }
  };

  const handleContainerClick = (e) => {
    if (isFullscreen) {
      if (e.target.closest('button') || e.target.closest('[role="button"]')) {
        return;
      }
      setShowControls(!showControls);
    }
  };

  const handleExit = () => {
    if (manga) {
      navigate(`/manga/${manga.id}`);
    } else {
      navigate('/');
    }
  };

  const nextPage = () => {
    if (chapter && currentPage < chapter.pages.length - 1) {
      setCurrentPage(currentPage + 1);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Double tap to zoom
  const handleDoubleTap = (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap.current;
    
    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      if (scale === 1) {
        setScale(2);
        // Center zoom on tap location
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setPosition({ 
          x: -(x * 2 - rect.width / 2), 
          y: -(y * 2 - rect.height / 2) 
        });
      } else {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    }
    lastTap.current = currentTime;
  };

  // Drag to pan when zoomed
  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMoveImage = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-red-primary animate-spin" />
      </div>
    );
  }

  if (!chapter || !manga) {
    return (
      <div className="w-screen h-screen bg-background flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Chapter not found</p>
      </div>
    );
  }

  const totalPages = chapter.pages.length;

  return (
    <div
      className="relative w-screen h-screen bg-background overflow-hidden"
      onMouseMove={handleMouseMove}
      onClick={handleContainerClick}
    >
      {readingMode === 'longstrip' ? (
        /* Long Strip Mode */
        <div
          ref={containerRef}
          className="w-full h-full overflow-y-auto overflow-x-hidden"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="w-full">
            {chapter.pages.map((page, index) => {
              // Format image src - add data URI prefix if it's just base64
              const imageSrc = page.startsWith('data:') || page.startsWith('http') 
                ? page 
                : `data:image/jpeg;base64,${page}`;
              
              return (
                <div
                  key={index}
                  ref={(el) => (imageRefs.current[index] = el)}
                  className="w-full"
                  style={{ margin: 0, padding: 0, display: 'block' }}
                >
                  <img
                    src={imageSrc}
                    alt={`Page ${index + 1}`}
                    className="w-full h-auto block"
                    style={{
                      margin: 0,
                      padding: 0,
                      display: 'block',
                      userSelect: 'none'
                    }}
                    onClick={handleDoubleTap}
                    onError={(e) => {
                      console.error(`Failed to load page ${index + 1}`);
                      e.target.style.backgroundColor = '#1a1a1a';
                      e.target.style.minHeight = '800px';
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Paged Mode */
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          <div 
            className="relative w-full h-full flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMoveImage}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <img
              ref={imageRef}
              src={
                chapter.pages[currentPage].startsWith('data:') || chapter.pages[currentPage].startsWith('http')
                  ? chapter.pages[currentPage]
                  : `data:image/jpeg;base64,${chapter.pages[currentPage]}`
              }
              alt={`Page ${currentPage + 1}`}
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transition: isDragging ? 'none' : 'transform 0.3s ease',
                userSelect: 'none'
              }}
              onClick={handleDoubleTap}
              draggable={false}
              onError={(e) => {
                console.error(`Failed to load page ${currentPage + 1}`);
                toast.error('Failed to load page');
              }}
            />
          </div>
          
          {/* Navigation Arrows */}
          {currentPage > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevPage();
              }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-4 rounded-full transition-all z-30"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          
          {currentPage < totalPages - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextPage();
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-4 rounded-full transition-all z-30"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* Top Controls Bar */}
      <div
        className={`absolute top-0 left-0 right-0 glass-strong transition-all duration-300 z-40 ${
          showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleExit();
              }}
              variant="ghost"
              size="icon"
              className="text-foreground hover:text-red-primary hover:bg-red-primary/10"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <div className="text-sm font-semibold text-foreground">
                {manga.title}
              </div>
              <div className="text-xs text-muted-foreground">
                Chapter {chapter.chapterNumber} {chapter.title}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-sm font-semibold text-foreground">
                Page {readingMode === 'paged' ? currentPage + 1 : activePageIndex + 1} / {totalPages}
              </div>
              {readingMode === 'longstrip' && (
                <div className="text-xs text-muted-foreground">
                  {Math.round(scrollProgress)}%
                </div>
              )}
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                toggleReadingMode();
              }}
              variant="ghost"
              size="icon"
              className="text-foreground hover:text-red-primary hover:bg-red-primary/10"
              title={`Switch to ${readingMode === 'longstrip' ? 'Paged' : 'Long Strip'} mode`}
            >
              {readingMode === 'longstrip' ? (
                <BookOpen className="w-6 h-6" />
              ) : (
                <Scroll className="w-6 h-6" />
              )}
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              variant="ghost"
              size="icon"
              className="text-foreground hover:text-red-primary hover:bg-red-primary/10"
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

      {/* Progress Bar */}
      {readingMode === 'longstrip' && (
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 bg-muted/20 transition-all duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="h-full bg-gradient-to-r from-red-primary to-red-secondary transition-all duration-300"
            style={{ width: `${scrollProgress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default ReaderPage;
