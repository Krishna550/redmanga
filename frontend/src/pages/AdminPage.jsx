import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/utils/api';
import { fileToBase64 } from '@/utils/storage';
import { toast } from 'sonner';
import { Lock, Upload, BookOpen, FileImage, Loader2, Plus, X } from 'lucide-react';

const AdminPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Manga form state
  const [mangaTitle, setMangaTitle] = useState('');
  const [mangaDescription, setMangaDescription] = useState('');
  const [mangaAuthor, setMangaAuthor] = useState('');
  const [mangaGenres, setMangaGenres] = useState('');
  const [mangaStatus, setMangaStatus] = useState('Ongoing');
  const [mangaCover, setMangaCover] = useState(null);
  const [mangaCoverPreview, setMangaCoverPreview] = useState('');
  
  // Chapter form state
  const [allManga, setAllManga] = useState([]);
  const [selectedMangaId, setSelectedMangaId] = useState('');
  const [chapterNumber, setChapterNumber] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterPages, setChapterPages] = useState([]);
  const [chapterPagesPreview, setChapterPagesPreview] = useState([]);

  const [activeTab, setActiveTab] = useState('manga');

  useEffect(() => {
    if (isAuthenticated) {
      loadManga();
    }
  }, [isAuthenticated]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.adminAuth(password);
      setIsAuthenticated(true);
      setAdminPassword(password);
      toast.success('Authenticated successfully');
    } catch (error) {
      toast.error('Invalid password');
    } finally {
      setLoading(false);
    }
  };

  const loadManga = async () => {
    try {
      const manga = await api.getAllManga(100, 0);
      setAllManga(manga);
    } catch (error) {
      console.error('Failed to load manga:', error);
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Cover image must be less than 5MB');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setMangaCover(base64);
      setMangaCoverPreview(URL.createObjectURL(file));
    } catch (error) {
      toast.error('Failed to process image');
    }
  };

  const handlePagesChange = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 50) {
      toast.error('Maximum 50 pages per chapter');
      return;
    }

    setLoading(true);
    try {
      const base64Pages = [];
      const previews = [];
      
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }
        const base64 = await fileToBase64(file);
        base64Pages.push(base64);
        previews.push(URL.createObjectURL(file));
      }
      
      setChapterPages(base64Pages);
      setChapterPagesPreview(previews);
      toast.success(`${base64Pages.length} pages loaded`);
    } catch (error) {
      toast.error('Failed to process images');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManga = async (e) => {
    e.preventDefault();
    
    if (!mangaCover) {
      toast.error('Please select a cover image');
      return;
    }

    setLoading(true);
    try {
      const mangaData = {
        title: mangaTitle,
        description: mangaDescription,
        author: mangaAuthor,
        coverImage: mangaCover,
        genres: mangaGenres.split(',').map(g => g.trim()).filter(g => g),
        status: mangaStatus
      };

      await api.createManga(mangaData, adminPassword);
      toast.success('Manga created successfully');
      
      // Reset form
      setMangaTitle('');
      setMangaDescription('');
      setMangaAuthor('');
      setMangaGenres('');
      setMangaStatus('Ongoing');
      setMangaCover(null);
      setMangaCoverPreview('');
      
      // Reload manga list
      loadManga();
    } catch (error) {
      toast.error(error.message || 'Failed to create manga');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChapter = async (e) => {
    e.preventDefault();
    
    if (!selectedMangaId) {
      toast.error('Please select a manga');
      return;
    }
    
    if (chapterPages.length === 0) {
      toast.error('Please upload chapter pages');
      return;
    }

    setLoading(true);
    try {
      const chapterData = {
        mangaId: selectedMangaId,
        chapterNumber: parseFloat(chapterNumber),
        title: chapterTitle,
        pages: chapterPages
      };

      await api.createChapter(chapterData, adminPassword);
      toast.success('Chapter created successfully');
      
      // Reset form
      setSelectedMangaId('');
      setChapterNumber('');
      setChapterTitle('');
      setChapterPages([]);
      setChapterPagesPreview([]);
      
      // Reload manga list
      loadManga();
    } catch (error) {
      toast.error(error.message || 'Failed to create chapter');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    navigate(`/manga?search=${encodeURIComponent(query)}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onSearch={handleSearch} />
        
        <div className="flex items-center justify-center py-20 px-4">
          <Card className="w-full max-w-md bg-card border-red-primary/20">
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-primary/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-red-primary" />
              </div>
              <CardTitle className="text-center text-2xl">Admin Access</CardTitle>
              <CardDescription className="text-center">
                Enter admin password to manage manga
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <Input
                    type="password"
                    placeholder="Admin Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background border-red-primary/30"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-red-primary hover:bg-red-secondary text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={handleSearch} />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">
          <span className="gradient-text">Admin Panel</span>
        </h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <Button
            variant={activeTab === 'manga' ? 'default' : 'outline'}
            className={activeTab === 'manga' ? 'bg-red-primary hover:bg-red-secondary' : 'border-red-primary/30'}
            onClick={() => setActiveTab('manga')}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Create Manga
          </Button>
          <Button
            variant={activeTab === 'chapter' ? 'default' : 'outline'}
            className={activeTab === 'chapter' ? 'bg-red-primary hover:bg-red-secondary' : 'border-red-primary/30'}
            onClick={() => setActiveTab('chapter')}
          >
            <FileImage className="w-4 h-4 mr-2" />
            Add Chapter
          </Button>
        </div>

        {/* Create Manga Form */}
        {activeTab === 'manga' && (
          <Card className="bg-card border-red-primary/20">
            <CardHeader>
              <CardTitle>Create New Manga</CardTitle>
              <CardDescription>Add a new manga to the library</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateManga} className="space-y-6">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    required
                    value={mangaTitle}
                    onChange={(e) => setMangaTitle(e.target.value)}
                    placeholder="Manga title"
                    className="bg-background border-red-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    required
                    value={mangaDescription}
                    onChange={(e) => setMangaDescription(e.target.value)}
                    placeholder="Manga description"
                    rows={4}
                    className="bg-background border-red-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Author *</Label>
                  <Input
                    required
                    value={mangaAuthor}
                    onChange={(e) => setMangaAuthor(e.target.value)}
                    placeholder="Author name"
                    className="bg-background border-red-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Genres (comma separated)</Label>
                  <Input
                    value={mangaGenres}
                    onChange={(e) => setMangaGenres(e.target.value)}
                    placeholder="Action, Adventure, Fantasy"
                    className="bg-background border-red-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    value={mangaStatus}
                    onChange={(e) => setMangaStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-background border border-red-primary/30 text-foreground"
                  >
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Cover Image * (max 5MB)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="bg-background border-red-primary/30"
                  />
                  {mangaCoverPreview && (
                    <div className="mt-4">
                      <img
                        src={mangaCoverPreview}
                        alt="Cover preview"
                        className="max-w-xs rounded-lg border-2 border-red-primary/30"
                      />
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-primary hover:bg-red-secondary text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Manga
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Add Chapter Form */}
        {activeTab === 'chapter' && (
          <Card className="bg-card border-red-primary/20">
            <CardHeader>
              <CardTitle>Add New Chapter</CardTitle>
              <CardDescription>Upload a chapter to an existing manga</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateChapter} className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Manga *</Label>
                  <select
                    required
                    value={selectedMangaId}
                    onChange={(e) => setSelectedMangaId(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-background border border-red-primary/30 text-foreground"
                  >
                    <option value="">Choose a manga...</option>
                    {allManga.map((manga) => (
                      <option key={manga.id} value={manga.id}>
                        {manga.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Chapter Number *</Label>
                  <Input
                    required
                    type="number"
                    step="0.1"
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(e.target.value)}
                    placeholder="1 or 1.5"
                    className="bg-background border-red-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Chapter Title</Label>
                  <Input
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    placeholder="Chapter title (optional)"
                    className="bg-background border-red-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Chapter Pages * (max 50 images, 5MB each)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePagesChange}
                    className="bg-background border-red-primary/30"
                  />
                  {chapterPagesPreview.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        {chapterPagesPreview.length} pages loaded
                      </p>
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-96 overflow-y-auto">
                        {chapterPagesPreview.map((preview, index) => (
                          <img
                            key={index}
                            src={preview}
                            alt={`Page ${index + 1}`}
                            className="w-full aspect-[3/4] object-cover rounded border border-red-primary/30"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-primary hover:bg-red-secondary text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Chapter
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
