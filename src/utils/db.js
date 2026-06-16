// IndexedDB — AI 그림일기 이미지 Blob 저장소
// 일기 ID를 키로 사용, 값은 Blob

const DB_NAME  = 'ai_diary_db';
const DB_VER   = 1;
const IMG_STORE = 'images';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(IMG_STORE);
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const store = db.transaction(IMG_STORE, mode).objectStore(IMG_STORE);
    const req   = fn(store);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

/** 이미지 Blob 저장 */
export async function saveImageBlob(diaryId, blob) {
  const db = await openDB();
  await tx(db, 'readwrite', s => s.put(blob, diaryId));
}

/** 이미지 Blob 조회 (없으면 null) */
export async function getImageBlob(diaryId) {
  try {
    const db   = await openDB();
    const blob = await tx(db, 'readonly', s => s.get(diaryId));
    return blob ?? null;
  } catch {
    return null;
  }
}

/** 이미지 Blob 삭제 */
export async function deleteImageBlob(diaryId) {
  try {
    const db = await openDB();
    await tx(db, 'readwrite', s => s.delete(diaryId));
  } catch { /* 무시 */ }
}

/** 전체 이미지 삭제 */
export async function clearAllImages() {
  try {
    const db = await openDB();
    await tx(db, 'readwrite', s => s.clear());
  } catch { /* 무시 */ }
}

/**
 * Object URL 생성 헬퍼
 * IndexedDB에 없으면 fallbackUrl(Pollinations 원본) 반환
 */
export async function resolveImageUrl(diaryId, fallbackUrl) {
  const blob = await getImageBlob(diaryId);
  if (blob) return { url: URL.createObjectURL(blob), isBlob: true };
  if (fallbackUrl) return { url: fallbackUrl, isBlob: false };
  return null;
}
