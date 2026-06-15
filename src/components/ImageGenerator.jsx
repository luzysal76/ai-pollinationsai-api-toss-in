import { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, Download } from 'lucide-react';
import { generateDiaryImageUrl, loadImage } from '../utils/pollinations';

export default function ImageGenerator({ diaryText, mood, onImageReady }) {
  const [imageState, setImageState] = useState({
    url: null,
    loading: false,
    error: null,
    prompt: '',
    seed: null,
  });

  const generate = async (retryCount = 0) => {
    if (!diaryText.trim()) return;

    const { url, prompt, seed } = generateDiaryImageUrl(diaryText, mood);

    setImageState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      // Pollinations.ai 이미지 로드 대기 (최대 30초)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 30000)
      );
      await Promise.race([loadImage(url), timeoutPromise]);

      setImageState({
        url,
        loading: false,
        error: null,
        prompt,
        seed,
      });

      onImageReady?.({ url, prompt, seed });
    } catch (err) {
      if (retryCount < 2) {
        // 자동 재시도
        setTimeout(() => generate(retryCount + 1), 2000);
      } else {
        setImageState(prev => ({
          ...prev,
          loading: false,
          error: '그림을 불러오지 못했어요. 다시 시도해주세요.',
        }));
      }
    }
  };

  const handleDownload = async () => {
    if (!imageState.url) return;
    try {
      const response = await fetch(imageState.url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `그림일기_${new Date().toLocaleDateString('ko-KR').replace(/\./g, '').replace(/\s/g, '')}.jpg`;
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
        {imageState.loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="shimmer absolute inset-0" />
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Sparkles size={24} className="text-amber-400 spin-slow" />
              </div>
              <p className="text-sm text-amber-700 font-medium">그림 그리는 중...</p>
              <p className="text-xs text-amber-500">AI가 일기를 읽고 있어요 ✨</p>
            </div>
          </div>
        ) : imageState.error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <span className="text-4xl">😢</span>
            <p className="text-sm text-amber-700 text-center">{imageState.error}</p>
            <button
              onClick={() => generate()}
              className="mt-2 px-4 py-2 bg-amber-400 text-white rounded-xl text-sm font-medium active:scale-95 transition-transform"
            >
              다시 시도
            </button>
          </div>
        ) : imageState.url ? (
          <>
            <img
              src={imageState.url}
              alt="AI 생성 그림"
              className="w-full h-full object-cover animate-fade-in-up"
            />
            {/* 다운로드 버튼 */}
            <button
              onClick={handleDownload}
              className="absolute bottom-2 right-2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
            >
              <Download size={16} className="text-amber-700" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <span className="text-5xl">🎨</span>
            <p className="text-sm text-amber-600 text-center font-medium">
              일기를 쓰고<br />그림 생성 버튼을 눌러봐요
            </p>
          </div>
        )}
      </div>

      {/* 생성 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={() => generate()}
          disabled={!diaryText.trim() || imageState.loading}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl font-medium shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles size={16} />
          {imageState.loading ? '그림 그리는 중...' : '✨ AI 그림 생성'}
        </button>

        {imageState.url && !imageState.loading && (
          <button
            onClick={() => generate()}
            className="w-12 h-12 flex items-center justify-center bg-amber-100 text-amber-700 rounded-2xl active:scale-95 transition-transform border border-amber-200"
            title="다시 생성"
          >
            <RefreshCw size={16} />
          </button>
        )}
      </div>

      {/* 프롬프트 표시 (선택적) */}
      {imageState.prompt && !imageState.loading && (
        <details className="text-xs text-amber-500">
          <summary className="cursor-pointer select-none">AI 프롬프트 보기</summary>
          <p className="mt-1 p-2 bg-amber-50 rounded-lg leading-relaxed">{imageState.prompt}</p>
        </details>
      )}
    </div>
  );
}
