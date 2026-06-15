// localStorage 기반 일기 저장소
const STORAGE_KEY = 'ai_picture_diary_entries';

export function getDiaries() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveDiary(entry) {
  const diaries = getDiaries();
  const newEntry = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...entry,
  };
  diaries.unshift(newEntry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries));
  return newEntry;
}

export function deleteDiary(id) {
  const diaries = getDiaries().filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries));
}

export function getDiary(id) {
  return getDiaries().find(d => d.id === id) || null;
}

export function updateDiary(id, updates) {
  const diaries = getDiaries().map(d =>
    d.id === id ? { ...d, ...updates } : d
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries));
}
