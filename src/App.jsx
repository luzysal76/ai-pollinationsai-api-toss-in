import { useState } from 'react';
import Header from './components/Header';
import WritePage from './pages/WritePage';
import GalleryPage from './pages/GalleryPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('write');
  const [galleryKey, setGalleryKey] = useState(0);

  const navigate = (page) => setCurrentPage(page);

  const handleSaved = () => {
    setGalleryKey(k => k + 1);
  };

  return (
    <div className="min-h-screen bg-amber-50">
      <Header currentPage={currentPage} onNavigate={navigate} />

      <main>
        {currentPage === 'write' ? (
          <WritePage
            onNavigate={navigate}
            onSaved={handleSaved}
          />
        ) : (
          <GalleryPage
            key={galleryKey}
            onNavigate={navigate}
            refreshKey={galleryKey}
          />
        )}
      </main>
    </div>
  );
}
