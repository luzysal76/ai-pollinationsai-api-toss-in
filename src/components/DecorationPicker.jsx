import { useState } from 'react';
import DecorationPreview from './decoration/DecorationPreview';
import PalettePicker from './decoration/PalettePicker';
import FramePicker from './decoration/FramePicker';
import FontPicker from './decoration/FontPicker';
import StickerPicker from './decoration/StickerPicker';

const TABS = [
  { key: 'palette', label: '배경', emoji: '🎨' },
  { key: 'frame',   label: '프레임', emoji: '🖼️' },
  { key: 'font',    label: '폰트', emoji: '✏️' },
  { key: 'sticker', label: '스티커', emoji: '⭐' },
];

/**
 * 일기 꾸미기 오케스트레이터.
 * value(decoration)/onChange props로 WritePage와 연결.
 */
export default function DecorationPicker({ value, onChange, text, imgSrc }) {
  const [tab, setTab] = useState('palette');

  return (
    <div>
      <p className="section-label" id="decoration-label">일기 꾸미기</p>

      {/* 실시간 미리보기 (스티커 드래그/삭제 가능) */}
      <div className="card overflow-hidden mb-3">
        <DecorationPreview
          decoration={value}
          onChange={onChange}
          imgSrc={imgSrc}
          text={text}
          editable
        />
      </div>

      {/* 탭 */}
      <div className="flex gap-1.5 mb-3" role="tablist" aria-labelledby="decoration-label">
        {TABS.map(t => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(t.key)}
              className="flex-1 flex items-center justify-center gap-1 py-2 min-h-[40px] rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{
                background: isActive ? '#FFB800' : '#F5EDD8',
                color: isActive ? 'white' : '#888',
              }}
            >
              <span aria-hidden="true">{t.emoji}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 서브 피커 */}
      {tab === 'palette' && (
        <PalettePicker
          selected={value.paletteKey}
          onChange={key => onChange({ ...value, paletteKey: key })}
        />
      )}
      {tab === 'frame' && (
        <FramePicker
          selected={value.frameKey}
          onChange={key => onChange({ ...value, frameKey: key })}
        />
      )}
      {tab === 'font' && (
        <FontPicker
          selected={value.fontKey}
          onChange={key => onChange({ ...value, fontKey: key })}
        />
      )}
      {tab === 'sticker' && (
        <StickerPicker decoration={value} onChange={onChange} />
      )}
    </div>
  );
}
