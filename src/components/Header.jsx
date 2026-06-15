import { BookOpen, ImageIcon, Grid3X3 } from 'lucide-react';

export default function Header({ currentPage, onNavigate }) {
  return (
    <header className="sticky top-0 z-50 bg-amber-50/95 backdrop-blur-sm border-b border-amber-200 shadow-sm">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        {/* 로고 */}
        <button
          onClick={() => onNavigate('write')}
          className="flex items-center gap-2 active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
            <BookOpen size={16} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-amber-900 leading-none">그림일기</p>
            <p className="text-[10px] text-amber-600 leading-none mt-0.5">AI 일러스트 일기</p>
          </div>
        </button>

        {/* 네비게이션 */}
        <nav className="flex gap-1">
          <button
            onClick={() => onNavigate('write')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
              currentPage === 'write'
                ? 'bg-amber-400 text-white shadow-sm'
                : 'text-amber-700 hover:bg-amber-100'
            }`}
          >
            <BookOpen size={14} />
            <span>쓰기</span>
          </button>
          <button
            onClick={() => onNavigate('gallery')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 ${
              currentPage === 'gallery'
                ? 'bg-amber-400 text-white shadow-sm'
                : 'text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Grid3X3 size={14} />
            <span>갤러리</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
