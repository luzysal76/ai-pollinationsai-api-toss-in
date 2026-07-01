import { useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { getPaletteStyle, getFrameStyle, getFontFamily, isDarkPalette } from '../../utils/decorations';

/**
 * 팔레트/프레임/폰트/스티커를 실제 렌더링하는 공용 프리뷰.
 * editable=true 이면 스티커를 PointerEvent로 드래그 이동 + 탭하여 삭제(×) 가능.
 * editable=false(갤러리 상세 등)면 정적 렌더링만 수행.
 */
export default function DecorationPreview({
  decoration,
  onChange,        // (decoration) => void — editable일 때만 필요
  imgSrc,
  text,
  editable = false,
  emptyLabel = '그림이 없는 일기예요',
  imageAlt = '일기 그림',
  onImageError,
}) {
  const containerRef = useRef(null);
  const dragRef = useRef(null); // { id, pointerId }
  const [activeId, setActiveId] = useState(null);

  const stickers = decoration.stickers || [];
  const dark = isDarkPalette(decoration.paletteKey);
  const textColor = dark ? '#F5F0FF' : '#2D2D2D';

  const updateSticker = useCallback((id, patch) => {
    if (!onChange) return;
    onChange({
      ...decoration,
      stickers: (decoration.stickers || []).map(s => (s.id === id ? { ...s, ...patch } : s)),
    });
  }, [decoration, onChange]);

  const removeSticker = (id) => {
    if (!onChange) return;
    onChange({ ...decoration, stickers: stickers.filter(s => s.id !== id) });
  };

  const handlePointerDown = (e, sticker) => {
    if (!editable) return;
    e.stopPropagation();
    setActiveId(sticker.id);
    e.target.setPointerCapture?.(e.pointerId);
    dragRef.current = { id: sticker.id, pointerId: e.pointerId };
  };

  const handlePointerMove = (e) => {
    if (!editable || !dragRef.current || dragRef.current.pointerId !== e.pointerId) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    x = Math.min(96, Math.max(4, x));
    y = Math.min(96, Math.max(4, y));
    updateSticker(dragRef.current.id, { x, y });
  };

  const handlePointerUp = (e) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden select-none"
      style={{
        ...getPaletteStyle(decoration.paletteKey),
        ...getFrameStyle(decoration.frameKey),
        touchAction: editable ? 'none' : undefined,
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={() => editable && setActiveId(null)}
    >
      <div className="p-4">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={imageAlt}
            className="w-full max-w-[260px] mx-auto block rounded-xl"
            draggable={false}
            onError={onImageError}
          />
        ) : (
          <div className="flex items-center justify-center py-10">
            <span className="text-sm" style={{ color: dark ? '#C9C2E8' : '#aaa' }}>{emptyLabel}</span>
          </div>
        )}
        {text ? (
          <p
            className="mt-3 text-[14px] leading-8 whitespace-pre-wrap px-1"
            style={{ color: textColor, fontFamily: getFontFamily(decoration.fontKey) }}
          >
            {text}
          </p>
        ) : null}
      </div>

      {/* 스티커 레이어 */}
      {stickers.map(s => (
        <div
          key={s.id}
          onPointerDown={(e) => handlePointerDown(e, s)}
          onClick={(e) => { if (editable) { e.stopPropagation(); setActiveId(s.id); } }}
          className="absolute"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            transform: `translate(-50%, -50%) rotate(${s.rotation || 0}deg) scale(${s.scale || 1})`,
            fontSize: 32,
            lineHeight: 1,
            cursor: editable ? 'grab' : 'default',
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))',
          }}
          aria-hidden={!editable}
        >
          {s.emoji}
          {editable && activeId === s.id && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); removeSticker(s.id); }}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: '#ef4444' }}
              aria-label="스티커 삭제"
            >
              <X size={11} color="white" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
