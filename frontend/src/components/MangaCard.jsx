import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';

  const MangaCard = ({ manga }) => {
    // Convert base64 to data URL if needed
    const getImageSrc = (coverImage) => {
      if (!coverImage) return '/manga-reader.png';
      if (coverImage.startsWith('data:')) return coverImage;
      if (coverImage.startsWith('http')) return coverImage;
      // Assume it's base64 without prefix
      return `data:image/jpeg;base64,${coverImage}`;
  };

  return (
    <Link to={`/manga/${manga.id}`}>
      <Card className="overflow-hidden hover-lift bg-card border-red-primary/20 hover:border-red-primary/50 transition-all duration-300">
        <div className="aspect-[3/4] relative overflow-hidden">
          <img
            src={getImageSrc(manga.coverImage)}
            alt={manga.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            onError={(e) => {
              e.target.src = '/manga-reader.png';
            }}
          />
          <div className="absolute top-2 right-2 glass px-2 py-1 rounded-md text-xs font-semibold text-red-primary">
            {manga.status}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-1 line-clamp-2 text-foreground">
            {manga.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {manga.description}
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">By {manga.author}</span>
            <div className="flex items-center text-red-primary">
              <BookOpen className="w-4 h-4 mr-1" />
              <span>{manga.totalChapters}</span>
            </div>
          </div>
          {manga.genres && manga.genres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {manga.genres.slice(0, 3).map((genre, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 rounded-full bg-red-primary/10 text-red-primary"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};

export default MangaCard;
