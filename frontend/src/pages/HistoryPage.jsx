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

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="gradient-text">Reading History</span>
            </h1>
            <p className="text-muted-foreground">
              {history.length} manga in your history
            </p>
          </div>
          {history.length > 0 && (
            <Button
              variant="outline"
              className="border-red-primary text-red-primary hover:bg-red-primary hover:text-white"
              onClick={handleClearAll}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-muted-foreground mb-4">No reading history yet</p>
            <p className="text-muted-foreground mb-8">Start reading manga to see your history here</p>
            <Button
              className="bg-red-primary hover:bg-red-secondary text-white"
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
                <Card className="p-4 hover-lift bg-card border-red-primary/20 hover:border-red-primary/50 transition-all">
                  <div className="flex gap-4">
                    {/* Cover Image */}
                    <div className="flex-shrink-0 w-24 h-32 rounded overflow-hidden">
                      <img
                        src={item.coverImage}
                        alt={item.mangaTitle}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/manga-reader.png';
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold mb-2 text-foreground truncate">
                        {item.mangaTitle}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-sm text-red-primary font-semibold">
                          Chapter {item.chapterNumber}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {item.chapterTitle}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{formatDate(item.lastRead)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex flex-col gap-2">
                      <Link to={`/read/${item.chapterId}`}>
                        <Button
                          size="sm"
                          className="bg-red-primary hover:bg-red-secondary text-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Continue
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-red-primary"
                        onClick={(e) => handleRemove(item.mangaId, e)}
                      >
                        <Trash2 className="w-4 h-4" />
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
