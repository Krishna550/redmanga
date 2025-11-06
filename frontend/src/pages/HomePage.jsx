import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import MangaCard from '@/components/MangaCard';
import { Button } from '@/components/ui/button';
import { Send, BookOpen, Star, TrendingUp } from 'lucide-react';
import { api } from '@/utils/api';
import { toast } from 'sonner';

const HomePage = () => {
  const [featuredManga, setFeaturedManga] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadFeaturedManga();
  }, []);

  const loadFeaturedManga = async () => {
    try {
      const manga = await api.getFeaturedManga(6);
      setFeaturedManga(manga);
    } catch (error) {
      console.error('Failed to load featured manga:', error);
      toast.error('Failed to load featured manga');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    navigate(`/manga?search=${encodeURIComponent(query)}`);
  };

  const telegramUrl = 'https://t.me/red_manga';

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={handleSearch} />

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-primary/10 to-transparent"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="mb-6">
            <img 
              src="/red-manga-logo.jpg" 
              alt="Red Manga" 
              className="w-32 h-32 mx-auto rounded-2xl shadow-2xl shadow-red-primary/30"
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">Red Manga</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your ultimate destination for reading high-quality translated manga. 
            Dive into captivating stories and immerse yourself in the world of manga.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-red-primary hover:bg-red-secondary text-white px-8 py-6 text-lg"
              onClick={() => navigate('/manga')}
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Browse Manga
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-red-primary text-red-primary hover:bg-red-primary hover:text-white px-8 py-6 text-lg"
              onClick={() => window.open(telegramUrl, '_blank')}
            >
              <Send className="w-5 h-5 mr-2" />
              Join Telegram
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Manga Section - Moved Above Features */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              <span className="gradient-text">Latest Additions</span>
            </h2>
            <Button
              variant="outline"
              className="border-red-primary text-red-primary hover:bg-red-primary hover:text-white"
              onClick={() => navigate('/manga')}
            >
              View All
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-card animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : featuredManga.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground mb-4">No manga available yet</p>
              <p className="text-muted-foreground">Check back soon for new additions!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {featuredManga.map((manga) => (
                <MangaCard key={manga.id} manga={manga} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-primary/10 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-red-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Vast Library</h3>
              <p className="text-muted-foreground">
                Access a growing collection of carefully translated manga titles
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-primary/10 flex items-center justify-center">
                <Star className="w-8 h-8 text-red-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Quality Translations</h3>
              <p className="text-muted-foreground">
                Enjoy professionally translated content for the best reading experience
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-primary/10 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-red-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Regular Updates</h3>
              <p className="text-muted-foreground">
                Get notified of new chapters through our Telegram channel
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Telegram CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-red-primary/20 to-red-secondary/20">
        <div className="max-w-4xl mx-auto text-center">
          <Send className="w-16 h-16 mx-auto mb-6 text-red-primary" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Stay Connected
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join our Telegram channel for latest updates, new chapters, and exclusive content!
          </p>
          <Button
            size="lg"
            className="bg-red-primary hover:bg-red-secondary text-white px-8 py-6 text-lg"
            onClick={() => window.open(telegramUrl, '_blank')}
          >
            <Send className="w-5 h-5 mr-2" />
            Join Telegram Channel
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-card/50 border-t border-red-primary/20">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p className="mb-2">© 2025 Red Manga. All rights reserved.</p>
          <p className="text-sm">Made with ❤️ for manga lovers</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
