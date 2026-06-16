import { useState } from 'react';
import Header from './components/Header';
import WritePage from './pages/WritePage';
import GalleryPage from './pages/GalleryPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const [page, setPage]         = useState('write');
  const [galleryKey, setGalleryKey] = useState(0);

  const navigate    = (p) => setPage(p);
  const handleSaved = () => setGalleryKey(k => k + 1);

  return (
    <div style={{ minHeight: '100dvh', background: '#FFF8F0' }}>
      <Header currentPage={page} onNavigate={navigate} />
      <main id={`page-${page}`} role="tabpanel">
        {page === 'write'    && <WritePage   onNavigate={navigate} onSaved={handleSaved} />}
        {page === 'gallery'  && <GalleryPage key={galleryKey} onNavigate={navigate} />}
        {page === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}
