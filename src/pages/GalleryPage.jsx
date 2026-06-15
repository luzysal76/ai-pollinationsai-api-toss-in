import { useState } from 'react';
import { Trash2, ChevronLeft, X, Sparkles, Calendar } from 'lucide-react';
import { getDiaries, deleteDiary } from '../utils/storage';

const moodEmoji = {
  happy: '😊', excited: '🤩', calm: '😌',
  sad: '😢', angry: '😤', neutral: '😐',
};

const weatherEmoji = {
  sunny: '☀️', cloudy: '☁️', rainy: '🌧️',
  snowy: '❄️', windy: '💨',
};

function formatDate(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function DiaryModal({ diary, onClose, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (confirmDelete) {
      deleteDiary(diary.id);
      onDelete();
      onClose();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-amber-50 rounded-t-3xl max-h-[90vh] overflow-y-auto animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-amber-300 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-amber-200">
          <div>
            <h2 className="font-bold text-amber-900 text-base">{diary.title}</h2>
            <p className="text-xs text-amber-500 mt-0.5">
              {formatDate(diary.date || diary.createdAt)}
              {' '}{weatherEmoji[diary.weather] || ''}{' '}{moodEmoji[diary.mood] || ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-100 active:scale-95 transition-transform"
          >
            <X size={16} className="text-amber-700" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-5 space-y-4">
          {/* AI 그림 */}
          {diary.imageUrl ? (
            <div className="relative rounded-2xl overflow-hidden aspect-square max-w-xs mx-auto border-2 border-amber-200 shadow-md">
              <img
                src={diary.imageUrl}
                alt="AI 생성 그림"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                <Sparkles size={10} className="text-amber-500" />
                <span className="text-[10px] text-amber-700 font-medium">AI 그림</span>
              </div>
            </div>
          ) : (
            <div className="aspect-square max-w-xs mx-auto rounded-2xl bg-amber-100 border-2 border-amber-200 flex items-center justify-center">
              <div className="text-center">
                <span className="text-5xl">📝</span>
                <p className="text-xs text-amber-500 mt-2">그림 없는 일기</p>
              </div>
            </div>
          )}

          {/* 일기 텍스트 */}
          <div className="diary-paper rounded-2xl border-2 border-amber-200 p-4">
            <p className="text-sm text-amber-900 leading-8 whitespace-pre-wrap">{diary.text}</p>
          </div>
        </div>

        {/* 삭제 버튼 */}
        <div className="px-5 pb-8">
          <button
            onClick={handleDelete}
            className={`w-full py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-all ${
              confirmDelete
                ? 'bg-red-500 text-white'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            <Trash2 size={14} />
            {confirmDelete ? '한 번 더 누르면 삭제됩니다' : '일기 삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage({ onNavigate, refreshKey }) {
  const [selectedDiary, setSelectedDiary] = useState(null);
  const [diaries, setDiaries] = useState(() => getDiaries());
  const [imageErrors, setImageErrors] = useState({});

  const refresh = () => setDiaries(getDiaries());

  if (diaries.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-5xl">📖</span>
        </div>
        <h2 className="text-lg font-bold text-amber-900 mb-2">아직 일기가 없어요</h2>
        <p className="text-sm text-amber-600 mb-6">
          오늘의 이야기를 기록하고<br />AI 그림으로 꾸며봐요!
        </p>
        <button
          onClick={() => onNavigate('write')}
          className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl font-medium text-sm shadow-md active:scale-95 transition-transform"
        >
          ✏️ 첫 일기 쓰기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-8">
      {/* 헤더 */}
      <div className="py-4 text-center">
        <h1 className="text-lg font-bold text-amber-900">📚 내 그림일기</h1>
        <p className="text-xs text-amber-500 mt-1">{diaries.length}편의 이야기</p>
      </div>

      {/* 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {diaries.map((diary, index) => (
          <button
            key={diary.id}
            onClick={() => setSelectedDiary(diary)}
            className="bg-white rounded-2xl border-2 border-amber-100 overflow-hidden text-left shadow-sm hover:shadow-md active:scale-95 transition-all animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* 이미지 썸네일 */}
            <div className="aspect-square bg-amber-50 relative">
              {diary.imageUrl && !imageErrors[diary.id] ? (
                <img
                  src={diary.imageUrl}
                  alt={diary.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageErrors(prev => ({ ...prev, [diary.id]: true }))}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl">
                    {moodEmoji[diary.mood] || '📝'}
                  </span>
                </div>
              )}

              {/* 날씨/기분 뱃지 */}
              <div className="absolute top-1.5 left-1.5 bg-white/80 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-xs">
                {weatherEmoji[diary.weather] || ''}{moodEmoji[diary.mood] || ''}
              </div>
            </div>

            {/* 정보 */}
            <div className="p-2.5">
              <p className="font-semibold text-amber-900 text-xs leading-tight line-clamp-1">
                {diary.title}
              </p>
              <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-0.5">
                <Calendar size={8} />
                {formatDate(diary.date || diary.createdAt)}
              </p>
              <p className="text-[10px] text-amber-600 mt-1 line-clamp-2 leading-relaxed">
                {diary.text}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* 새 일기 버튼 */}
      <div className="mt-6 text-center">
        <button
          onClick={() => onNavigate('write')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-white rounded-2xl font-medium text-sm shadow-md active:scale-95 transition-transform"
        >
          ✏️ 새 일기 쓰기
        </button>
      </div>

      {/* 다이얼로그 */}
      {selectedDiary && (
        <DiaryModal
          diary={selectedDiary}
          onClose={() => setSelectedDiary(null)}
          onDelete={() => {
            refresh();
            setSelectedDiary(null);
          }}
        />
      )}
    </div>
  );
}
