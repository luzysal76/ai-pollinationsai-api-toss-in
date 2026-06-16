import { Menu, BookOpen, Image, Settings } from 'lucide-react';

export default function Header({ currentPage, onNavigate }) {
  return (
    <header className="sticky top-0 z-50" style={{ background: '#FFB800' }}>
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* 햄버거 */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-xl active:bg-white/20 transition-colors"
          aria-label="메뉴"
        >
          <Menu size={22} color="white" strokeWidth={2.5} aria-hidden="true" />
        </button>

        {/* 타이틀 */}
        <h1 className="font-handwriting text-white text-xl font-bold tracking-wide">
          오늘 하루 기록하기
        </h1>

        {/* 프로필 아바타 */}
        <button
          className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm active:scale-95 transition-transform text-lg"
          aria-label="프로필"
        >
          🐥
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex px-4 pb-0 gap-1" role="tablist" aria-label="페이지 탭">
        <TabBtn
          active={currentPage === 'write'}
          onClick={() => onNavigate('write')}
          icon={<BookOpen size={14} aria-hidden="true" />}
          label="일기 쓰기"
          ariaControls="page-write"
        />
        <TabBtn
          active={currentPage === 'gallery'}
          onClick={() => onNavigate('gallery')}
          icon={<Image size={14} aria-hidden="true" />}
          label="갤러리"
          ariaControls="page-gallery"
        />
        <TabBtn
          active={currentPage === 'settings'}
          onClick={() => onNavigate('settings')}
          icon={<Settings size={14} aria-hidden="true" />}
          label="설정"
          ariaControls="page-settings"
        />
      </div>
    </header>
  );
}

function TabBtn({ active, onClick, icon, label, ariaControls }) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      aria-controls={ariaControls}
      className={`flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-t-xl text-sm font-semibold transition-all active:opacity-80 ${
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
