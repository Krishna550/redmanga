// Local storage utility for manga reader
// Handles reading history and progress tracking

const HISTORY_KEY = 'manga_reading_history';
const PROGRESS_KEY = 'manga_reading_progress';

export const storage = {
  // Get reading history
  getHistory: () => {
    try {
      const history = localStorage.getItem(HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  },

  // Update reading history
  updateHistory: (mangaId, mangaTitle, coverImage, chapterId, chapterNumber, chapterTitle, currentPage = 0) => {
    try {
      const history = storage.getHistory();
      const existingIndex = history.findIndex(item => item.mangaId === mangaId);
      
      const historyItem = {
        mangaId,
        mangaTitle,
        coverImage,
        chapterId,
        chapterNumber,
        chapterTitle,
        currentPage,
        lastRead: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        history[existingIndex] = historyItem;
      } else {
        history.unshift(historyItem);
      }

      // Keep only last 50 items
      const trimmedHistory = history.slice(0, 50);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));

      // Also update progress
      storage.updateProgress(mangaId, chapterId, chapterNumber, currentPage);
    } catch (error) {
      console.error('Failed to update history:', error);
    }
  },

  // Remove from history
  removeFromHistory: (mangaId) => {
    try {
      const history = storage.getHistory();
      const filteredHistory = history.filter(item => item.mangaId !== mangaId);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
    } catch (error) {
      console.error('Failed to remove from history:', error);
    }
  },

  // Clear all history
  clearHistory: () => {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  },

  // Get reading progress for a manga
  getProgress: (mangaId) => {
    try {
      const progressData = localStorage.getItem(`${PROGRESS_KEY}_${mangaId}`);
      return progressData ? JSON.parse(progressData) : null;
    } catch (error) {
      console.error('Failed to get progress:', error);
      return null;
    }
  },

  // Update reading progress
  updateProgress: (mangaId, chapterId, chapterNumber, currentPage = 0) => {
    try {
      const progress = {
        mangaId,
        chapterId,
        chapterNumber,
        currentPage,
        lastRead: new Date().toISOString()
      };
      localStorage.setItem(`${PROGRESS_KEY}_${mangaId}`, JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  },

  // Clear progress for a manga
  clearProgress: (mangaId) => {
    try {
      localStorage.removeItem(`${PROGRESS_KEY}_${mangaId}`);
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  }
};

// Helper function to convert file to base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};
