import { useState } from 'react';
import { Trash2, X, Sparkles, Calendar, Plus } from 'lucide-react';
import { getDiaries, deleteDiary } from '../utils/storage';

const MOOD_EMOJI = {
  happy: '😊', excited: '🎉', calm: '😌',
  sad: '😢', angry: '😠', neutral: '😐',
};
const WEATHER_EMOJI = {
  sunny: '☀️', cloudy: '🌥️', rainy: '🌧️',
  snowy: '❄️', windy: '💨',
};

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/* ── 상세 바텀시트 ── */
function DiarySheet({ diary, onClose, onDelete }) {
  const [confirmDel, setConfirmDel] = useState(false);

  const doDelete = () => {
    if (confirmDel) {
      deleteDiary(diary.id);
      onDelete();
    } else {
      setConfirmDel(true);
      setTimeout(() => setConfirmDel(false), 3000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] rounded-t-3xl overflow-y-auto animate-fade-in-up"
        style={{ background: '#FFF8F0', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: '#DDD' }} />
        </div>

        {/* 헤더 */}
        <div className="px-5 py-3 flex items-start justify-between border-b" style={{ borderColor: '#F0E8D8' }}>
          <div className="flex-1 pr-3">
            <h2 className="font-bold text-[16px]" style={{ color: '#2D2D2D' }}>{diary.title}</h2>
            <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: '#888' }}>
              <Calendar size={10} />
              {formatDate(diary.date || diary.createdAt)}
              <span>{WEATHER_EMOJI[diary.weather] || ''}</span>
              <span>{MOOD_EMOJI[diary.mood] || ''}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#F0E8D8' }}
          >
            <X size={16} color="#888" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* AI 그림 */}
          {diary.imageUrl ? (
            <div className="relative rounded-2xl overflow-hidden" style={{ border: '2px solid #F0E8D8' }}>
              <img
                src={diary.imageUrl}
                alt="AI 그림"
                className="w-full max-h-64 object-cover block"
              />
              <div
                className="absolute top-2 left-2 rounded-full px-2 py-0.5 flex items-center gap-1"
                style={{ background: 'rgba(255,255,255,0.85)' }}
              >
                <Sparkles size={10} style={{ color: '#FFB800' }} />
                <span className="text-[10px] font-semibold" style={{ color: '#FFB800' }}>AI 그림</span>
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl flex flex-col items-center justify-center py-10 gap-2"
              style={{ background: '#F5EDD8', border: '2px solid #F0E8D8' }}
            >
              <span className="text-4xl opacity-50">📝</span>
              <p className="text-xs" style={{ color: '#aaa' }}>그림이 없는 일기예요</p>
            </div>
          )}

          {/* 일기 본문 */}
          <div
            className="rounded-2xl p-4 diary-lines"
            style={{ border: '2px solid #F0E8D8' }}
          >
            <p className="text-sm leading-8 whitespace-pre-wrap" style={{ color: '#2D2D2D' }}>
              {diary.text}
            </p>
          </div>

          {/* 삭제 버튼 */}
          <button
            onClick={doDelete}
            className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            style={
              confirmDel
                ? { background: '#ef4444', color: 'white' }
                : { background: '#F5EDD8', color: '#888' }
            }
          >
            <Trash2 size={14} />
            {confirmDel ? '한 번 더 누르면 삭제됩니다' : '일기 삭제'}
          </button>
          <div style={{ height: 8 }} />
        </div>
      </div>
    </div>
  );
}

/* ── 갤러리 카드 ── */
function DiaryCard({ diary, onClick }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <button
      onClick={onClick}
      className="card text-left overflow-hidden active:scale-[0.97] transition-transform animate-fade-in-up"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
    >
      {/* 썸네일 */}
      <div
        className="w-full aspect-square relative overflow-hidden"
        style={{ background: '#FFF3D0' }}
      >
        {diary.imageUrl && !imgErr ? (
          <img
            src={diary.imageUrl}
            alt={diary.title}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-60">
              {MOOD_EMOJI[diary.mood] || '📝'}
            </span>
          </div>
        )}
        {/* 날씨+기분 뱃지 */}
        <div
          className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-xs"
          style={{ background: 'rgba(255,255,255,0.88)' }}
        >
          {WEATHER_EMOJI[diary.weather] || ''}{MOOD_EMOJI[diary.mood] || ''}
        </div>
      </div>

      {/* 텍스트 */}
      <div className="p-3">
        <p className="text-xs font-semibold leading-snug line-clamp-1 mb-1" style={{ color: '#2D2D2D' }}>
          {diary.title}
        </p>
        <p className="text-[10px] flex items-center gap-0.5 mb-1.5" style={{ color: '#aaa' }}>
          <Calendar size={9} />
          {formatDate(diary.date || diary.createdAt)}
        </p>
        <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: '#888' }}>
          {diary.text}
        </p>
      </div>
    </button>
  );
}

/* ── 갤러리 페이지 ── */
export default function GalleryPage({ onNavigate }) {
  const [diaries, setDiaries]  = useState(() => getDiaries());
  const [selected, setSelected] = useState(null);

  const refresh = () => setDiaries(getDiaries());

  /* 빈 상태 */
  if (diaries.length === 0) {
    return (
      <div className="max-w-[430px] mx-auto px-4 py-20 flex flex-col items-center text-center animate-fade-in-up">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-5 text-5xl"
          style={{ background: '#FFF3D0' }}
        >
          📖
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: '#2D2D2D' }}>
          아직 일기가 없어요
        </h2>
        <p className="text-sm mb-8" style={{ color: '#888' }}>
          오늘의 이야기를 기록하고<br />AI 그림으로 꾸며봐요!
        </p>
        <button
          onClick={() => onNavigate('write')}
          className="btn-primary"
          style={{ width: 'auto', paddingLeft: 28, paddingRight: 28 }}
        >
          <Plus size={16} />
          첫 일기 쓰기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto px-4 pb-8 pt-5 animate-fade-in-up">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#2D2D2D' }}>내 그림일기</h2>
          <p className="text-xs mt-0.5" style={{ color: '#aaa' }}>{diaries.length}편의 이야기</p>
        </div>
        <button
          onClick={() => onNavigate('write')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform"
          style={{ background: '#FFB800' }}
        >
          <Plus size={14} />
          새 일기
        </button>
      </div>

      {/* 2열 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {diaries.map((d, i) => (
          <DiaryCard
            key={d.id}
            diary={d}
            onClick={() => setSelected(d)}
            style={{ animationDelay: `${i * 40}ms` }}
          />
        ))}
      </div>

      {/* 바텀시트 */}
      {selected && (
        <DiarySheet
          diary={selected}
          onClose={() => setSelected(null)}
          onDelete={() => { refresh(); setSelected(null); }}
        />
      )}
    </div>
  );
}
