import { STICKER_EMOJIS, createSticker } from '../../utils/decorations';

const MAX_STICKERS = 12;

export default function StickerPicker({ decoration, onChange }) {
  const stickers = decoration.stickers || [];
  const full = stickers.length >= MAX_STICKERS;

  const addSticker = (emoji) => {
    if (full) return;
    onChange({ ...decoration, stickers: [...stickers, createSticker(emoji)] });
  };

  const clearStickers = () => onChange({ ...decoration, stickers: [] });

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px]" style={{ color: '#aaa' }}>
          위 미리보기를 눌러서 붙인 스티커를 옮기거나 지울 수 있어요 ({stickers.length}/{MAX_STICKERS})
        </p>
        {stickers.length > 0 && (
          <button
            onClick={clearStickers}
            className="text-[11px] font-semibold flex-shrink-0"
            style={{ color: '#ef4444' }}
          >
            전체 삭제
          </button>
        )}
      </div>
      <div className="grid grid-cols-8 gap-1.5" role="group" aria-label="스티커 선택">
        {STICKER_EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => addSticker(emoji)}
            disabled={full}
            aria-label={`${emoji} 스티커 추가`}
            className="aspect-square rounded-xl flex items-center justify-center text-lg active:scale-90 transition-transform disabled:opacity-30"
            style={{ background: '#FFF8F0', border: '1px solid #F0E8D8' }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
