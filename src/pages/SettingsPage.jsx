import { useState, useRef } from 'react';
import { Download, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { getDiaries, clearAllDiaries, importDiaries } from '../utils/storage';
import { clearAllImages } from '../utils/db';

export default function SettingsPage() {
  const [importMsg,    setImportMsg]    = useState('');
  const [importErr,    setImportErr]    = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetMsg,     setResetMsg]     = useState('');
  const fileRef = useRef(null);

  /* ── JSON 내보내기 ── */
  const handleExport = () => {
    const diaries = getDiaries();
    if (diaries.length === 0) {
      setImportMsg('내보낼 일기가 없어요.');
      setImportErr(false);
      setTimeout(() => setImportMsg(''), 2500);
      return;
    }
    const json = JSON.stringify(diaries, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ai_diary_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── JSON 가져오기 ── */
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';   // 같은 파일 재선택 허용

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        importDiaries(data);
        setImportErr(false);
        setImportMsg(`✅ ${data.length}개의 일기를 가져왔어요!`);
      } catch (err) {
        setImportErr(true);
        setImportMsg('❌ 파일 형식이 올바르지 않아요.');
      }
      setTimeout(() => setImportMsg(''), 3500);
    };
    reader.readAsText(file);
  };

  /* ── 전체 초기화 ── */
  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    clearAllDiaries();
    await clearAllImages().catch(() => {});
    setConfirmReset(false);
    setResetMsg('초기화 완료! 모든 일기가 삭제되었어요.');
    setTimeout(() => setResetMsg(''), 3000);
  };

  return (
    <div className="max-w-[430px] mx-auto px-4 pt-5 pb-16 space-y-5 animate-fade-in-up">
      <h2 className="text-lg font-bold" style={{ color: '#2D2D2D' }}>설정</h2>

      {/* ── 데이터 관리 ── */}
      <section className="card p-5 space-y-4" aria-labelledby="data-section-title">
        <h3 id="data-section-title" className="text-sm font-bold flex items-center gap-2" style={{ color: '#2D2D2D' }}>
          💾 데이터 관리
        </h3>

        {/* 내보내기 */}
        <div>
          <p className="text-xs mb-2" style={{ color: '#888' }}>
            일기 데이터를 JSON 파일로 백업할 수 있어요.
            <br /><span className="text-[11px]">* 이미지는 포함되지 않아요 (텍스트 및 메타데이터만)</span>
          </p>
          <button
            onClick={handleExport}
            className="w-full py-3 min-h-[48px] rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            style={{ background: '#FFF3D0', color: '#FFB800', border: '2px solid #FFE999' }}
            aria-label="일기 데이터 JSON으로 내보내기"
          >
            <Download size={15} aria-hidden="true" />
            JSON으로 내보내기
          </button>
        </div>

        {/* 구분선 */}
        <div style={{ height: 1, background: '#F0E8D8' }} role="separator" />

        {/* 가져오기 */}
        <div>
          <p className="text-xs mb-2" style={{ color: '#888' }}>
            이전에 백업한 JSON 파일로 복원해요.
            <br /><span className="text-[11px] text-amber-500">⚠️ 기존 데이터를 덮어씁니다.</span>
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
            aria-label="JSON 파일 선택"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 min-h-[48px] rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            style={{ background: '#F5F5F5', color: '#555', border: '2px solid #E8E8E8' }}
            aria-label="JSON 파일에서 일기 가져오기"
          >
            <Upload size={15} aria-hidden="true" />
            JSON에서 가져오기
          </button>
          {importMsg && (
            <p
              className="mt-2 text-xs text-center font-medium"
              style={{ color: importErr ? '#ef4444' : '#22c55e' }}
              role="status"
              aria-live="polite"
            >
              {importMsg}
            </p>
          )}
        </div>
      </section>

      {/* ── 전체 초기화 ── */}
      <section className="card p-5 space-y-3" aria-labelledby="reset-section-title">
        <h3 id="reset-section-title" className="text-sm font-bold flex items-center gap-2" style={{ color: '#ef4444' }}>
          <AlertTriangle size={15} aria-hidden="true" />
          위험 구역
        </h3>
        <p className="text-xs" style={{ color: '#888' }}>
          모든 일기와 AI 그림을 영구 삭제해요. 복구가 불가능하니 내보내기를 먼저 해두세요.
        </p>
        <button
          onClick={handleReset}
          className="w-full py-3 min-h-[48px] rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          style={confirmReset
            ? { background: '#ef4444', color: 'white' }
            : { background: '#FEE2E2', color: '#ef4444', border: '2px solid #FECACA' }}
          aria-label={confirmReset ? '한 번 더 누르면 모두 삭제됩니다' : '전체 초기화'}
        >
          <Trash2 size={14} aria-hidden="true" />
          {confirmReset ? '⚠️ 한 번 더 누르면 모두 삭제됩니다' : '전체 초기화'}
        </button>
        {resetMsg && (
          <p className="text-xs text-center font-medium" style={{ color: '#888' }} role="status" aria-live="polite">
            {resetMsg}
          </p>
        )}
      </section>

      {/* ── 앱 정보 ── */}
      <section className="card p-5 space-y-2" aria-labelledby="info-section-title">
        <h3 id="info-section-title" className="text-sm font-bold" style={{ color: '#2D2D2D' }}>ℹ️ 앱 정보</h3>
        <dl className="space-y-1.5">
          <div className="flex justify-between">
            <dt className="text-xs" style={{ color: '#888' }}>이미지 생성</dt>
            <dd className="text-xs font-medium" style={{ color: '#2D2D2D' }}>Pollinations.ai (무료)</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-xs" style={{ color: '#888' }}>데이터 저장</dt>
            <dd className="text-xs font-medium" style={{ color: '#2D2D2D' }}>로컬 기기 (서버 없음)</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-xs" style={{ color: '#888' }}>이미지 저장</dt>
            <dd className="text-xs font-medium" style={{ color: '#2D2D2D' }}>IndexedDB (기기 내)</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-xs" style={{ color: '#888' }}>버전</dt>
            <dd className="text-xs font-medium" style={{ color: '#2D2D2D' }}>1.3.0</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
