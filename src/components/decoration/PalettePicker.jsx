import { PALETTES } from '../../utils/decorations';

export default function PalettePicker({ selected, onChange }) {
  return (
    <div role="group" aria-labelledby="palette-label">
      <p className="sr-only" id="palette-label">배경 팔레트 선택</p>
      <div className="grid grid-cols-4 gap-2">
        {PALETTES.map(p => {
          const isSelected = selected === p.key;
          return (
            <button
              key={p.key}
              onClick={() => onChange(p.key)}
              aria-label={p.label}
              aria-pressed={isSelected}
              className="flex flex-col items-center gap-1 py-2.5 rounded-2xl border-2 min-h-[64px] transition-transform active:scale-95"
              style={{
                background: p.bg,
                borderColor: isSelected ? '#FFB800' : 'transparent',
                boxShadow: isSelected ? '0 0 0 2px #FFF3D0' : 'none',
              }}
            >
              <span className="text-lg" aria-hidden="true">{p.emoji}</span>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.75)', color: '#555' }}
              >
                {p.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
