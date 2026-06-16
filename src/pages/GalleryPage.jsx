import { useState, useEffect, useRef } from 'react';
import { Trash2, X, Sparkles, Calendar, Plus, Share2 } from 'lucide-react';
import { getDiaries, deleteDiary } from '../utils/storage';
import { deleteImageBlob, resolveImageUrl } from '../utils/db';
import { ART_STYLE_MAP } from '../utils/pollinations';

const MOOD_EMOJI = {
  happy: '😊', excited: '🎉', calm: '😌',
  sad: '😢', angry: '😠', neutral: '😐',
};
const MOOD_LABEL = {
  happy: '행복해요', excited: '신나요', calm: '편안해요',
  sad: '슬퍼요', angry: '화나요', neutral: '그냥 그래요',
};
const WEATHER_EMOJI = {
  sunny: '☀️', cloudy: '🌥️', rainy: '🌧️',
  snowy: '❄️', windy: '💨',
};
const WEATHER_LABEL = {
  sunny: '맑음', cloudy: '흐림', rainy: '비',
  snowy: '눈', windy: '바람',
};

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/* ── 스타일 배지 ── */
function StyleBadge({ artStyle, className = '' }) {
  const s = ART_STYLE_MAP[artStyle];
  if (!s) return null;
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${className}`}
      style={{ background: '#FFF3D0', color: '#FFB800' }}
      aria-label={`${s.label} 스타일`}
    >
      {s.emoji} {s.label}
    </span>
  );
}

/* ── 갤러리 카드 (IndexedDB 이미지 로드) ── */
function DiaryCard({ diary, onClick }) {
  const [imgSrc, setImgSrc]   = useState(null);   // blob URL or original URL
  const [imgErr, setImgErr]   = useState(false);
  const blobRef               = useRef(null);      // 해제용
  const styleObj              = ART_STYLE_MAP[diary.artStyle];

  useEffect(() => {
    let cancelled = false;
    resolveImageUrl(diary.id, diary.imageUrl).then(result => {
      if (cancelled) return;
      if (result) {
        if (result.isBlob) blobRef.current = result.url;
        setImgSrc(result.url);
      }
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (blobRef.current) { URL.revokeObjectURL(blobRef.current); blobRef.current = null; }
    };
  }, [diary.id, diary.imageUrl]);

  return (
    <button
      onClick={onClick}
      className="card text-left overflow-hidden active:scale-[0.97] transition-transform animate-fade-in-up"
      aria-label={`${diary.title} 일기 보기`}
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minHeight: 48 }}
    >
      {/* 썸네일 */}
      <div className="w-full aspect-square relative overflow-hidden" style={{ background: '#FFF3D0' }}>
        {imgSrc && !imgErr ? (
          <img
            src={imgSrc}
            alt={`${diary.title} AI 그림`}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
            <span className="text-4xl opacity-60">
              {styleObj?.emoji || MOOD_EMOJI[diary.mood] || '📝'}
            </span>
          </div>
        )}
        {/* 날씨+기분 뱃지 */}
        <div
          className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-xs"
          style={{ background: 'rgba(255,255,255,0.88)' }}
          aria-hidden="true"
        >
          {WEATHER_EMOJI[diary.weather] || ''}{MOOD_EMOJI[diary.mood] || ''}
        </div>
      </div>

      {/* 텍스트 */}
      <div className="p-3">
        <p className="text-xs font-semibold leading-snug line-clamp-1 mb-1" style={{ color: '#2D2D2D' }}>
          {diary.title}
        </p>
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <p className="text-[10px] flex items-center gap-0.5" style={{ color: '#aaa' }}>
            <Calendar size={9} aria-hidden="true" />
            {formatDate(diary.date || diary.createdAt)}
          </p>
          {diary.artStyle && <StyleBadge artStyle={diary.artStyle} />}
        </div>
        <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: '#888' }}>
          {diary.text}
        </p>
      </div>
    </button>
  );
}

/* ── 상세 바텀시트 ── */
function DiarySheet({ diary, onClose, onDelete }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [imgSrc, setImgSrc]         = useState(null);
  const [imgErr, setImgErr]         = useState(false);
  const [shareMsg, setShareMsg]     = useState('');
  const blobRef  = useRef(null);
  const blobObjRef = useRef(null);  // Blob 원본 (File 공유용)
  const styleObj = ART_STYLE_MAP[diary.artStyle];

  useEffect(() => {
    let cancelled = false;
    // resolveImageUrl: blob이면 URL + isBlob:true
    resolveImageUrl(diary.id, diary.imageUrl).then(async result => {
      if (cancelled) return;
      if (result) {
        if (result.isBlob) blobRef.current = result.url;
        setImgSrc(result.url);
        // File 공유를 위해 Blob도 따로 저장
        if (result.isBlob) {
          try {
            const r = await fetch(result.url);
            blobObjRef.current = await r.blob();
          } catch { /* 무시 */ }
        }
      }
    }).catch(() => {});
    return () => {
      cancelled = true;
      if (blobRef.current) { URL.revokeObjectURL(blobRef.current); blobRef.current = null; }
    };
  }, [diary.id, diary.imageUrl]);

  const doDelete = async () => {
    if (confirmDel) {
      deleteDiary(diary.id);
      await deleteImageBlob(diary.id).catch(() => {});
      onDelete();
    } else {
      setConfirmDel(true);
      setTimeout(() => setConfirmDel(false), 3000);
    }
  };

  /* ── 공유 ── */
  const handleShare = async () => {
    const shareText = `📔 ${diary.title}\n\n${diary.text}`;

    // 이미지 파일 공유 시도
    if (navigator.canShare && blobObjRef.current) {
      try {
        const file = new File([blobObjRef.current], 'diary-image.jpg', { type: 'image/jpeg' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: diary.title, text: shareText, files: [file] });
          return;
        }
      } catch (err) {
        if (err.name === 'AbortError') return;  // 사용자 취소
      }
    }

    // 텍스트만 공유
    if (navigator.share) {
      try {
        await navigator.share({ title: diary.title, text: shareText });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    // 클립보드 폴백
    try {
      await navigator.clipboard.writeText(shareText);
      setShareMsg('클립보드에 복사되었어요!');
      setTimeout(() => setShareMsg(''), 2500);
    } catch {
      setShareMsg('공유를 지원하지 않는 브라우저예요');
      setTimeout(() => setShareMsg(''), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${diary.title} 일기 상세`}
    >
      <div
        className="w-full max-w-[430px] rounded-t-3xl overflow-y-auto animate-fade-in-up"
        style={{ background: '#FFF8F0', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: '#DDD' }} aria-hidden="true" />
        </div>

        {/* 헤더 */}
        <div className="px-5 py-3 flex items-start justify-between border-b" style={{ borderColor: '#F0E8D8' }}>
          <div className="flex-1 pr-3">
            <h2 className="font-bold text-[16px]" style={{ color: '#2D2D2D' }}>{diary.title}</h2>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-xs flex items-center gap-1" style={{ color: '#888' }}>
                <Calendar size={10} aria-hidden="true" />
                {formatDate(diary.date || diary.createdAt)}
              </span>
              <span
                className="text-xs"
                aria-label={`날씨: ${WEATHER_LABEL[diary.weather] || diary.weather}`}
              >
                {WEATHER_EMOJI[diary.weather] || ''}
              </span>
              <span
                className="text-xs"
                aria-label={`기분: ${MOOD_LABEL[diary.mood] || diary.mood}`}
              >
                {MOOD_EMOJI[diary.mood] || ''}
              </span>
              {diary.artStyle && <StyleBadge artStyle={diary.artStyle} />}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            style={{ background: '#F0E8D8' }}
            aria-label="닫기"
          >
            <X size={16} color="#888" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* AI 그림 */}
          {imgSrc && !imgErr ? (
            <div className="relative rounded-2xl overflow-hidden" style={{ border: '2px solid #F0E8D8' }}>
              <img
                src={imgSrc}
                alt={`${diary.title} AI 그림`}
                className="w-full max-h-72 object-cover block"
                onError={() => setImgErr(true)}
              />
              <div
                className="absolute top-2 left-2 rounded-full px-2 py-0.5 flex items-center gap-1"
                style={{ background: 'rgba(255,255,255,0.88)' }}
                aria-hidden="true"
              >
                <Sparkles size={10} style={{ color: '#FFB800' }} />
                <span className="text-[10px] font-semibold" style={{ color: '#FFB800' }}>
                  {styleObj ? `${styleObj.emoji} ${styleObj.label}` : 'AI 그림'}
                </span>
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl flex flex-col items-center justify-center py-10 gap-2"
              style={{ background: '#F5EDD8', border: '2px solid #F0E8D8' }}
              aria-label="그림이 없는 일기"
            >
              <span className="text-4xl opacity-50" aria-hidden="true">📝</span>
              <p className="text-xs" style={{ color: '#aaa' }}>그림이 없는 일기예요</p>
            </div>
          )}

          {/* 공유 버튼 */}
          <button
            onClick={handleShare}
            className="w-full py-3 min-h-[48px] rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            style={{ background: '#FFF3D0', color: '#FFB800', border: '2px solid #FFE999' }}
            aria-label="일기 공유하기"
          >
            <Share2 size={15} aria-hidden="true" />
            {shareMsg || '일기 공유하기'}
          </button>

          {/* 일기 본문 */}
          <div className="rounded-2xl p-4 diary-lines" style={{ border: '2px solid #F0E8D8' }}>
            <p className="text-sm leading-8 whitespace-pre-wrap" style={{ color: '#2D2D2D' }}>
              {diary.text}
            </p>
          </div>

          {/* 삭제 버튼 */}
          <button
            onClick={doDelete}
            className="w-full py-3 min-h-[48px] rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            style={confirmDel
              ? { background: '#ef4444', color: 'white' }
              : { background: '#F5EDD8', color: '#888' }}
            aria-label={confirmDel ? '한 번 더 누르면 삭제됩니다' : '일기 삭제'}
          >
            <Trash2 size={14} aria-hidden="true" />
            {confirmDel ? '한 번 더 누르면 삭제됩니다' : '일기 삭제'}
          </button>
          <div style={{ height: 8 }} />
        </div>
      </div>
    </div>
  );
}

