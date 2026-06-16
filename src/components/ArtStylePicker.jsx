import { ART_STYLES } from '../utils/pollinations';

export default function ArtStylePicker({ selected, onChange }) {
  return (
    <div>
      <p className="section-label" id="style-label">그림 스타일</p>
      {/* 4×2 그리드 */}
      <div className="grid grid-cols-4 gap-2" role="group" aria-labelledby="style-label">
        {ART_STYLES.map(style => {
          const isSelected = selected === style.key;
          return (
            <button
              key={style.key}
              onClick={() => onChange(style.key)}
              aria-label={style.label}
              aria-pressed={isSelected}
              className="select-card flex flex-col items-center gap-1 py-3 px-1 min-h-[68px]"
              style={isSelected ? { borderColor: '#FFB800', background: '#FFFBEF' } : {}}
            >
              <span className="text-2xl leading-none" aria-hidden="true">{style.emoji}</span>
              <span
                className="text-[10px] font-medium text-center leading-snug"
                style={{ color: isSelected ? '#FFB800' : '#888' }}
              >
                {style.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 선택된 스타일 설명 */}
      <p className="mt-2 text-[11px] text-center" style={{ color: '#aaa' }} aria-live="polite">
        {ART_STYLES.find(s => s.key === selected)?.emoji}{' '}
        <span style={{ color: '#FFB800', fontWeight: 600 }}>
          {ART_STYLES.find(s => s.key === selected)?.label}
        </span>{' '}
        스타일로 그림을 그려드려요
      </p>
    </div>
  );
}
