// Pollinations.ai 이미지 생성 유틸리티
// 무료 API, API 키 불필요

const BASE_URL = 'https://image.pollinations.ai/prompt';

// 일기 내용에서 이미지 프롬프트 생성
export function createImagePrompt(diaryText, mood = '') {
  const moodMap = {
    happy: 'bright cheerful warm colors, sunny atmosphere',
    sad: 'soft blue gentle melancholic atmosphere',
    excited: 'vibrant energetic colorful atmosphere',
    calm: 'peaceful serene soft pastel colors',
    angry: 'dramatic strong intense atmosphere',
    neutral: 'soft warm natural colors',
  };

  const moodStyle = moodMap[mood] || moodMap.neutral;

  // 일기 내용을 짧게 요약해서 프롬프트로 변환
  const cleanText = diaryText.slice(0, 200).replace(/[^a-zA-Z0-9가-힣\s.,]/g, ' ');

  return `cute watercolor illustration, kawaii style, diary scene, ${cleanText}, ${moodStyle}, soft pastel colors, hand-drawn style, adorable characters, warm cozy feeling, no text, no words`;
}

// 프롬프트 한국어를 영어로 변환하는 키워드 매핑
const koreanToEnglish = {
  '오늘': 'today',
  '학교': 'school',
  '친구': 'friend',
  '밥': 'meal rice',
  '점심': 'lunch',
  '저녁': 'dinner',
  '아침': 'morning breakfast',
  '집': 'home house',
  '공원': 'park',
  '놀이': 'playing',
  '게임': 'game',
  '산책': 'walk',
  '운동': 'exercise',
  '독서': 'reading book',
  '영화': 'movie',
  '음악': 'music',
  '가족': 'family',
  '엄마': 'mom mother',
  '아빠': 'dad father',
  '날씨': 'weather',
  '비': 'rain',
  '눈': 'snow',
  '햇빛': 'sunshine',
  '행복': 'happy happiness',
  '슬픔': 'sad sadness',
  '피곤': 'tired',
  '기쁨': 'joy',
  '고양이': 'cat',
  '강아지': 'dog',
  '꽃': 'flower',
  '바다': 'ocean sea',
  '산': 'mountain',
  '여행': 'travel',
  '쇼핑': 'shopping',
  '카페': 'cafe coffee shop',
  '생일': 'birthday',
  '파티': 'party',
};

export function translateKorean(text) {
  let result = text;
  for (const [korean, english] of Object.entries(koreanToEnglish)) {
    result = result.replace(new RegExp(korean, 'g'), english);
  }
  return result;
}

// Pollinations.ai URL 생성
export function getImageUrl(prompt, options = {}) {
  const {
    width = 512,
    height = 512,
    seed = Math.floor(Math.random() * 999999),
    model = 'flux',
    nologo = true,
    enhance = false,
  } = options;

  const encodedPrompt = encodeURIComponent(prompt);
  const params = new URLSearchParams({
    width: width.toString(),
    height: height.toString(),
    seed: seed.toString(),
    model,
    nologo: nologo.toString(),
    enhance: enhance.toString(),
  });

  return `${BASE_URL}/${encodedPrompt}?${params.toString()}`;
}

// 일기 내용으로 이미지 URL 직접 생성
export function generateDiaryImageUrl(diaryText, mood = '', seed = null) {
  const translatedText = translateKorean(diaryText);
  const prompt = createImagePrompt(translatedText, mood);
  const finalSeed = seed || Math.floor(Math.random() * 999999);

  return {
    url: getImageUrl(prompt, { width: 512, height: 512, seed: finalSeed }),
    prompt,
    seed: finalSeed,
  };
}

// 이미지 로드 확인 (Promise)
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = url;
  });
}
