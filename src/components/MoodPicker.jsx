const moods = [
  { key: 'happy', emoji: '😊', label: '행복' },
  { key: 'excited', emoji: '🤩', label: '신남' },
  { key: 'calm', emoji: '😌', label: '평온' },
  { key: 'sad', emoji: '😢', label: '슬픔' },
  { key: 'angry', emoji: '😤', label: '화남' },
  { key: 'neutral', emoji: '😐', label: '보통' },
];

export default function MoodPicker({ selected, onChange }) {
  return (
    <div>
      <p className="text-xs font-medium text-amber-700 mb-2">오늘의 기분</p>
      <div className="flex gap-2 flex-wrap">
        {moods.map((mood) => (
          <button
            key={mood.key}
            onClick={() => onChange(mood.key)}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border-2 transition-all active:scale-95 ${
              selected === mood.key
                ? 'border-amber-400 bg-amber-50 shadow-sm scale-105'
                : 'border-amber-100 bg-white hover:border-amber-200'
            }`}
          >
            <span className="text-xl">{mood.emoji}</span>
            <span className="text-[10px] text-amber-700 font-medium">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
