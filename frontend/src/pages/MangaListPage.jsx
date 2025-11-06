import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import MangaCard from '@/components/MangaCard';
import { api } from '@/utils/api';
import { toast } from 'sonner';
import { BookOpen, Loader2 } from 'lucide-react';

const MangaListPage = () => {
  const [manga, setManga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('search');

  useEffect(() => {
    loadManga();
  }, [searchQuery]);

  const loadManga = async () => {
    setLoading(true);
    try {
      if (searchQuery) {
        const results = await api.searchManga(searchQuery);
        setManga(results);
      } else {
        const allManga = await api.getAllManga(100, 0);
        setManga(allManga);
      }
    } catch (error) {
      console.error('Failed to load manga:', error);
      toast.error('Failed to load manga');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    navigate(`/manga?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={handleSearch} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'All Manga'}
            </span>
          </h1>
          <p className="text-muted-foreground">
            {loading ? 'Loading...' : `${manga.length} manga found`}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-red-primary animate-spin" />
          </div>
        ) : manga.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-muted-foreground mb-4">
              {searchQuery ? `No manga found for "${searchQuery}"` : 'No manga available yet'}
            </p>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try a different search term' : 'Check back soon for new additions!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {manga.map((item) => (
              <MangaCard key={item.id} manga={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MangaListPage;