/* ── 갤러리 페이지 ── */
export default function GalleryPage({ onNavigate }) {
  const [diaries, setDiaries]   = useState(() => getDiaries());
  const [selected, setSelected] = useState(null);

  const refresh = () => setDiaries(getDiaries());

  if (diaries.length === 0) {
    return (
      <div className="max-w-[430px] mx-auto px-4 py-20 flex flex-col items-center text-center animate-fade-in-up">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-5 text-5xl"
          style={{ background: '#FFF3D0' }}
          aria-hidden="true"
        >
          📖
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: '#2D2D2D' }}>아직 일기가 없어요</h2>
        <p className="text-sm mb-8" style={{ color: '#888' }}>
          오늘의 이야기를 기록하고<br />AI 그림으로 꾸며봐요!
        </p>
        <button
          onClick={() => onNavigate('write')}
          className="btn-primary"
          style={{ width: 'auto', paddingLeft: 28, paddingRight: 28 }}
          aria-label="첫 일기 쓰기"
        >
          <Plus size={16} aria-hidden="true" />
          첫 일기 쓰기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto px-4 pb-8 pt-5 animate-fade-in-up">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#2D2D2D' }}>내 그림일기</h2>
          <p className="text-xs mt-0.5" style={{ color: '#aaa' }}>{diaries.length}편의 이야기</p>
        </div>
        <button
          onClick={() => onNavigate('write')}
          className="flex items-center gap-1.5 px-4 py-2 min-h-[48px] rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform"
          style={{ background: '#FFB800' }}
          aria-label="새 일기 쓰기"
        >
          <Plus size={14} aria-hidden="true" />
          새 일기
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3" role="list" aria-label="일기 목록">
        {diaries.map(d => (
          <div key={d.id} role="listitem">
            <DiaryCard diary={d} onClick={() => setSelected(d)} />
          </div>
        ))}
      </div>

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
