import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import '@/App.css';
import HomePage from '@/pages/HomePage';
import MangaListPage from '@/pages/MangaListPage';
import MangaDetailPage from '@/pages/MangaDetailPage';
import ReaderPage from '@/pages/ReaderPage';
import HistoryPage from '@/pages/HistoryPage';
import AdminPage from '@/pages/AdminPage';
import { Toaster } from '@/components/ui/sonner';

function App() {
  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration);
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  return (
    <Router>
      <div className="App min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/manga" element={<MangaListPage />} />
          <Route path="/manga/:mangaId" element={<MangaDetailPage />} />
          <Route path="/read/:chapterId" element={<ReaderPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
        <Toaster richColors position="top-center" />
      </div>
    </Router>
  );
}

export default App;
