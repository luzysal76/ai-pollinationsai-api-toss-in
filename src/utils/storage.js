// localStorage 기반 일기 메타데이터 저장소
// 이미지 Blob은 src/utils/db.js (IndexedDB)에서 별도 관리
const KEY = 'ai_picture_diary_entries';

export function getDiaries() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveDiary(entry) {
  const list = getDiaries();
  const newEntry = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...entry,
  };
  list.unshift(newEntry);
  localStorage.setItem(KEY, JSON.stringify(list));
  return newEntry;
}

export function deleteDiary(id) {
  const list = getDiaries().filter(d => d.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function updateDiary(id, updates) {
  const list = getDiaries().map(d => d.id === id ? { ...d, ...updates } : d);
  localStorage.setItem(KEY, JSON.stringify(list));
}

/** 전체 일기 삭제 (설정 > 초기화용) */
export function clearAllDiaries() {
  localStorage.removeItem(KEY);
}

/** JSON 가져오기 (기존 데이터를 대체) */
export function importDiaries(diaries) {
  if (!Array.isArray(diaries)) throw new Error('배열 형식이 아닙니다');
  localStorage.setItem(KEY, JSON.stringify(diaries));
}
