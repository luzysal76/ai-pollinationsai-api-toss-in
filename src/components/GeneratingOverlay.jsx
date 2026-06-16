import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const STEPS = [
  { icon: '✏️', text: '일기 내용을 분석하고 있어요...' },
  { icon: '🎨', text: '그림 스타일을 준비하고 있어요...' },
  { icon: '🖌️', text: 'AI가 그림을 그리고 있어요...' },
  { icon: '✨', text: '마무리 중이에요...' },
];

export default function GeneratingOverlay({ styleLabel = '', onCancel }) {
  const [stepIdx,  setStepIdx]  = useState(0);
  const [elapsed,  setElapsed]  = useState(0);

  /* 2초마다 단계 전환 */
  useEffect(() => {
    const t = setInterval(() => setStepIdx(i => (i + 1) % STEPS.length), 2000);
    return () => clearInterval(t);
  }, []);

  /* 1초마다 경과 시간 */
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const step = STEPS[stepIdx];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.6)' }}
    >
      <div className="card w-full max-w-[300px] p-7 text-center space-y-5 animate-fade-in-up">

        {/* 스피너 + 이모지 */}
        <div className="relative w-16 h-16 mx-auto">
          <div
            className="w-16 h-16 rounded-full absolute inset-0"
            style={{
              border: '4px solid #F0E8D8',
              borderTopColor: '#FFB800',
              animation: 'overlay-spin 1s linear infinite',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            {step.icon}
          </div>
        </div>

        {/* 단계 메시지 */}
        <div className="space-y-1">
          <p className="text-sm font-semibold" style={{ color: '#2D2D2D' }}>
            {step.text}
          </p>
          {styleLabel && (
            <p className="text-xs font-medium" style={{ color: '#FFB800' }}>
              {styleLabel} 스타일로 그리는 중
            </p>
          )}
        </div>

        {/* 경과 시간 */}
        <p className="text-xs" style={{ color: '#bbb' }}>{elapsed}초 경과</p>

        {/* 진행 도트 */}
        <div className="flex justify-center gap-2" role="progressbar" aria-label="생성 단계">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{ background: i === stepIdx ? '#FFB800' : '#E8D8B8' }}
            />
          ))}
        </div>

        {/* 취소 */}
        <button
          onClick={onCancel}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          style={{ background: '#F5EDD8', color: '#888' }}
          aria-label="AI 그림 생성 취소"
        >
          <X size={14} />
          생성 취소
        </button>
      </div>
    </div>
  );
}
