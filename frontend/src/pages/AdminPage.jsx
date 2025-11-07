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
import { Lock, Upload, BookOpen, FileImage, Loader2, Plus, X, Trash2, Edit, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

const AdminPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper function to convert base64 to data URL if needed
  const getImageSrc = (coverImage) => {
    if (!coverImage) return '/manga-reader.png';
    if (coverImage.startsWith('data:')) return coverImage;
    if (coverImage.startsWith('http')) return coverImage;
    // Assume it's base64 without prefix
    return `data:image/jpeg;base64,${coverImage}`;
  };
  
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

  // Management state
  const [mangaList, setMangaList] = useState([]);
  const [expandedManga, setExpandedManga] = useState(null);
  const [mangaChapters, setMangaChapters] = useState({});
  const [selectedMangaIds, setSelectedMangaIds] = useState([]);
  const [selectedChapterIds, setSelectedChapterIds] = useState([]);
  
  // Edit state
  const [editingManga, setEditingManga] = useState(null);
  const [editingChapter, setEditingChapter] = useState(null);
  
  // Statistics state
  const [statistics, setStatistics] = useState(null);

  const [activeTab, setActiveTab] = useState('manga');

  useEffect(() => {
    if (isAuthenticated) {
      loadManga();
      if (activeTab === 'manage') {
        loadMangaList();
      }
      if (activeTab === 'statistics') {
        loadStatistics();
      }
    }
  }, [isAuthenticated, activeTab]);

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

  const loadMangaList = async () => {
    try {
      const manga = await api.getAllManga(100, 0);
      setMangaList(manga);
    } catch (error) {
      console.error('Failed to load manga list:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await api.getStatistics(adminPassword);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      toast.error('Failed to load statistics');
    }
  };

  const loadChaptersForManga = async (mangaId) => {
    try {
      const chapters = await api.getMangaChapters(mangaId);
      setMangaChapters(prev => ({ ...prev, [mangaId]: chapters }));
    } catch (error) {
      console.error('Failed to load chapters:', error);
    }
  };

  const toggleMangaExpand = async (mangaId) => {
    if (expandedManga === mangaId) {
      setExpandedManga(null);
    } else {
      setExpandedManga(mangaId);
      if (!mangaChapters[mangaId]) {
        await loadChaptersForManga(mangaId);
      }
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
      
      setChapterPages(prev => [...prev, ...base64Pages]);
      setChapterPagesPreview(prev => [...prev, ...previews]);
      toast.success(`${base64Pages.length} pages added`);
    } catch (error) {
      toast.error('Failed to process images');
    } finally {
      setLoading(false);
    }
  };

  const removePage = (index) => {
    setChapterPages(prev => prev.filter((_, i) => i !== index));
    setChapterPagesPreview(prev => prev.filter((_, i) => i !== index));
    toast.success('Page removed');
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
    const uploadToast = toast.loading(`Uploading chapter with ${chapterPages.length} pages...`);
    
    try {
      const chapterData = {
        mangaId: selectedMangaId,
        chapterNumber: chapterNumber ? parseFloat(chapterNumber) : null,
        title: chapterTitle,
        pages: chapterPages
      };

      await api.createChapter(chapterData, adminPassword);
      toast.success('Chapter created successfully', { id: uploadToast });
      
      // Reset form
      setSelectedMangaId('');
      setChapterNumber('');
      setChapterTitle('');
      setChapterPages([]);
      setChapterPagesPreview([]);
      
      // Reload manga list to reflect new chapter count
      await loadManga();
      
      // If on manage tab, reload that too
      if (activeTab === 'manage') {
        await loadMangaList();
      }
    } catch (error) {
      console.error('Chapter creation error:', error);
      toast.error(error.message || 'Failed to create chapter', { id: uploadToast });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteManga = async (mangaId) => {
    if (!confirm('Are you sure you want to delete this manga and all its chapters?')) return;
    
    setLoading(true);
    try {
      await api.deleteManga(mangaId, adminPassword);
      toast.success('Manga deleted successfully');
      loadMangaList();
      loadManga();
    } catch (error) {
      toast.error('Failed to delete manga');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChapter = async (chapterId, mangaId) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;
    
    setLoading(true);
    try {
      await api.deleteChapter(chapterId, adminPassword);
      toast.success('Chapter deleted successfully');
      await loadChaptersForManga(mangaId);
      loadMangaList();
    } catch (error) {
      toast.error('Failed to delete chapter');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteManga = async () => {
    if (selectedMangaIds.length === 0) {
      toast.error('No manga selected');
      return;
    }
    
    if (!confirm(`Delete ${selectedMangaIds.length} manga and all their chapters?`)) return;
    
    setLoading(true);
    try {
      await api.bulkDeleteManga(selectedMangaIds, adminPassword);
      toast.success(`${selectedMangaIds.length} manga deleted`);
      setSelectedMangaIds([]);
      loadMangaList();
      loadManga();
    } catch (error) {
      toast.error('Failed to bulk delete manga');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteChapters = async () => {
    if (selectedChapterIds.length === 0) {
      toast.error('No chapters selected');
      return;
    }
    
    if (!confirm(`Delete ${selectedChapterIds.length} chapters?`)) return;
    
    setLoading(true);
    try {
      await api.bulkDeleteChapters(selectedChapterIds, adminPassword);
      toast.success(`${selectedChapterIds.length} chapters deleted`);
      setSelectedChapterIds([]);
      if (expandedManga) {
        await loadChaptersForManga(expandedManga);
      }
      loadMangaList();
    } catch (error) {
      toast.error('Failed to bulk delete chapters');
    } finally {
      setLoading(false);
    }
  };

  const startEditManga = (manga) => {
    setEditingManga({
      id: manga.id,
      title: manga.title,
      description: manga.description,
      author: manga.author,
      genres: manga.genres.join(', '),
      status: manga.status,
      coverImage: null,
      currentCover: manga.coverImage
    });
  };

  const handleUpdateManga = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const updateData = {
        title: editingManga.title,
        description: editingManga.description,
        author: editingManga.author,
        genres: editingManga.genres.split(',').map(g => g.trim()).filter(g => g),
        status: editingManga.status
      };
      
      if (editingManga.coverImage) {
        updateData.coverImage = editingManga.coverImage;
      }

      await api.updateManga(editingManga.id, updateData, adminPassword);
      toast.success('Manga updated successfully');
      setEditingManga(null);
      loadMangaList();
      loadManga();
    } catch (error) {
      toast.error('Failed to update manga');
    } finally {
      setLoading(false);
    }
  };

  const startEditChapter = async (chapter, mangaId) => {
    // Load full chapter details with pages
    try {
      const fullChapter = await api.getChapterDetails(chapter.id);
      setEditingChapter({
        id: fullChapter.id,
        mangaId: mangaId,
        chapterNumber: fullChapter.chapterNumber,
        title: fullChapter.title,
        pages: fullChapter.pages,
        pagesPreview: fullChapter.pages
      });
    } catch (error) {
      toast.error('Failed to load chapter details');
    }
  };

  const removeEditPageAtIndex = (index) => {
    setEditingChapter(prev => ({
      ...prev,
      pages: prev.pages.filter((_, i) => i !== index),
      pagesPreview: prev.pagesPreview.filter((_, i) => i !== index)
    }));
    toast.success('Page removed');
  };

  const addPagesToEditChapter = async (e) => {
    const files = Array.from(e.target.files);
    
    setLoading(true);
    try {
      const base64Pages = [];
      
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }
        const base64 = await fileToBase64(file);
        base64Pages.push(base64);
      }
      
      setEditingChapter(prev => ({
        ...prev,
        pages: [...prev.pages, ...base64Pages],
        pagesPreview: [...prev.pagesPreview, ...base64Pages]
      }));
      
      toast.success(`${base64Pages.length} pages added`);
    } catch (error) {
      toast.error('Failed to process images');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateChapter = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const updateData = {
        chapterNumber: editingChapter.chapterNumber ? parseFloat(editingChapter.chapterNumber) : null,
        title: editingChapter.title,
        pages: editingChapter.pages
      };

      await api.updateChapter(editingChapter.id, updateData, adminPassword);
      toast.success('Chapter updated successfully');
      setEditingChapter(null);
      await loadChaptersForManga(editingChapter.mangaId);
      loadMangaList();
    } catch (error) {
      toast.error('Failed to update chapter');
    } finally {
      setLoading(false);
    }
  };

  const toggleMangaSelection = (mangaId) => {
    setSelectedMangaIds(prev => 
      prev.includes(mangaId) 
        ? prev.filter(id => id !== mangaId)
        : [...prev, mangaId]
    );
  };

  const toggleChapterSelection = (chapterId) => {
    setSelectedChapterIds(prev => 
      prev.includes(chapterId) 
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    );
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
                    data-testid="admin-password-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-red-primary hover:bg-red-secondary text-white"
                  disabled={loading}
                  data-testid="admin-login-button"
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
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">
          <span className="gradient-text">Admin Panel</span>
        </h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <Button
            variant={activeTab === 'manga' ? 'default' : 'outline'}
            className={activeTab === 'manga' ? 'bg-red-primary hover:bg-red-secondary' : 'border-red-primary/30'}
            onClick={() => setActiveTab('manga')}
            data-testid="tab-create-manga"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Create Manga
          </Button>
          <Button
            variant={activeTab === 'chapter' ? 'default' : 'outline'}
            className={activeTab === 'chapter' ? 'bg-red-primary hover:bg-red-secondary' : 'border-red-primary/30'}
            onClick={() => setActiveTab('chapter')}
            data-testid="tab-add-chapter"
          >
            <FileImage className="w-4 h-4 mr-2" />
            Add Chapter
          </Button>
          <Button
            variant={activeTab === 'manage' ? 'default' : 'outline'}
            className={activeTab === 'manage' ? 'bg-red-primary hover:bg-red-secondary' : 'border-red-primary/30'}
            onClick={() => setActiveTab('manage')}
            data-testid="tab-manage-content"
          >
            <Edit className="w-4 h-4 mr-2" />
            Manage Content
          </Button>
          <Button
            variant={activeTab === 'statistics' ? 'default' : 'outline'}
            className={activeTab === 'statistics' ? 'bg-red-primary hover:bg-red-secondary' : 'border-red-primary/30'}
            onClick={() => setActiveTab('statistics')}
            data-testid="tab-statistics"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Statistics
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
                    data-testid="manga-title-input"
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
                    data-testid="manga-description-input"
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
                    data-testid="manga-author-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Genres (comma separated)</Label>
                  <Input
                    value={mangaGenres}
                    onChange={(e) => setMangaGenres(e.target.value)}
                    placeholder="Action, Adventure, Fantasy"
                    className="bg-background border-red-primary/30"
                    data-testid="manga-genres-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    value={mangaStatus}
                    onChange={(e) => setMangaStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-background border border-red-primary/30 text-foreground"
                    data-testid="manga-status-select"
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
                    data-testid="manga-cover-input"
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
                  data-testid="create-manga-button"
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
                    data-testid="chapter-manga-select"
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
                  <Label>Chapter Number</Label>
                  <Input
                    type="number"
                    step="1"
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(e.target.value)}
                    placeholder="1 or 1.5"
                    className="bg-background border-red-primary/30"
                    data-testid="chapter-number-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Chapter Title</Label>
                  <Input
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    placeholder="Chapter title (optional)"
                    className="bg-background border-red-primary/30"
                    data-testid="chapter-title-input"
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
                    data-testid="chapter-pages-input"
                  />
                  {chapterPagesPreview.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        {chapterPagesPreview.length} pages loaded
                      </p>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
                        {chapterPagesPreview.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Page ${index + 1}`}
                              className="w-full aspect-[3/4] object-cover rounded border border-red-primary/30"
                            />
                            <button
                              type="button"
                              onClick={() => removePage(index)}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              data-testid={`remove-page-${index}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <span className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-red-primary hover:bg-red-secondary text-white"
                  disabled={loading}
                  data-testid="create-chapter-button"
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

        {/* Manage Content Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            {/* Bulk Actions */}
            {(selectedMangaIds.length > 0 || selectedChapterIds.length > 0) && (
              <Card className="bg-red-primary/10 border-red-primary/30">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="text-sm">
                      {selectedMangaIds.length > 0 && (
                        <span className="mr-4">{selectedMangaIds.length} manga selected</span>
                      )}
                      {selectedChapterIds.length > 0 && (
                        <span>{selectedChapterIds.length} chapters selected</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {selectedMangaIds.length > 0 && (
                        <Button
                          onClick={handleBulkDeleteManga}
                          variant="destructive"
                          size="sm"
                          disabled={loading}
                          data-testid="bulk-delete-manga-button"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Manga
                        </Button>
                      )}
                      {selectedChapterIds.length > 0 && (
                        <Button
                          onClick={handleBulkDeleteChapters}
                          variant="destructive"
                          size="sm"
                          disabled={loading}
                          data-testid="bulk-delete-chapters-button"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Chapters
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          setSelectedMangaIds([]);
                          setSelectedChapterIds([]);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Manga List */}
            <Card className="bg-card border-red-primary/20">
              <CardHeader>
                <CardTitle>All Manga</CardTitle>
                <CardDescription>Manage your manga library</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mangaList.map((manga) => (
                    <div key={manga.id} className="border border-red-primary/20 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedMangaIds.includes(manga.id)}
                          onChange={() => toggleMangaSelection(manga.id)}
                          className="mt-1"
                          data-testid={`manga-checkbox-${manga.id}`}
                        />
                        <img
                          src={getImageSrc(manga.coverImage)}
                          alt={manga.title}
                          className="w-16 h-20 object-cover rounded"
                          data-testid={`manga-cover-${manga.id}`}
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{manga.title}</h3>
                          <p className="text-sm text-muted-foreground">{manga.author}</p>
                          <p className="text-sm text-muted-foreground">{manga.totalChapters} chapters</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleMangaExpand(manga.id)}
                            data-testid={`expand-manga-${manga.id}`}
                          >
                            {expandedManga === manga.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditManga(manga)}
                            data-testid={`edit-manga-${manga.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteManga(manga.id)}
                            disabled={loading}
                            data-testid={`delete-manga-${manga.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Chapters List */}
                      {expandedManga === manga.id && mangaChapters[manga.id] && (
                        <div className="mt-4 ml-20 space-y-2">
                          <h4 className="font-semibold mb-2">Chapters:</h4>
                          {mangaChapters[manga.id].length === 0 ? (
                            <p className="text-sm text-muted-foreground">No chapters yet</p>
                          ) : (
                            mangaChapters[manga.id].map((chapter) => (
                              <div
                                key={chapter.id}
                                className="flex items-center justify-between bg-background p-2 rounded border border-red-primary/10"
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedChapterIds.includes(chapter.id)}
                                    onChange={() => toggleChapterSelection(chapter.id)}
                                    data-testid={`chapter-checkbox-${chapter.id}`}
                                  />
                                  <span className="text-sm">
                                    Chapter {chapter.chapterNumber}: {chapter.title || 'Untitled'}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEditChapter(chapter, manga.id)}
                                    data-testid={`edit-chapter-${chapter.id}`}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteChapter(chapter.id, manga.id)}
                                    disabled={loading}
                                    data-testid={`delete-chapter-${chapter.id}`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card border-red-primary/20">
              <CardHeader>
                <CardTitle>Total Manga</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-red-primary">{statistics.totalManga}</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-red-primary/20">
              <CardHeader>
                <CardTitle>Total Chapters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-red-primary">{statistics.totalChapters}</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-red-primary/20">
              <CardHeader>
                <CardTitle>Avg Chapters/Manga</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-red-primary">{statistics.averageChaptersPerManga}</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-red-primary/20 md:col-span-3">
              <CardHeader>
                <CardTitle>Recent Manga</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statistics.recentManga.map((manga) => (
                    <div key={manga.id} className="flex justify-between items-center p-2 bg-background rounded">
                      <span>{manga.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(manga.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Manga Modal */}
        {editingManga && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl bg-card border-red-primary/20 max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Edit Manga</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateManga} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={editingManga.title}
                      onChange={(e) => setEditingManga({...editingManga, title: e.target.value})}
                      className="bg-background border-red-primary/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editingManga.description}
                      onChange={(e) => setEditingManga({...editingManga, description: e.target.value})}
                      rows={4}
                      className="bg-background border-red-primary/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Author</Label>
                    <Input
                      value={editingManga.author}
                      onChange={(e) => setEditingManga({...editingManga, author: e.target.value})}
                      className="bg-background border-red-primary/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Genres (comma separated)</Label>
                    <Input
                      value={editingManga.genres}
                      onChange={(e) => setEditingManga({...editingManga, genres: e.target.value})}
                      className="bg-background border-red-primary/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                      value={editingManga.status}
                      onChange={(e) => setEditingManga({...editingManga, status: e.target.value})}
                      className="w-full px-3 py-2 rounded-md bg-background border border-red-primary/30 text-foreground"
                    >
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Update Cover Image (optional)</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const base64 = await fileToBase64(file);
                          setEditingManga({...editingManga, coverImage: base64});
                        }
                      }}
                      className="bg-background border-red-primary/30"
                    />
                    {editingManga.currentCover && (
                      <img src={getImageSrc(editingManga.currentCover)} alt="Current cover" className="max-w-xs rounded" />
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1 bg-red-primary hover:bg-red-secondary"
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update Manga'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingManga(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Chapter Modal */}
        {editingChapter && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl bg-card border-red-primary/20 max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Edit Chapter</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateChapter} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Chapter Number</Label>
                    <Input
                      type="number"
                      step="1"
                      value={editingChapter.chapterNumber || ''}
                      onChange={(e) => setEditingChapter({...editingChapter, chapterNumber: e.target.value})}
                      placeholder="1 or 1.5"
                      className="bg-background border-red-primary/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Chapter Title</Label>
                    <Input
                      value={editingChapter.title}
                      onChange={(e) => setEditingChapter({...editingChapter, title: e.target.value})}
                      className="bg-background border-red-primary/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Chapter Pages ({editingChapter.pages.length} pages)</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={addPagesToEditChapter}
                      className="bg-background border-red-primary/30"
                    />
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-96 overflow-y-auto mt-2">
                      {editingChapter.pagesPreview.map((page, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={page}
                            alt={`Page ${index + 1}`}
                            className="w-full aspect-[3/4] object-cover rounded border border-red-primary/30"
                          />
                          <button
                            type="button"
                            onClick={() => removeEditPageAtIndex(index)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                            {index + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1 bg-red-primary hover:bg-red-secondary"
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update Chapter'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingChapter(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
