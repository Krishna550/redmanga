import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2, ArrowLeft, ArrowRight, Loader2, BookOpen, Scroll, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/utils/api';
import { storage } from '@/utils/storage';
import { toast } from 'sonner';

const ReaderPage = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [manga, setManga] = useState(null);
  const [allChapters, setAllChapters] = useState([]);
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
  const [zoomedImageIndex, setZoomedImageIndex] = useState(null);
  const [longstripScale, setLongstripScale] = useState(1);
  const [longstripPosition, setLongstripPosition] = useState({ x: 0, y: 0 });
  const controlsTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  const imageRefs = useRef([]);
  const lastTap = useRef(0);
  const imageRef = useRef(null);
  const zoomedImageRef = useRef(null);

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
      
      // Load all chapters for navigation
      const chaptersData = await api.getMangaChapters(chapterData.mangaId);
      setAllChapters(chaptersData);
      
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
    if (!isFullscreen && !isDragging) {
      setShowControls(true);
    }
  };

  const handleContainerClick = (e) => {
    // Don't handle clicks when dragging or on buttons
    if (isDragging) return;
    if (e.target.closest('button') || e.target.closest('[role="button"]')) {
      return;
    }
    
    // Single tap shows/hides controls (only if not zoomed or in fullscreen)
    if (isFullscreen || (readingMode === 'longstrip' && longstripScale === 1)) {
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

  // Double tap to zoom (for paged mode)
  const handleDoubleTap = (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap.current;
    
    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected
      if (scale === 1) {
        setScale(2);
        // Center zoom on tap location
        const rect = containerRef.current.getBoundingClientRect();
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

  // Double tap to zoom for longstrip mode (entire viewport zoom)
  const handleLongstripDoubleTap = (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap.current;
    
    if (tapLength < 300 && tapLength > 0) {
      // Double tap detected - zoom entire viewport
      e.preventDefault();
      e.stopPropagation();
      
      if (longstripScale > 1) {
        // Zoom out
        setLongstripScale(1);
        setLongstripPosition({ x: 0, y: 0 });
      } else {
        // Zoom in
        setLongstripScale(2);
        // Center zoom on tap location relative to viewport
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          setLongstripPosition({ 
            x: -(x * 2 - rect.width / 2), 
            y: -(y * 2 - rect.height / 2) 
          });
        }
      }
    } else {
      // Single tap - handled by handleContainerClick
    }
    lastTap.current = currentTime;
  };

  // Drag to pan when zoomed (paged mode)
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

  // Drag to pan when zoomed (longstrip mode - entire viewport)
  const handleLongstripMouseDown = (e) => {
    if (longstripScale > 1) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setDragStart({ x: clientX - longstripPosition.x, y: clientY - longstripPosition.y });
    }
  };

  const handleLongstripMouseMove = (e) => {
    if (isDragging && longstripScale > 1) {
      e.preventDefault();
      e.stopPropagation();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setLongstripPosition({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y
      });
    }
  };

  const handleLongstripMouseUp = (e) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDragging(false);
  };

  // Get next and previous chapter
  const getCurrentChapterIndex = () => {
    return allChapters.findIndex(ch => ch.id === chapterId);
  };

  const getNextChapter = () => {
    const currentIndex = getCurrentChapterIndex();
    if (currentIndex >= 0 && currentIndex < allChapters.length - 1) {
      return allChapters[currentIndex + 1];
    }
    return null;
  };

  const getPreviousChapter = () => {
    const currentIndex = getCurrentChapterIndex();
    if (currentIndex > 0) {
      return allChapters[currentIndex - 1];
    }
    return null;
  };

  const navigateToChapter = (chapterId) => {
    navigate(`/read/${chapterId}`);
  };

  const navigateToMangaDetail = () => {
    if (manga) {
      navigate(`/manga/${manga.id}`);
    } else {
      navigate('/');
    }
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
  const nextChapter = getNextChapter();
  const previousChapter = getPreviousChapter();

  return (
    <div
      className="reader-container relative w-screen h-screen bg-background overflow-hidden"
      onMouseMove={handleMouseMove}
      onClick={handleContainerClick}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {readingMode === 'longstrip' ? (
        /* Long Strip Mode */
        <div
          ref={containerRef}
          className="w-full h-full overflow-hidden relative"
          onClick={(e) => {
            if (!isDragging && longstripScale === 1) {
              handleLongstripDoubleTap(e);
            }
          }}
          onMouseDown={handleLongstripMouseDown}
          onMouseMove={handleLongstripMouseMove}
          onMouseUp={handleLongstripMouseUp}
          onMouseLeave={handleLongstripMouseUp}
          onTouchStart={handleLongstripMouseDown}
          onTouchMove={handleLongstripMouseMove}
          onTouchEnd={handleLongstripMouseUp}
          style={{ 
            cursor: longstripScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            touchAction: longstripScale > 1 ? 'none' : 'auto'
          }}
        >
          <div 
            className="w-full h-full overflow-y-auto overflow-x-hidden"
            style={{ 
              scrollBehavior: longstripScale > 1 ? 'auto' : 'smooth',
              transform: `scale(${longstripScale}) translate(${longstripPosition.x / longstripScale}px, ${longstripPosition.y / longstripScale}px)`,
              transformOrigin: 'top left',
              transition: isDragging ? 'none' : 'transform 0.3s ease',
              pointerEvents: longstripScale > 1 ? 'none' : 'auto'
            }}
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
                        userSelect: 'none',
                        pointerEvents: 'none'
                      }}
                      draggable={false}
                      onError={(e) => {
                        console.error(`Failed to load page ${index + 1}`);
                        e.target.style.backgroundColor = '#1a1a1a';
                        e.target.style.minHeight = '800px';
                      }}
                    />
                  </div>
                );
              })}
              
              {/* Chapter Navigation at the end */}
              <div className="w-full bg-card border-t-2 border-red-primary/30 p-8" style={{ pointerEvents: 'auto' }}>
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-2xl font-bold text-center mb-6 text-foreground">
                    Chapter {chapter.chapterNumber} Complete
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    {previousChapter ? (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToChapter(previousChapter.id);
                        }}
                        className="w-full sm:w-auto bg-red-primary/20 hover:bg-red-primary text-white border border-red-primary/50"
                        size="lg"
                      >
                        <ChevronLeft className="w-5 h-5 mr-2" />
                        Previous Chapter
                      </Button>
                    ) : (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToMangaDetail();
                        }}
                        className="w-full sm:w-auto bg-red-primary/20 hover:bg-red-primary text-white border border-red-primary/50"
                        size="lg"
                      >
                        <Home className="w-5 h-5 mr-2" />
                        Back to Manga
                      </Button>
                    )}
                    
                    {nextChapter ? (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToChapter(nextChapter.id);
                        }}
                        className="w-full sm:w-auto bg-red-primary hover:bg-red-secondary text-white"
                        size="lg"
                      >
                        Next Chapter
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToMangaDetail();
                        }}
                        className="w-full sm:w-auto bg-red-primary hover:bg-red-secondary text-white"
                        size="lg"
                      >
                        <Home className="w-5 h-5 mr-2" />
                        Back to Manga
                      </Button>
                    )}
                  </div>
                  
                  {nextChapter && (
                    <div className="mt-6 text-center text-muted-foreground">
                      <p className="text-sm">Next: Chapter {nextChapter.chapterNumber}</p>
                      <p className="text-xs">{nextChapter.title}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Paged Mode */
        <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden">
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
          
          {/* Chapter Navigation at last page */}
          {currentPage === totalPages - 1 && (
            <div className="absolute bottom-20 left-0 right-0 z-30 px-4">
              <div className="max-w-2xl mx-auto bg-card/95 backdrop-blur-sm border-2 border-red-primary/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-center mb-4 text-foreground">
                  Chapter {chapter.chapterNumber} Complete
                </h3>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {previousChapter && (
                    <Button
                      onClick={() => navigateToChapter(previousChapter.id)}
                      className="w-full sm:w-auto bg-red-primary/20 hover:bg-red-primary text-white border border-red-primary/50"
                      size="sm"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                  )}
                  
                  {nextChapter ? (
                    <Button
                      onClick={() => navigateToChapter(nextChapter.id)}
                      className="w-full sm:w-auto bg-red-primary hover:bg-red-secondary text-white"
                      size="sm"
                    >
                      Next Chapter
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={navigateToMangaDetail}
                      className="w-full sm:w-auto bg-red-primary hover:bg-red-secondary text-white"
                      size="sm"
                    >
                      <Home className="w-4 h-4 mr-1" />
                      Back to Manga
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Controls Bar */}
      <div
        data-reader-topbar="true"
        className={`fixed top-0 left-0 right-0 glass-strong transition-all duration-300 z-40 ${
          showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
        style={{ border: 'none', boxShadow: 'none' }}
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
              <div className="text-sm font-semibold text-foreground leading-tight">
                {manga.title}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Chapter {chapter.chapterNumber}
              </div>
              <div className="text-xs text-muted-foreground">
                {chapter.title}
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

      {/* Progress Bar - Only show in longstrip mode when controls are visible */}
      {readingMode === 'longstrip' && showControls && scrollProgress > 0 && (
        <div className="fixed bottom-0 left-0 right-0 h-1 bg-muted/20 z-30">
          <div
            className="h-full bg-gradient-to-r from-red-primary to-red-secondary"
            style={{ width: `${scrollProgress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default ReaderPage;
