import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { storage } from '@/utils/storage';
import { Clock, Trash2, BookOpen, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const savedHistory = storage.getHistory();
    setHistory(savedHistory);
  };

  const handleSearch = (query) => {
    navigate(`/manga?search=${encodeURIComponent(query)}`);
  };

  const handleRemove = (mangaId, e) => {
    e.preventDefault();
    e.stopPropagation();
    storage.removeFromHistory(mangaId);
    loadHistory();
    toast.success('Removed from history');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all reading history?')) {
      storage.clearHistory();
      loadHistory();
      toast.success('History cleared');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={handleSearch} />

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-2">
              <span className="gradient-text">Reading History</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {history.length} manga in your history
            </p>
          </div>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="border-red-primary text-red-primary hover:bg-red-primary hover:text-white w-full sm:w-auto"
              onClick={handleClearAll}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12 sm:py-20 px-4">
            <Clock className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg sm:text-xl text-muted-foreground mb-2 sm:mb-4">No reading history yet</p>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">Start reading manga to see your history here</p>
            <Button
              className="bg-red-primary hover:bg-red-secondary text-white w-full sm:w-auto"
              onClick={() => navigate('/manga')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Manga
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {history.map((item) => (
              <Link key={item.mangaId} to={`/manga/${item.mangaId}`}>
                <Card className="p-3 sm:p-4 hover-lift bg-card border-red-primary/20 hover:border-red-primary/50 transition-all">
                  <div className="flex gap-3 sm:gap-4">
                    {/* Cover Image */}
                    <div className="flex-shrink-0 w-20 h-28 sm:w-24 sm:h-32 rounded overflow-hidden bg-red-primary/10">
                      {item.coverImage ? (
                        <img
                          src={item.coverImage.startsWith('data:') ? item.coverImage : `data:image/jpeg;base64,${item.coverImage}`}
                          alt={item.mangaTitle}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Failed to load cover image for:', item.mangaTitle);
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-red-primary" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base sm:text-xl font-bold mb-1 sm:mb-2 text-foreground truncate">
                          {item.mangaTitle}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                          <span className="text-xs sm:text-sm text-red-primary font-semibold">
                            Chapter {item.chapterNumber}
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground truncate">
                            {item.chapterTitle}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{formatDate(item.lastRead)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex flex-col gap-2">
                      <Link to={`/read/${item.chapterId}`}>
                        <Button
                          size="sm"
                          className="bg-red-primary hover:bg-red-secondary text-white text-xs sm:text-sm px-2 sm:px-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                          <span className="hidden sm:inline">Continue</span>
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-red-primary"
                        onClick={(e) => handleRemove(item.mangaId, e)}
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
