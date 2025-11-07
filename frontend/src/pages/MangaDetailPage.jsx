import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/utils/api';
import { storage } from '@/utils/storage';
import { toast } from 'sonner';
import { BookOpen, Clock, User, Tag, Loader2, PlayCircle, ArrowUpDown } from 'lucide-react';

const MangaDetailPage = () => {
  const { mangaId } = useParams();
  const navigate = useNavigate();
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  useEffect(() => {
    loadMangaDetails();
    const savedProgress = storage.getProgress(mangaId);
    setProgress(savedProgress);
  }, [mangaId]);

  const loadMangaDetails = async () => {
    try {
      const [mangaData, chaptersData] = await Promise.all([
        api.getMangaDetails(mangaId),
        api.getMangaChapters(mangaId)
      ]);
      setManga(mangaData);
      setChapters(chaptersData);
    } catch (error) {
      console.error('Failed to load manga details:', error);
      toast.error('Failed to load manga details');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    navigate(`/manga?search=${encodeURIComponent(query)}`);
  };

  const handleContinueReading = () => {
    if (progress && progress.chapterId) {
      navigate(`/read/${progress.chapterId}`);
    } else if (chapters.length > 0) {
      navigate(`/read/${chapters[0].id}`);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const sortedChapters = [...chapters].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.chapterNumber - b.chapterNumber;
    } else {
      return b.chapterNumber - a.chapterNumber;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onSearch={handleSearch} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-red-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onSearch={handleSearch} />
        <div className="text-center py-20">
          <p className="text-xl text-muted-foreground">Manga not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={handleSearch} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Manga Header */}
        <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-12">
          {/* Cover Image */}
          <div className="mx-auto md:mx-0">
            <img
              src={manga.coverImage.startsWith('data:') ? manga.coverImage : `data:image/jpeg;base64,${manga.coverImage}`}
              alt={manga.title}
              className="w-full max-w-sm rounded-lg shadow-2xl shadow-red-primary/30"
              onError={(e) => {
                e.target.src = '/manga-reader.png';
              }}
            />
          </div>

          {/* Manga Info */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              {manga.title}
            </h1>
            
            <div className="flex flex-wrap gap-4 mb-6 text-muted-foreground">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-red-primary" />
                <span>{manga.author}</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-red-primary" />
                <span>{manga.totalChapters} Chapters</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-red-primary" />
                <span className="px-2 py-1 rounded-full bg-red-primary/10 text-red-primary text-sm">
                  {manga.status}
                </span>
              </div>
            </div>

            {manga.genres && manga.genres.length > 0 && (
              <div className="flex items-start mb-6">
                <Tag className="w-4 h-4 mr-2 text-red-primary mt-1" />
                <div className="flex flex-wrap gap-2">
                  {manga.genres.map((genre, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-red-primary/10 text-red-primary text-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {manga.description}
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-red-primary hover:bg-red-secondary text-white"
                onClick={handleContinueReading}
                disabled={chapters.length === 0}
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                {progress ? 'Continue Reading' : 'Start Reading'}
              </Button>
              {progress && (
                <div className="flex items-center px-4 py-2 rounded-lg bg-card border border-red-primary/20">
                  <Clock className="w-4 h-4 mr-2 text-red-primary" />
                  <span className="text-sm text-muted-foreground">
                    Last read: Chapter {progress.chapterNumber}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chapters List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">
              <span className="gradient-text">Chapters</span>
            </h2>
            {chapters.length > 0 && (
              <Button
                onClick={toggleSortOrder}
                variant="outline"
                className="border-red-primary/30 text-red-primary hover:bg-red-primary hover:text-white"
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
              </Button>
            )}
          </div>

          {chapters.length === 0 ? (
            <Card className="p-8 text-center bg-card border-red-primary/20">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">No chapters available yet</p>
            </Card>
          ) : (
            <div className="grid gap-3">
              {sortedChapters.map((chapter) => (
                <Link key={chapter.id} to={`/read/${chapter.id}`}>
                  <Card className="p-4 hover-lift bg-card border-red-primary/20 hover:border-red-primary/50 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-red-primary font-bold">
                            Chapter {chapter.chapterNumber}
                          </span>
                          <span className="text-foreground font-medium">
                            {chapter.title}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {new Date(chapter.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-primary hover:text-red-secondary"
                      >
                        <PlayCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MangaDetailPage;
