const MOODS = [
  { key: 'happy',   emoji: '😊', label: '행복해요' },
  { key: 'excited', emoji: '🎉', label: '신나요' },
  { key: 'calm',    emoji: '😌', label: '평온해요' },
  { key: 'sad',     emoji: '😢', label: '슬퍼요' },
  { key: 'angry',   emoji: '😠', label: '화나요' },
  { key: 'neutral', emoji: '😐', label: '보통이에요' },
];

export default function MoodPicker({ selected, onChange }) {
  return (
    <div>
      <p className="section-label" id="mood-label">지금 내 기분은?</p>
      {/* 3×2 그리드 */}
      <div className="grid grid-cols-3 gap-2" role="group" aria-labelledby="mood-label">
        {MOODS.map((m) => (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            aria-label={m.label}
            aria-pressed={selected === m.key}
            className={`select-card flex flex-col items-center gap-1 py-3 px-2 min-h-[72px] ${selected === m.key ? 'selected' : ''}`}
          >
            <span className="text-2xl" aria-hidden="true">{m.emoji}</span>
            <span className="text-[11px] font-medium" style={{ color: selected === m.key ? '#FFB800' : '#888' }}>
              {m.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export { MOODS };
