import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export const URLInputScreen = ({ onLoadManga }) => {
  const [chapterUrl, setChapterUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadFromChapter = async () => {
    if (!chapterUrl.trim()) {
      toast.error('Please enter a chapter URL');
      return;
    }

    try {
      new URL(chapterUrl);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    toast.info('Extracting manga pages from chapter...');

    try {
      console.log('Backend URL:', BACKEND_URL);
      const apiUrl = `${BACKEND_URL}/api/extract-chapter`;
      console.log('Calling API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chapter_url: chapterUrl }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to extract manga pages');
      }

      const data = await response.json();
      const imageUrls = data.image_urls;

      if (imageUrls.length === 0) {
        toast.error('No manga pages found in this chapter.');
        setIsLoading(false);
        return;
      }

      toast.success(`Found ${imageUrls.length} page${imageUrls.length > 1 ? 's' : ''}!`);
      setTimeout(() => {
        onLoadManga(imageUrls);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Chapter extraction error:', error);
      toast.error(error.message || 'Failed to extract pages from chapter.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="absolute top-0 left-0 right-0 p-6 z-10">
        <div className="flex items-center gap-1">
          <img 
            src="/manga-reader.png" 
            alt="Manga Reader Logo" 
            className="w-12 h-12 rounded-lg"
          />
          <h1 className="text-2xl font-bold text-foreground">
            Manga Reader
          </h1>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-2">
              Welcome
            </h2>
            <p className="text-muted-foreground text-lg">
              Read Manga Fullscreen
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                Chapter Link
              </CardTitle>
              <CardDescription>
                Enter chapter URL to extract and read
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={chapterUrl}
                onChange={(e) => setChapterUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleLoadFromChapter();
                  }
                }}
                placeholder="Enter your chapter link here"
                className="h-12"
              />

              <Button
                onClick={handleLoadFromChapter}
                disabled={isLoading}
                className="w-full h-12"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
                    Extracting...
                  </>
                ) : (
                  'Start Reading'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default URLInputScreen;
