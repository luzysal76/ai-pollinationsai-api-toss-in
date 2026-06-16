import { useState } from 'react';
import Header from './components/Header';
import WritePage from './pages/WritePage';
import GalleryPage from './pages/GalleryPage';

export default function App() {
  const [page, setPage]       = useState('write');
  const [galleryKey, setGalleryKey] = useState(0);

  const navigate = (p) => setPage(p);
  const handleSaved = () => setGalleryKey(k => k + 1);

  return (
    <div style={{ minHeight: '100dvh', background: '#FFF8F0' }}>
      <Header currentPage={page} onNavigate={navigate} />
      <main>
        {page === 'write'
          ? <WritePage onNavigate={navigate} onSaved={handleSaved} />
          : <GalleryPage key={galleryKey} onNavigate={navigate} />
        }
      </main>
    </div>
  );
}
