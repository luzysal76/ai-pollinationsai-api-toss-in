import { useState, useRef, useCallback } from 'react';
import { ChevronDown, Sparkles, Save, RefreshCw, Mic, MicOff } from 'lucide-react';
import MoodPicker from '../components/MoodPicker';
import ArtStylePicker from '../components/ArtStylePicker';
import GeneratingOverlay from '../components/GeneratingOverlay';
import { saveDiary } from '../utils/storage';
import { saveImageBlob } from '../utils/db';
import { generateDiaryImageUrl, DEFAULT_STYLE, ART_STYLE_MAP } from '../utils/pollinations';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const WEATHER = [
  { key: 'sunny',  emoji: '☀️',  label: '맑음' },
  { key: 'cloudy', emoji: '🌥️', label: '흐림' },
  { key: 'rainy',  emoji: '🌧️', label: '비' },
  { key: 'snowy',  emoji: '❄️',  label: '눈' },
  { key: 'windy',  emoji: '💨',  label: '바람' },
];
const DAYS    = ['일', '월', '화', '수', '목', '금', '토'];
const MAX_TXT = 500;

function formatDateDisplay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`;
}
function getTodayIso() { return new Date().toISOString().split('T')[0]; }

export default function WritePage({ onNavigate, onSaved }) {
  const today = getTodayIso();

  /* ── 폼 상태 ── */
  const [date, setDate]         = useState(today);
  const [weather, setWeather]   = useState('sunny');
  const [mood, setMood]         = useState('happy');
  const [artStyle, setArtStyle] = useState(DEFAULT_STYLE);
  const [text, setText]         = useState('');

  /* ── 이미지 상태 ── */
  const [imageData,   setImageData]   = useState(null);
  const [generating,  setGenerating]  = useState(false);
  const [imgLoading,  setImgLoading]  = useState(false); // fallback URL 로딩 중
  const [imgError,    setImgError]    = useState(false);

  /* ── 저장 상태 ── */
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  /* ── 음성 인식 ── */
  const [interimText, setInterimText] = useState('');

  const handleSpeechResult = useCallback(({ final, interim }) => {
    if (final) {
      setText(prev => (prev + (prev ? ' ' : '') + final).slice(0, MAX_TXT));
      setInterimText('');
    } else {
      setInterimText(interim);
    }
  }, []);

  const { isListening, isSupported, toggleListening } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onEnd:    () => setInterimText(''),
  });

  const dateInputRef    = useRef(null);
  const abortRef        = useRef(null);   // AbortController
  const abortReasonRef  = useRef(null);   // 'user' | 'timeout' | null

  /* ── 모든 이미지 상태 초기화 ── */
  const resetImageState = () => {
    if (imageData?.blobUrl) URL.revokeObjectURL(imageData.blobUrl);
    setImageData(null);
    setImgError(false);
    setImgLoading(false);
    abortReasonRef.current = null;
  };

  /* ── 스타일 변경 시 이미지 초기화 ── */
  const handleStyleChange = (key) => {
    setArtStyle(key);
    resetImageState();
  };

  /* ── AI 이미지 생성 ── */
  const doGenerate = async () => {
    if (!text.trim() || generating) return;

    resetImageState();

    const ctrl = new AbortController();
    abortRef.current       = ctrl;
    abortReasonRef.current = null;
    setGenerating(true);

    const { url, prompt, seed } = generateDiaryImageUrl(text, mood, weather, artStyle);

    // 60초 타임아웃
    const timeoutId = setTimeout(() => {
      abortReasonRef.current = 'timeout';
      ctrl.abort();
    }, 60_000);

    try {
      const resp = await fetch(url, { signal: ctrl.signal, mode: 'cors' });
      clearTimeout(timeoutId);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob    = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      // Blob 성공: IndexedDB 저장 가능
      setImageData({ blobUrl, blob, originalUrl: url, prompt, seed });

    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError' && abortReasonRef.current === 'user') {
        // 사용자가 직접 취소 → 상태 변경 없이 종료
        return;
      }

      // 타임아웃 또는 CORS/네트워크 오류 → URL 직접 사용 폴백
      console.warn('[그림일기] fetch 실패 → URL 직접 폴백', {
        reason:    abortReasonRef.current || err.name,
        message:   err.message,
        urlLength: url.length,
      });
      setImageData({ blobUrl: null, blob: null, originalUrl: url, prompt, seed });
      setImgLoading(true); // img onLoad/onError 전까지 스피너 표시
    } finally {
      setGenerating(false);
      abortReasonRef.current = null;
    }
  };

  /* ── 취소 ── */
  const handleCancel = () => {
    abortReasonRef.current = 'user';
    abortRef.current?.abort();
  };

  /* ── 저장 ── */
  const handleSave = async () => {
    if (!text.trim() || saving || saved) return;
    setSaving(true);

    const entry = saveDiary({
      title:       formatDateDisplay(date),
      text:        text.trim(),
      mood, weather, artStyle, date,
      imageUrl:    imageData?.originalUrl || null,
      imagePrompt: imageData?.prompt      || null,
      imageSeed:   imageData?.seed        || null,
    });

    if (imageData?.blob) {
      await saveImageBlob(entry.id, imageData.blob).catch(() => {});
    }
    if (imageData?.blobUrl) URL.revokeObjectURL(imageData.blobUrl);

    setSaved(true);
    setSaving(false);
    setTimeout(() => { onSaved?.(); onNavigate('gallery'); }, 900);
  };

  const hasText       = text.trim().length > 0;
  const hasImage      = !!(imageData?.blobUrl || imageData?.originalUrl);
  const imgDisplaySrc = imageData?.blobUrl || imageData?.originalUrl || null;
  const btnPhase      = saved ? 'saved' : hasImage ? 'save' : 'generate';
  const styleObj      = ART_STYLE_MAP[artStyle];

  return (
    <>
      {generating && (
        <GeneratingOverlay styleLabel={styleObj?.label} onCancel={handleCancel} />
      )}

      <div className="max-w-[430px] mx-auto px-4 pb-28 pt-4 space-y-4 animate-fade-in-up">

        {/* ① 날짜 카드 */}
        <div
          className="card px-4 py-3.5 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform relative"
          onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
          role="button"
          aria-label={`날짜 선택: ${formatDateDisplay(date)}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl" aria-hidden="true">📅</span>
            <span className="font-medium text-[15px]" style={{ color: '#2D2D2D' }}>
              {formatDateDisplay(date)}
            </span>
          </div>
          <ChevronDown size={18} color="#888" aria-hidden="true" />
          <input
            ref={dateInputRef}
            type="date"
            value={date}
            max={today}
            onChange={e => setDate(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label="날짜 선택"
            style={{ zIndex: 1 }}
          />
        </div>

        {/* ② 날씨 */}
        <div>
          <p className="section-label" id="weather-label">오늘의 날씨</p>
          <div className="flex gap-2" role="group" aria-labelledby="weather-label">
            {WEATHER.map(w => (
              <button
                key={w.key}
                onClick={() => setWeather(w.key)}
                aria-label={w.label}
                aria-pressed={weather === w.key}
                className={`select-card flex-1 flex flex-col items-center gap-1 py-3 min-h-[56px] ${weather === w.key ? 'selected' : ''}`}
              >
                <span className="text-2xl" aria-hidden="true">{w.emoji}</span>
                <span className="text-[11px] font-medium" style={{ color: weather === w.key ? '#FFB800' : '#888' }}>
                  {w.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ③ 기분 */}
        <MoodPicker selected={mood} onChange={setMood} />

        {/* ④ 그림 스타일 */}
        <ArtStylePicker selected={artStyle} onChange={handleStyleChange} />

        {/* ⑤ 일기 텍스트 */}
        <div>
          <p className="section-label" id="diary-label">오늘 있었던 일</p>
          <div className="card overflow-hidden diary-lines relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX_TXT))}
              placeholder={isListening ? '말씀해 주세요...' : '여기에 오늘의 소중한 순간을 기록해 보세요...'}
              rows={6}
              aria-label="오늘 있었던 일"
              aria-describedby="diary-label"
              className="w-full px-4 pt-4 pb-3 bg-transparent text-[14px] focus:outline-none resize-none placeholder-[#C8C0B0]"
              style={{ lineHeight: '32px', color: '#2D2D2D', paddingRight: isSupported ? '52px' : undefined }}
            />
            {/* 중간 인식 결과 */}
            {interimText ? (
              <p
                className="px-4 text-[13px] italic"
                style={{ color: '#C8B89A', marginTop: '-6px' }}
                aria-live="polite"
              >
                {interimText}
              </p>
            ) : null}
            <div className="px-4 pb-3 flex items-center justify-between">
              {isListening ? (
                <span className="text-xs flex items-center gap-1" style={{ color: '#FF4444' }}>
                  <span className="animate-pulse" aria-hidden="true">●</span> 듣고 있어요...
                </span>
              ) : <span />}
              <span
                className="text-xs"
                style={{ color: text.length >= MAX_TXT ? '#ef4444' : '#aaa' }}
                aria-live="polite"
                aria-label={`${text.length}자 / ${MAX_TXT}자 입력됨`}
              >
                {text.length} / {MAX_TXT}
              </span>
            </div>

            {/* 🎤 음성 입력 버튼 */}
            {isSupported && (
              <button
                onClick={toggleListening}
                aria-label={isListening ? '음성 입력 중지' : '음성으로 입력'}
                aria-pressed={isListening}
                className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{
                  background:  isListening ? '#FF4444' : '#FFB800',
                  boxShadow:   isListening
                    ? '0 0 0 4px rgba(255,68,68,0.25), 0 2px 6px rgba(0,0,0,0.12)'
                    : '0 2px 6px rgba(0,0,0,0.12)',
                }}
              >
                {isListening
                  ? <MicOff size={16} color="white" aria-hidden="true" />
                  : <Mic    size={16} color="white" aria-hidden="true" />}
              </button>
            )}
          </div>
        </div>

        {/* ⑥ AI 미리보기 */}
        <div>
          <p className="section-label">AI 그림 미리보기</p>
          <div className="card overflow-hidden" style={{ minHeight: 180 }}>
            {hasImage && !imgError ? (
              <div className="relative">
                {/* fallback URL 로딩 중 스피너 */}
                {imgLoading && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3" aria-live="polite">
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{
                        border: '3px solid #F0E8D8',
                        borderTopColor: '#FFB800',
                        animation: 'overlay-spin 1s linear infinite',
                      }}
                      aria-hidden="true"
                    />
                    <p className="text-sm" style={{ color: '#aaa' }}>그림을 불러오는 중...</p>
                  </div>
                )}
                <img
                  src={imgDisplaySrc}
                  alt={`${styleObj?.label || 'AI'} 스타일로 생성된 그림일기 그림`}
                  className={`w-full max-w-[260px] mx-auto block rounded-xl my-4 animate-fade-in-up ${imgLoading ? 'hidden' : ''}`}
                  onLoad={() => setImgLoading(false)}
                  onError={() => { setImgLoading(false); setImgError(true); }}
                />
                {!imgLoading && (
                  <>
                    <div
                      className="absolute top-6 left-4 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: 'rgba(255,255,255,0.88)', color: '#FFB800' }}
                      aria-hidden="true"
                    >
                      {styleObj?.emoji} {styleObj?.label}
                    </div>
                    <button
                      onClick={doGenerate}
                      disabled={generating}
                      aria-label="다른 그림으로 다시 생성"
                      className="absolute top-6 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
                    >
                      <RefreshCw size={15} style={{ color: '#FFB800' }} />
                    </button>
                  </>
                )}
              </div>
            ) : imgError ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <span className="text-3xl" aria-hidden="true">😢</span>
                <p className="text-sm" style={{ color: '#888' }}>그림 생성에 실패했어요</p>
                <button
                  onClick={doGenerate}
                  className="mt-1 px-4 py-2 rounded-full text-xs font-semibold text-white"
                  style={{ background: '#FFB800' }}
                >
                  다시 시도
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-2" aria-live="polite">
                <span className="text-4xl opacity-40" aria-hidden="true">{styleObj?.emoji || '🎨'}</span>
                <p className="text-sm text-center" style={{ color: '#aaa' }}>
                  기록을 마치면<br />{styleObj?.label} 스타일로 그려드려요
                </p>
              </div>
            )}
          </div>
        </div>

        {hasText && !hasImage && !generating && (
          <p className="text-center text-xs" style={{ color: '#aaa' }}>
            💡 그림 없이도 저장할 수 있어요
          </p>
        )}

        {/* ⑦ 하단 고정 CTA */}
        <div
          className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3"
          style={{ background: 'linear-gradient(to top, #FFF8F0 70%, transparent)', zIndex: 40 }}
        >
          <div className="max-w-[430px] mx-auto space-y-2">
            {btnPhase === 'saved' ? (
              <button className="btn-primary success" disabled aria-live="polite">
                ✅ 저장 완료! 갤러리로 이동 중...
              </button>
            ) : btnPhase === 'save' ? (
              <>
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  <Save size={16} aria-hidden="true" />
                  {saving ? '저장 중...' : '그림일기 저장하기'}
                </button>
                <button
                  onClick={doGenerate}
                  disabled={generating}
                  className="w-full py-3 rounded-2xl text-sm font-semibold border-2 flex items-center justify-center gap-2 active:scale-98 transition-all"
                  style={{ borderColor: '#FFB800', color: '#FFB800', background: 'white' }}
                >
                  <RefreshCw size={14} aria-hidden="true" />
                  다른 그림으로 다시 생성
                </button>
              </>
            ) : (
              <button
                onClick={doGenerate}
                disabled={!hasText || generating}
                className="btn-primary"
                aria-label={`${styleObj?.label} 스타일로 AI 그림 만들기`}
              >
                <Sparkles size={16} aria-hidden="true" />
                {`✨ ${styleObj?.emoji} ${styleObj?.label} 스타일로 AI 그림 만들기`}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
