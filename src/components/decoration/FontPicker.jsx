import { FONTS } from '../../utils/decorations';

export default function FontPicker({ selected, onChange }) {
  return (
    <div role="group" aria-labelledby="font-label" className="space-y-2">
      <p className="sr-only" id="font-label">손글씨 폰트 선택</p>
      {FONTS.map(f => {
        const isSelected = selected === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            aria-label={f.label}
            aria-pressed={isSelected}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border-2 min-h-[48px] transition-all active:scale-[0.98]"
            style={{
              borderColor: isSelected ? '#FFB800' : '#F0E8D8',
              background: isSelected ? '#FFFBEF' : 'white',
            }}
          >
            <span
              className="text-[15px]"
              style={{ fontFamily: f.fontFamily, color: '#2D2D2D' }}
            >
              오늘의 소중한 하루
            </span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                color: isSelected ? '#FFB800' : '#aaa',
                background: isSelected ? '#FFF3D0' : '#F5EDD8',
              }}
            >
              {f.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
