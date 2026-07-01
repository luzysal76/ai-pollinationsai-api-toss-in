// 일기 꾸미기(커스터마이징) 데이터/헬퍼
// diary.decoration (optional) 필드를 다룸. 필드가 없는 기존 일기는 DEFAULT_DECORATION으로 폴백.
//
// decoration shape:
// {
//   paletteKey: 'default',
//   frameKey:   'none',
//   fontKey:    'default',
//   stickers: [{ id, emoji, x, y, rotation, scale }]  // x/y: 0~100 (%)
// }

export const DEFAULT_DECORATION = {
  paletteKey: 'default',
  frameKey: 'none',
  fontKey: 'default',
  stickers: [],
};

/** 기존 일기(필드 없음) 안전 폴백 */
export function getDecoration(diary) {
  const d = diary?.decoration;
  if (!d) return DEFAULT_DECORATION;
  return {
    paletteKey: d.paletteKey || DEFAULT_DECORATION.paletteKey,
    frameKey: d.frameKey || DEFAULT_DECORATION.frameKey,
    fontKey: d.fontKey || DEFAULT_DECORATION.fontKey,
    stickers: Array.isArray(d.stickers) ? d.stickers : [],
  };
}

/* ── 배경 팔레트 ── */
export const PALETTES = [
  { key: 'default', label: '기본',   emoji: '🤍', bg: '#FFF8F0' },
  { key: 'pink',    label: '핑크',   emoji: '💗', bg: 'linear-gradient(160deg,#FFF0F5,#FFE4EC)' },
  { key: 'mint',    label: '민트',   emoji: '🌿', bg: 'linear-gradient(160deg,#F0FBF6,#DFF5EA)' },
  { key: 'sky',     label: '하늘',   emoji: '💙', bg: 'linear-gradient(160deg,#F0F7FF,#E0EFFF)' },
  { key: 'lavender',label: '라벤더', emoji: '💜', bg: 'linear-gradient(160deg,#F6F0FF,#EBE0FF)' },
  { key: 'peach',   label: '피치',   emoji: '🍑', bg: 'linear-gradient(160deg,#FFF3E8,#FFE7D0)' },
  { key: 'lemon',   label: '레몬',   emoji: '🍋', bg: 'linear-gradient(160deg,#FEFBE8,#FDF6C8)' },
  { key: 'night',   label: '밤하늘', emoji: '🌙', bg: 'linear-gradient(160deg,#2B2A4A,#3E3B6B)' },
];
const PALETTE_MAP = Object.fromEntries(PALETTES.map(p => [p.key, p]));

export function getPaletteStyle(key) {
  const p = PALETTE_MAP[key] || PALETTE_MAP.default;
  return { background: p.bg };
}
export function isDarkPalette(key) {
  return key === 'night';
}

/* ── 프레임/보더 스타일 ── */
export const FRAMES = [
  { key: 'none',     label: '없음' },
  { key: 'dashed',   label: '점선' },
  { key: 'dotted',   label: '도트' },
  { key: 'polaroid', label: '폴라로이드' },
  { key: 'ribbon',   label: '리본' },
  { key: 'double',   label: '이중선' },
];

export function getFrameStyle(key) {
  switch (key) {
    case 'dashed':
      return { border: '3px dashed #FFB800', borderRadius: 20 };
    case 'dotted':
      return { border: '3px dotted #FF8FA3', borderRadius: 20 };
    case 'polaroid':
      return {
        border: '10px solid #FFFFFF',
        borderBottom: '28px solid #FFFFFF',
        borderRadius: 4,
        boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
      };
    case 'ribbon':
      return { border: '3px solid #FF8FA3', borderRadius: 24, boxShadow: '0 0 0 3px #FFF0F5' };
    case 'double':
      return { border: '3px double #A78BFA', borderRadius: 18 };
    default:
      return { border: '2px solid #F0E8D8', borderRadius: 20 };
  }
}

/* ── 손글씨 폰트 ── */
export const FONTS = [
  { key: 'default', label: '기본체',   fontFamily: "'Noto Sans KR', sans-serif" },
  { key: 'pen',     label: '나눔손글씨', fontFamily: "'Nanum Pen Script', cursive" },
  { key: 'gaegu',   label: '개구체',   fontFamily: "'Gaegu', cursive" },
  { key: 'gamja',   label: '감자꽃체', fontFamily: "'Gamja Flower', cursive" },
  { key: 'story',   label: '이야기체', fontFamily: "'Poor Story', cursive" },
];
const FONT_MAP = Object.fromEntries(FONTS.map(f => [f.key, f]));

export function getFontFamily(key) {
  return (FONT_MAP[key] || FONT_MAP.default).fontFamily;
}

/* ── 스티커 이모지 팔레트 ── */
export const STICKER_EMOJIS = [
  '⭐', '✨', '💖', '💗', '🎀', '🌸', '🌈', '☁️',
  '🍀', '🌻', '🎈', '🎉', '💫', '🧸', '🍰', '☕',
  '📌', '💌', '🔥', '👍', '🐣', '🦋', '🌙', '☀️',
];

/** 새 스티커 객체 생성 (캔버스 중앙 근처에 랜덤 오프셋 배치) */
export function createSticker(emoji) {
  const jitter = () => Math.round((Math.random() - 0.5) * 20); // -10 ~ 10
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    emoji,
    x: 50 + jitter(),
    y: 45 + jitter(),
    rotation: 0,
    scale: 1,
  };
}
