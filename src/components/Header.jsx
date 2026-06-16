import { Menu, BookOpen, Image } from 'lucide-react';

export default function Header({ currentPage, onNavigate }) {
  return (
    <header className="sticky top-0 z-50" style={{ background: '#FFB800' }}>
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* 햄버거 */}
        <button className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-white/20 transition-colors">
          <Menu size={22} color="white" strokeWidth={2.5} />
        </button>

        {/* 타이틀 */}
        <h1 className="font-handwriting text-white text-xl font-bold tracking-wide">
          오늘 하루 기록하기
        </h1>

        {/* 프로필 아바타 */}
        <button className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm active:scale-95 transition-transform text-lg">
          🐥
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex px-4 pb-0 gap-1">
        <TabBtn
          active={currentPage === 'write'}
          onClick={() => onNavigate('write')}
          icon={<BookOpen size={14} />}
          label="일기 쓰기"
        />
        <TabBtn
          active={currentPage === 'gallery'}
          onClick={() => onNavigate('gallery')}
          icon={<Image size={14} />}
          label="갤러리"
        />
      </div>
    </header>
  );
}

function TabBtn({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all active:opacity-80 ${
        active
          ? 'bg-[#FFF8F0] text-[#FFB800]'
          : 'text-white/80 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
