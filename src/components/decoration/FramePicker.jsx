import { FRAMES, getFrameStyle } from '../../utils/decorations';

export default function FramePicker({ selected, onChange }) {
  return (
    <div role="group" aria-labelledby="frame-label">
      <p className="sr-only" id="frame-label">프레임 스타일 선택</p>
      <div className="grid grid-cols-3 gap-2">
        {FRAMES.map(f => {
          const isSelected = selected === f.key;
          return (
            <button
              key={f.key}
              onClick={() => onChange(f.key)}
              aria-label={f.label}
              aria-pressed={isSelected}
              className="select-card flex flex-col items-center gap-1.5 py-3 min-h-[68px]"
              style={isSelected ? { borderColor: '#FFB800', background: '#FFFBEF' } : {}}
            >
              <div
                className="w-8 h-8 rounded-lg bg-white"
                style={getFrameStyle(f.key)}
                aria-hidden="true"
              />
              <span
                className="text-[10px] font-medium"
                style={{ color: isSelected ? '#FFB800' : '#888' }}
              >
                {f.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
