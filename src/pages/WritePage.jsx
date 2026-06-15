import { useState } from 'react';
import { Save, ChevronRight } from 'lucide-react';
import MoodPicker from '../components/MoodPicker';
import ImageGenerator from '../components/ImageGenerator';
import { saveDiary } from '../utils/storage';

const WEATHER = [
  { key: 'sunny', emoji: '☀️', label: '맑음' },
  { key: 'cloudy', emoji: '☁️', label: '흐림' },
  { key: 'rainy', emoji: '🌧️', label: '비' },
  { key: 'snowy', emoji: '❄️', label: '눈' },
  { key: 'windy', emoji: '💨', label: '바람' },
];

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${['일', '월', '화', '수', '목', '금', '토'][d.getDay()]}요일`;
}

export default function WritePage({ onNavigate, onSaved }) {
  const [text, setText] = useState('');
  const [mood, setMood] = useState('happy');
  const [weather, setWeather] = useState('sunny');
  const [title, setTitle] = useState('');
  const [imageData, setImageData] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1); // 1: 글쓰기, 2: 그림

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);

    const entry = {
      title: title.trim() || getTodayStr(),
      text: text.trim(),
      mood,
      weather,
      imageUrl: imageData?.url || null,
      imagePrompt: imageData?.prompt || null,
      imageSeed: imageData?.seed || null,
      date: new Date().toISOString().split('T')[0],
    };

    saveDiary(entry);
    setSaved(true);
    setSaving(false);

    setTimeout(() => {
      onSaved?.();
      onNavigate('gallery');
    }, 1000);
  };

  return (
    <div className="max-w-lg mx-auto px-4 pb-8">
      {/* 날짜 헤더 */}
      <div className="py-4 text-center">
        <p className="text-xs text-amber-500 font-medium">{getTodayStr()}</p>
        <h1 className="text-lg font-bold text-amber-900 mt-1">오늘의 그림일기</h1>
      </div>

      {/* 스텝 탭 */}
      <div className="flex bg-amber-100 rounded-2xl p-1 mb-5">
        <button
          onClick={() => setStep(1)}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
            step === 1 ? 'bg-white text-amber-800 shadow-sm' : 'text-amber-600'
          }`}
        >
          ✏️ 일기 쓰기
        </button>
        <button
          onClick={() => setStep(2)}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
            step === 2 ? 'bg-white text-amber-800 shadow-sm' : 'text-amber-600'
          }`}
        >
          🎨 AI 그림
        </button>
      </div>

      {step === 1 ? (
        <div className="space-y-4 animate-fade-in-up">
          {/* 제목 */}
          <div>
            <label className="text-xs font-medium text-amber-700 block mb-1.5">
              제목 <span className="text-amber-400">(선택)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={getTodayStr()}
              maxLength={50}
              className="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-xl text-amber-900 placeholder-amber-300 text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* 날씨 */}
          <div>
            <p className="text-xs font-medium text-amber-700 mb-2">오늘의 날씨</p>
            <div className="flex gap-2">
              {WEATHER.map((w) => (
                <button
                  key={w.key}
                  onClick={() => setWeather(w.key)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border-2 transition-all active:scale-95 ${
                    weather === w.key
                      ? 'border-amber-400 bg-amber-50 shadow-sm scale-105'
                      : 'border-amber-100 bg-white'
                  }`}
                >
                  <span className="text-lg">{w.emoji}</span>
                  <span className="text-[10px] text-amber-700">{w.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 기분 */}
          <MoodPicker selected={mood} onChange={setMood} />

          {/* 일기 텍스트 */}
          <div>
            <label className="text-xs font-medium text-amber-700 block mb-1.5">
              오늘 있었던 일 <span className="text-red-400">*</span>
            </label>
            <div className="diary-paper rounded-2xl border-2 border-amber-200 overflow-hidden">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="오늘 하루는 어땠나요? 무슨 일이 있었는지 자유롭게 써봐요. ✍️&#10;&#10;AI가 여러분의 이야기를 읽고 귀여운 그림을 그려드려요!"
                className="w-full min-h-[200px] px-4 pt-4 pb-4 bg-transparent text-amber-900 text-sm leading-8 focus:outline-none resize-none placeholder-amber-300"
                style={{ lineHeight: '32px' }}
              />
            </div>
            <p className="text-right text-xs text-amber-400 mt-1">{text.length}자</p>
          </div>

          {/* 다음 버튼 */}
          <button
            onClick={() => setStep(2)}
            disabled={!text.trim()}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl font-medium text-sm shadow-md active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            AI 그림 만들기
            <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in-up">
          {/* 일기 미리보기 */}
          {text.trim() && (
            <div className="diary-paper rounded-2xl border-2 border-amber-200 p-4">
              <p className="text-xs font-bold text-amber-700 mb-2">
                {title || getTodayStr()}
                <span className="ml-2">
                  {WEATHER.find(w => w.key === weather)?.emoji}
                </span>
              </p>
              <p className="text-sm text-amber-900 leading-relaxed line-clamp-3">{text}</p>
            </div>
          )}

          {/* AI 이미지 생성기 */}
          <ImageGenerator
            diaryText={text}
            mood={mood}
            onImageReady={setImageData}
          />

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            disabled={!text.trim() || saving || saved}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-medium text-sm shadow-md active:scale-95 transition-all ${
              saved
                ? 'bg-green-400 text-white'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {saved ? (
              <>✅ 저장 완료! 갤러리로 이동 중...</>
            ) : saving ? (
              <>저장 중...</>
            ) : (
              <>
                <Save size={16} />
                그림일기 저장하기
              </>
            )}
          </button>

          {!imageData && text.trim() && (
            <p className="text-center text-xs text-amber-500">
              💡 그림 없이도 저장할 수 있어요
            </p>
          )}
        </div>
      )}
    </div>
  );
}
