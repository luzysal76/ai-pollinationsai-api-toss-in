import { useState } from 'react';
import { RefreshCw, Sparkles, Download } from 'lucide-react';
import { generateDiaryImageUrl } from '../utils/pollinations';

export default function ImageGenerator({ diaryText, mood, onImageReady }) {
  const [imageState, setImageState] = useState({
    url: null,
    loading: false,
    error: null,
    prompt: '',
    seed: null,
    loaded: false,
  });

  const generate = async () => {
    if (!diaryText.trim()) return;

    const { url, prompt, seed } = generateDiaryImageUrl(diaryText, mood);

    setImageState({
      url,
      loading: true,
      error: null,
      prompt,
      seed,
      loaded: false,
    });

    // 이미지 준비 상태 알림 (URL을 먼저 전달해 저장 가능)
    onImageReady?.({ url, prompt, seed });
  };

  const handleImgLoad = () => {
    setImageState(prev => ({ ...prev, loading: false, loaded: true }));
  };

  const handleImgError = () => {
    setImageState(prev => ({
      ...prev,
      loading: false,
      error: '그림 생성에 실패했어요. 잠시 후 다시 시도해주세요.',
    }));
  };

  const handleDownload = async () => {
    if (!imageState.url) return;
    try {
      const response = await fetch(imageState.url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `그림일기_${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(imageState.url, '_blank');
    }
  };

  return (
    <div className="space-y-3">
      {/* 이미지 영역 */}
      <div className="relative w-full aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden bg-amber-50 border-2 border-amber-200 shadow-inner">
        {/* 로딩 오버레이 */}
        {imageState.loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-amber-50/90">
            <div className="shimmer absolute inset-0" />
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md">
                <Sparkles size={28} className="text-amber-400 spin-slow" />
              </div>
              <p className="text-sm text-amber-700 font-semibold">AI가 그림 그리는 중...</p>
              <p className="text-xs text-amber-500">잠시만 기다려 주세요 ✨</p>
              <div className="flex gap-1 mt-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-amber-300"
                    style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 에러 상태 */}
        {imageState.error && !imageState.url && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <span className="text-4xl">😢</span>
            <p className="text-sm text-amber-700 text-center">{imageState.error}</p>
          </div>
        )}

        {/* 이미지 */}
        {imageState.url ? (
          <>
            <img
              src={imageState.url}
              alt="AI 생성 그림"
              className={`w-full h-full object-cover transition-opacity duration-500 ${imageState.loaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={handleImgLoad}
              onError={handleImgError}
            />
            {imageState.loaded && (
              <button
                onClick={handleDownload}
                className="absolute bottom-2 right-2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
              >
                <Download size={16} className="text-amber-700" />
              </button>
            )}
          </>
        ) : !imageState.loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <span className="text-5xl">🎨</span>
            <p className="text-sm text-amber-600 text-center font-medium">
              일기를 쓰고<br />AI 그림 생성 버튼을 눌러봐요
            </p>
          </div>
        )}
      </div>

      {/* 생성/다시생성 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={generate}
          disabled={!diaryText.trim() || imageState.loading}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl font-semibold text-sm shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles size={16} />
          {imageState.loading ? 'AI 그림 그리는 중...' : '✨ AI 그림 생성'}
        </button>

        {imageState.url && !imageState.loading && (
          <button
            onClick={generate}
            className="w-12 h-12 flex items-center justify-center bg-amber-100 text-amber-700 rounded-2xl active:scale-95 transition-transform border-2 border-amber-200 flex-shrink-0"
            title="다른 그림으로 다시 생성"
          >
            <RefreshCw size={16} />
          </button>
        )}
      </div>

      {/* 프롬프트 (선택적 표시) */}
      {imageState.prompt && (
        <details className="text-xs text-amber-400">
          <summary className="cursor-pointer select-none hover:text-amber-500 transition-colors">
            AI 프롬프트 보기
          </summary>
          <p className="mt-1.5 p-2.5 bg-amber-50 rounded-xl leading-relaxed border border-amber-100">
            {imageState.prompt}
          </p>
        </details>
      )}
    </div>
  );
}
