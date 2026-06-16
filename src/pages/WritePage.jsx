import { useState, useRef } from 'react';
import { ChevronDown, Sparkles, Save, RefreshCw } from 'lucide-react';
import MoodPicker from '../components/MoodPicker';
import { saveDiary } from '../utils/storage';
import { generateDiaryImageUrl } from '../utils/pollinations';

const WEATHER = [
  { key: 'sunny',  emoji: '☀️',  label: '맑음' },
  { key: 'cloudy', emoji: '🌥️', label: '흐림' },
  { key: 'rainy',  emoji: '🌧️', label: '비' },
  { key: 'snowy',  emoji: '❄️',  label: '눈' },
  { key: 'windy',  emoji: '💨', label: '바람' },
];

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MAX_TEXT = 500;

function formatDateDisplay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`;
}

function getTodayIso() {
  return new Date().toISOString().split('T')[0];
}

export default function WritePage({ onNavigate, onSaved }) {
  const today = getTodayIso();
  const [date, setDate]         = useState(today);
  const [weather, setWeather]   = useState('sunny');
  const [mood, setMood]         = useState('happy');
  const [text, setText]         = useState('');
  const [imageData, setImageData] = useState(null); // { url, prompt, seed }
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const dateInputRef = useRef(null);

  /* ---------- 이미지 생성 ---------- */
  const handleGenerate = () => {
    if (!text.trim()) return;
    setImgLoading(true);
    setImgError(false);

    const result = generateDiaryImageUrl(text, mood);
    setImageData(result);
  };

  const handleImgLoad  = () => setImgLoading(false);
  const handleImgError = () => { setImgLoading(false); setImgError(true); };

  const handleRegenerate = () => {
    setImgLoading(true);
    setImgError(false);
    const result = generateDiaryImageUrl(text, mood);
    setImageData(result);
  };

  /* ---------- 저장 ---------- */
  const handleSave = async () => {
    if (!text.trim() || saving || saved) return;
    setSaving(true);

    saveDiary({
      title:       formatDateDisplay(date),
      text:        text.trim(),
      mood,
      weather,
      date,
      imageUrl:    imageData?.url    || null,
      imagePrompt: imageData?.prompt || null,
      imageSeed:   imageData?.seed   || null,
    });

    setSaved(true);
    setSaving(false);
    setTimeout(() => {
      onSaved?.();
      onNavigate('gallery');
    }, 900);
  };

  const hasText    = text.trim().length > 0;
  const hasImage   = !!imageData?.url;
  const btnPhase   = saved ? 'saved' : (hasImage ? 'save' : 'generate');

  return (
    /* 하단 버튼 공간 확보 */
    <div className="max-w-[430px] mx-auto px-4 pb-28 pt-4 space-y-4 animate-fade-in-up">

      {/* ① 날짜 선택 카드 */}
      <div
        className="card px-4 py-3.5 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform relative"
        onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📅</span>
          <span className="font-medium text-[15px]" style={{ color: '#2D2D2D' }}>
            {formatDateDisplay(date)}
          </span>
        </div>
        <ChevronDown size={18} color="#888" />
        {/* 숨겨진 네이티브 날짜 입력 */}
        <input
          ref={dateInputRef}
          type="date"
          value={date}
          max={today}
          onChange={e => setDate(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          style={{ zIndex: 1 }}
        />
      </div>

      {/* ② 오늘의 날씨 */}
      <div>
        <p className="section-label">오늘의 날씨</p>
        <div className="flex gap-2">
          {WEATHER.map(w => (
            <button
              key={w.key}
              onClick={() => setWeather(w.key)}
              className={`select-card flex-1 flex flex-col items-center gap-1 py-3 ${weather === w.key ? 'selected' : ''}`}
            >
              <span className="text-2xl">{w.emoji}</span>
              <span className="text-[11px] font-medium" style={{ color: weather === w.key ? '#FFB800' : '#888' }}>
                {w.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ③ 기분 */}
      <MoodPicker selected={mood} onChange={setMood} />

      {/* ④ 오늘 있었던 일 */}
      <div>
        <p className="section-label">오늘 있었던 일</p>
        <div className="card overflow-hidden diary-lines">
          <textarea
            value={text}
            onChange={e => setText(e.target.value.slice(0, MAX_TEXT))}
            placeholder="여기에 오늘의 소중한 순간을 기록해 보세요..."
            rows={6}
            className="w-full px-4 pt-4 pb-3 bg-transparent text-[14px] focus:outline-none resize-none placeholder-[#C8C0B0]"
            style={{ lineHeight: '32px', color: '#2D2D2D' }}
          />
          <div className="px-4 pb-3 text-right">
            <span className="text-xs" style={{ color: text.length >= MAX_TEXT ? '#ef4444' : '#aaa' }}>
              {text.length} / {MAX_TEXT}
            </span>
          </div>
        </div>
      </div>

      {/* ⑤ 미리보기 영역 */}
      <div>
        <p className="section-label">AI 그림 미리보기</p>
        <div
          className="card overflow-hidden"
          style={{ minHeight: 180 }}
        >
          {imgLoading && imageData?.url ? (
            /* 로딩 */
            <div className="relative w-full aspect-square max-w-[260px] mx-auto my-4">
              <div className="shimmer absolute inset-0 rounded-xl" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Sparkles size={28} className="spin-slow" style={{ color: '#FFB800' }} />
                <p className="text-sm font-medium" style={{ color: '#888' }}>AI가 그림 그리는 중...</p>
              </div>
            </div>
          ) : hasImage && !imgError ? (
            /* 이미지 */
            <div className="relative">
              <img
                src={imageData.url}
                alt="AI 생성 그림"
                className="w-full max-w-[260px] mx-auto block rounded-xl my-4 animate-fade-in-up"
                style={{ display: 'block' }}
                onLoad={handleImgLoad}
                onError={handleImgError}
              />
              <button
                onClick={handleRegenerate}
                className="absolute top-6 right-4 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
                title="다시 생성"
              >
                <RefreshCw size={14} style={{ color: '#FFB800' }} />
              </button>
            </div>
          ) : imgError ? (
            /* 에러 */
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-3xl">😢</span>
              <p className="text-sm" style={{ color: '#888' }}>그림 생성에 실패했어요</p>
              <button
                onClick={handleRegenerate}
                className="mt-1 px-4 py-1.5 rounded-full text-xs font-semibold text-white"
                style={{ background: '#FFB800' }}
              >
                다시 시도
              </button>
            </div>
          ) : (
            /* 플레이스홀더 */
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-4xl opacity-40">🎨</span>
              <p className="text-sm text-center" style={{ color: '#aaa' }}>
                기록을 마치면<br />그림을 생성할 수 있어요
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 그림 없이 저장 안내 */}
      {hasText && !hasImage && (
        <p className="text-center text-xs" style={{ color: '#aaa' }}>
          💡 그림 없이도 저장할 수 있어요
        </p>
      )}

      {/* ⑥ 하단 고정 CTA 버튼 */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3"
        style={{ background: 'linear-gradient(to top, #FFF8F0 70%, transparent)', zIndex: 40 }}
      >
        <div className="max-w-[430px] mx-auto space-y-2">
          {btnPhase === 'saved' ? (
            <button className="btn-primary success" disabled>
              ✅ 저장 완료! 갤러리로 이동 중...
            </button>
          ) : btnPhase === 'save' ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
              >
                <Save size={16} />
                {saving ? '저장 중...' : '그림일기 저장하기'}
              </button>
              <button
                onClick={handleRegenerate}
                className="w-full py-3 rounded-2xl text-sm font-semibold border-2 flex items-center justify-center gap-2 active:scale-98 transition-all"
                style={{ borderColor: '#FFB800', color: '#FFB800', background: 'white' }}
              >
                <RefreshCw size={14} />
                다른 그림으로 다시 생성
              </button>
            </>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!hasText || imgLoading}
              className="btn-primary"
            >
              <Sparkles size={16} />
              {imgLoading ? 'AI 그림 그리는 중...' : '✨ AI 그림 만들기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
