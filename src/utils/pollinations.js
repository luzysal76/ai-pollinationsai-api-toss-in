// Pollinations.ai 이미지 생성 유틸리티
// 무료 API, API 키 불필요 — https://image.pollinations.ai

const BASE_URL = 'https://image.pollinations.ai/prompt';

/* ── 그림 스타일 정의 ── */
export const ART_STYLES = [
  {
    key:     'watercolor',
    label:   '수채화',
    emoji:   '🎨',
    prompt:  'watercolor painting, soft watercolor illustration, delicate watercolor style',
  },
  {
    key:     'crayon',
    label:   '크레파스',
    emoji:   '🖍️',
    prompt:  'crayon drawing, childlike crayon art style, colorful crayon illustration',
  },
  {
    key:     'oilpaint',
    label:   '유화',
    emoji:   '🖼️',
    prompt:  'oil painting, thick brushstrokes oil painting, impressionist oil art',
  },
  {
    key:     'pencil',
    label:   '연필 스케치',
    emoji:   '✏️',
    prompt:  'pencil sketch, hand-drawn pencil illustration, detailed pencil art',
  },
  {
    key:     'inkwash',
    label:   '수묵화',
    emoji:   '🖌️',
    prompt:  'ink wash painting, Korean traditional ink art, sumi-e style',
  },
  {
    key:     'storybook',
    label:   '동화책',
    emoji:   '📚',
    prompt:  "children's book illustration, cute storybook art, fairy tale illustration style",
  },
  {
    key:     'pixel',
    label:   '픽셀아트',
    emoji:   '🕹️',
    prompt:  'pixel art, 16-bit pixel illustration, retro pixel game style',
  },
  {
    key:     'anime',
    label:   '애니메이션',
    emoji:   '✨',
    prompt:  'anime style illustration, Japanese anime art, cute anime character',
  },
];

/* 기본 스타일 키 */
export const DEFAULT_STYLE = 'watercolor';

/* 스타일 키 → 객체 빠른 조회 */
export const ART_STYLE_MAP = Object.fromEntries(
  ART_STYLES.map(s => [s.key, s])
);

/* ── 한국어 → 영어 키워드 매핑 ── */
const KO_TO_EN = {
  '오늘': 'today', '학교': 'school', '친구': 'friend',
  '밥': 'meal', '점심': 'lunch', '저녁': 'dinner', '아침': 'breakfast',
  '집': 'home', '공원': 'park', '놀이': 'playing', '게임': 'game',
  '산책': 'walk', '운동': 'exercise', '독서': 'reading', '영화': 'movie',
  '음악': 'music', '가족': 'family', '엄마': 'mom', '아빠': 'dad',
  '날씨': 'weather', '비': 'rain', '눈': 'snow', '햇빛': 'sunshine',
  '행복': 'happiness', '슬픔': 'sadness', '피곤': 'tired', '기쁨': 'joy',
  '고양이': 'cat', '강아지': 'dog', '꽃': 'flower', '바다': 'sea',
  '산': 'mountain', '여행': 'travel', '쇼핑': 'shopping',
  '카페': 'cafe', '생일': 'birthday', '파티': 'party',
};

function translateKorean(text) {
  let result = text;
  for (const [ko, en] of Object.entries(KO_TO_EN)) {
    result = result.replace(new RegExp(ko, 'g'), en);
  }
  return result;
}

/* ── 기분 → 분위기 키워드 ── */
const MOOD_KEYWORDS = {
  happy:   'bright cheerful warm atmosphere',
  excited: 'vibrant energetic colorful atmosphere',
  calm:    'peaceful serene soft pastel atmosphere',
  sad:     'gentle soft melancholic atmosphere',
  angry:   'dramatic intense atmosphere',
  neutral: 'soft warm natural atmosphere',
};

/* ── 날씨 → 배경 키워드 ── */
const WEATHER_KEYWORDS = {
  sunny:  'sunny bright day',
  cloudy: 'cloudy overcast day',
  rainy:  'rainy day with rain drops',
  snowy:  'snowy winter day',
  windy:  'windy breezy day',
};

/* ── 프롬프트 빌더 ── */
export function buildPrompt(diaryText, { mood = 'neutral', weather = 'sunny', artStyle = DEFAULT_STYLE } = {}) {
  const styleObj  = ART_STYLE_MAP[artStyle] || ART_STYLE_MAP[DEFAULT_STYLE];
  const moodKw    = MOOD_KEYWORDS[mood]    || MOOD_KEYWORDS.neutral;
  const weatherKw = WEATHER_KEYWORDS[weather] || WEATHER_KEYWORDS.sunny;

  // 일기 내용 전처리 (한→영, 100자 제한, 특수문자 제거)
  // URL이 너무 길면 서버 차단 가능 → 100자로 제한 (~1,200자 이내 유지)
  const cleanText = translateKorean(diaryText)
    .slice(0, 100)
    .replace(/[^a-zA-Z0-9가-힣\s.,]/g, ' ')
    .trim();

  return [
    cleanText,
    weatherKw,
    moodKw,
    styleObj.prompt,
    'cute illustration, bright colors, high quality, no text, no words',
  ].join(', ');
}

/* ── URL 빌더 ── */
export function getImageUrl(prompt, seed) {
  const params = new URLSearchParams({ width: '512', height: '512', model: 'flux' });
  if (seed != null) params.set('seed', String(seed));
  return `${BASE_URL}/${encodeURIComponent(prompt)}?${params}`;
}

/* ── 메인 진입점 ── */
export function generateDiaryImageUrl(diaryText, mood = 'neutral', weather = 'sunny', artStyle = DEFAULT_STYLE, seed = null) {
  const prompt    = buildPrompt(diaryText, { mood, weather, artStyle });
  const finalSeed = seed ?? Math.floor(Math.random() * 999999);
  return {
    url:      getImageUrl(prompt, finalSeed),
    prompt,
    seed:     finalSeed,
    artStyle,
  };
}
