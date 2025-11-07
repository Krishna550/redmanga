import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Navbar = ({ onSearch }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const isActive = (path) => location.pathname === path;

  const telegramUrl = 'https://t.me/red_manga';

  return (
    <>
      <nav className="glass-strong border-b border-red-primary/30 sticky top-0 z-50 shadow-lg shadow-red-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-all group">
              <div className="relative">
                <img 
                  src="/red-manga-logo.jpg" 
                  alt="Red Manga Logo" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-red-primary/60 group-hover:border-red-primary transition-all group-hover:shadow-lg group-hover:shadow-red-primary/30"
                />
                <div className="absolute inset-0 rounded-full bg-red-primary/0 group-hover:bg-red-primary/10 transition-all"></div>
              </div>
              <span className="text-xl font-bold gradient-text group-hover:scale-105 transition-transform">Red Manga</span>
            </Link>

            <div className="flex items-center gap-2 flex-1 justify-end">
              {/* Search Bar - Opens inline on top bar */}
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="relative flex-1 max-w-md mx-4 animate-in fade-in slide-in-from-right-5 duration-200">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-primary/70" />
                  <Input
                    type="text"
                    placeholder="Search manga..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 bg-card/50 border-red-primary/40 focus:border-red-primary focus:ring-2 focus:ring-red-primary/20 transition-all"
                    autoFocus
                    data-testid="search-input"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 text-foreground hover:text-red-primary hover:bg-red-primary/10 transition-all"
                    onClick={() => setIsSearchOpen(false)}
                    data-testid="close-search"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </form>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-foreground hover:text-red-primary hover:bg-red-primary/10 transition-all"
                    onClick={() => setIsSearchOpen(true)}
                    data-testid="search-button"
                  >
                    <Search className="w-5 h-5" />
                  </Button>

                  {/* Desktop Menu */}
                  <div className="hidden md:flex items-center space-x-1">
                    <Link to="/">
                      <Button
                        variant="ghost"
                        className={`transition-all ${
                          isActive('/') 
                            ? 'text-red-primary bg-red-primary/10 hover:bg-red-primary/20' 
                            : 'text-foreground hover:text-red-primary hover:bg-red-primary/5'
                        }`}
                        data-testid="nav-home"
                      >
                        Home
                      </Button>
                    </Link>
                    <Link to="/manga">
                      <Button
                        variant="ghost"
                        className={`transition-all ${
                          isActive('/manga') 
                            ? 'text-red-primary bg-red-primary/10 hover:bg-red-primary/20' 
                            : 'text-foreground hover:text-red-primary hover:bg-red-primary/5'
                        }`}
                        data-testid="nav-manga-lists"
                      >
                        Manga Lists
                      </Button>
                    </Link>
                    <Link to="/history">
                      <Button
                        variant="ghost"
                        className={`transition-all ${
                          isActive('/history') 
                            ? 'text-red-primary bg-red-primary/10 hover:bg-red-primary/20' 
                            : 'text-foreground hover:text-red-primary hover:bg-red-primary/5'
                        }`}
                        data-testid="nav-history"
                      >
                        History
                      </Button>
                    </Link>
                    <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                      <Button
                        variant="ghost"
                        className="text-foreground hover:text-red-primary hover:bg-red-primary/5 transition-all"
                        data-testid="nav-telegram"
                      >
                        Telegram
                      </Button>
                    </a>
                  </div>
                </>
              )}

              {/* Mobile Menu Button */}
              {!isSearchOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-foreground"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Sidebar - Only extends to content height */}
      <div
        className={`fixed right-0 w-56 sm:w-64 glass-strong border-l border-red-primary/30 shadow-2xl shadow-red-primary/10 z-50 transform transition-transform duration-300 ease-in-out md:hidden rounded-bl-2xl ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ top: '64px', height: 'auto', maxHeight: 'calc(100vh - 64px)' }}
      >
        <div className="flex flex-col h-full">
          {/* Menu items - No icons, just text, auto height */}
          <div className="px-3 sm:px-4 pt-6 pb-6 space-y-1 flex-1">
            <Link to="/" onClick={() => setIsMenuOpen(false)}>
              <Button
                variant="ghost"
                className={`w-full justify-start text-sm sm:text-base py-5 sm:py-6 transition-all rounded-lg ${
                  isActive('/') 
                    ? 'text-red-primary bg-red-primary/15 hover:bg-red-primary/20 border-l-2 border-red-primary' 
                    : 'text-foreground hover:text-red-primary hover:bg-red-primary/5 hover:border-l-2 hover:border-red-primary/50'
                }`}
                data-testid="mobile-nav-home"
              >
                Home
              </Button>
            </Link>
            <Link to="/manga" onClick={() => setIsMenuOpen(false)}>
              <Button
                variant="ghost"
                className={`w-full justify-start text-sm sm:text-base py-5 sm:py-6 transition-all rounded-lg ${
                  isActive('/manga') 
                    ? 'text-red-primary bg-red-primary/15 hover:bg-red-primary/20 border-l-2 border-red-primary' 
                    : 'text-foreground hover:text-red-primary hover:bg-red-primary/5 hover:border-l-2 hover:border-red-primary/50'
                }`}
                data-testid="mobile-nav-manga-lists"
              >
                Manga Lists
              </Button>
            </Link>
            <Link to="/history" onClick={() => setIsMenuOpen(false)}>
              <Button
                variant="ghost"
                className={`w-full justify-start text-sm sm:text-base py-5 sm:py-6 transition-all rounded-lg ${
                  isActive('/history') 
                    ? 'text-red-primary bg-red-primary/15 hover:bg-red-primary/20 border-l-2 border-red-primary' 
                    : 'text-foreground hover:text-red-primary hover:bg-red-primary/5 hover:border-l-2 hover:border-red-primary/50'
                }`}
                data-testid="mobile-nav-history"
              >
                History
              </Button>
            </Link>
            <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
              <Button
                variant="ghost"
                className="w-full justify-start text-sm sm:text-base py-5 sm:py-6 text-foreground hover:text-red-primary hover:bg-red-primary/5 hover:border-l-2 hover:border-red-primary/50 transition-all rounded-lg"
                onClick={() => setIsMenuOpen(false)}
                data-testid="mobile-nav-telegram"
              >
                Telegram
              </Button>
            </a>
          </div>
          
          {/* Bottom red line */}
          <div className=\"h-0.5 bg-red-primary/30 rounded-bl-3xl\"></div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
