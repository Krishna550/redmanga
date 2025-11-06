const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export const api = {
  // Public APIs
  getAllManga: async (limit = 50, skip = 0) => {
    const response = await fetch(`${BACKEND_URL}/api/manga?limit=${limit}&skip=${skip}`);
    if (!response.ok) throw new Error('Failed to fetch manga');
    return response.json();
  },

  getMangaDetails: async (mangaId) => {
    const response = await fetch(`${BACKEND_URL}/api/manga/${mangaId}`);
    if (!response.ok) throw new Error('Failed to fetch manga details');
    return response.json();
  },

  getMangaChapters: async (mangaId) => {
    const response = await fetch(`${BACKEND_URL}/api/manga/${mangaId}/chapters`);
    if (!response.ok) throw new Error('Failed to fetch chapters');
    return response.json();
  },

  getChapterDetails: async (chapterId) => {
    const response = await fetch(`${BACKEND_URL}/api/chapter/${chapterId}`);
    if (!response.ok) throw new Error('Failed to fetch chapter details');
    return response.json();
  },

  searchManga: async (query) => {
    const response = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search manga');
    return response.json();
  },

  getFeaturedManga: async (limit = 6) => {
    const response = await fetch(`${BACKEND_URL}/api/featured?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch featured manga');
    return response.json();
  },

  // Admin APIs
  adminAuth: async (password) => {
    const response = await fetch(`${BACKEND_URL}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!response.ok) throw new Error('Invalid password');
    return response.json();
  },

  createManga: async (mangaData, adminPassword) => {
    const response = await fetch(`${BACKEND_URL}/api/admin/manga`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': adminPassword
      },
      body: JSON.stringify(mangaData)
    });
    if (!response.ok) throw new Error('Failed to create manga');
    return response.json();
  },

  createChapter: async (chapterData, adminPassword) => {
    const response = await fetch(`${BACKEND_URL}/api/admin/chapter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': adminPassword
      },
      body: JSON.stringify(chapterData)
    });
    if (!response.ok) throw new Error('Failed to create chapter');
    return response.json();
  },

  deleteManga: async (mangaId, adminPassword) => {
    const response = await fetch(`${BACKEND_URL}/api/admin/manga/${mangaId}`, {
      method: 'DELETE',
      headers: { 'Authorization': adminPassword }
    });
    if (!response.ok) throw new Error('Failed to delete manga');
    return response.json();
  },

  deleteChapter: async (chapterId, adminPassword) => {
    const response = await fetch(`${BACKEND_URL}/api/admin/chapter/${chapterId}`, {
      method: 'DELETE',
      headers: { 'Authorization': adminPassword }
    });
    if (!response.ok) throw new Error('Failed to delete chapter');
    return response.json();
  }
};
