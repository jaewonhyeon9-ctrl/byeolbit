'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  clearAll,
  exportData,
  getStorageStats,
  importData,
  type BackupBundle,
} from '@/lib/storage';
import { downloadCSV } from '@/lib/export';
import { formatKRW } from '@/lib/format';
import { totalPrincipal } from '@/lib/calculator';
import { loadDebts } from '@/lib/storage';

export default function SettingsPage() {
  const [stats, setStats] = useState({
    debts: 0,
    activeDebts: 0,
    paidOffDebts: 0,
    payments: 0,
  });
  const [totalDebt, setTotalDebt] = useState(0);
  const [importStatus, setImportStatus] = useState<
    | { type: 'success'; debts: number; payments: number }
    | { type: 'error'; message: string }
    | null
  >(null);
  const [mounted, setMounted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function refreshStats() {
    setStats(getStorageStats());
    setTotalDebt(totalPrincipal(loadDebts()));
  }

  useEffect(() => {
    refreshStats();
    setMounted(true);
  }, []);

  function handleExport() {
    const bundle = exportData();
    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const today = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `byeolbit-backup-${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    setImportStatus(null);
    try {
      const text = await file.text();
      const bundle = JSON.parse(text) as BackupBundle;

      const ok = window.confirm(
        `백업을 복원하시겠어요?\n\n` +
          `백업일: ${new Date(bundle.exportedAt).toLocaleString('ko-KR')}\n` +
          `별빚 ${bundle.debts?.length ?? 0}개, 상환 기록 ${bundle.payments?.length ?? 0}개\n\n` +
          `⚠️ 현재 데이터는 모두 덮어써집니다. 되돌릴 수 없어요.`
      );
      if (!ok) return;

      const result = importData(bundle);
      setImportStatus({ type: 'success', debts: result.debts, payments: result.payments });
      refreshStats();
    } catch (e) {
      setImportStatus({
        type: 'error',
        message: e instanceof Error ? e.message : '복원 실패',
      });
    }
  }

  function handleClearAll() {
    const ok = window.confirm(
      '⚠️ 정말 모든 별빚 데이터를 지우시겠어요?\n\n' +
        '빚 / 상환 기록 / 설정 전부 삭제됩니다.\n' +
        '되돌릴 수 없으니 먼저 백업하세요.'
    );
    if (!ok) return;
    const ok2 = window.confirm(
      '한 번 더 확인합니다.\n정말 지우면 복구 불가입니다.'
    );
    if (!ok2) return;
    clearAll();
    refreshStats();
    window.alert('모든 데이터가 삭제됐어요.');
  }

  if (!mounted) {
    return <div className="h-40 animate-pulse rounded-3xl bg-paper-card/30" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-lg font-bold text-ink">설정</h1>
        <p className="text-xs font-medium text-ink-soft">
          데이터를 안전하게 지키는 도구들
        </p>
      </header>

      <section className="rounded-3xl border border-line/60 bg-paper-card/50 p-5">
        <h2 className="text-sm font-bold text-ink">현재 데이터</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat label="별빚 (활성)" value={`${stats.activeDebts}개`} />
          <Stat label="별빛 (완납)" value={`${stats.paidOffDebts}개`} />
          <Stat label="총 별빚 합계" value={formatKRW(totalDebt)} />
          <Stat label="상환 기록" value={`${stats.payments}건`} />
        </div>
      </section>

      <section className="rounded-3xl border border-line/60 bg-paper-card/50 p-5">
        <h2 className="text-sm font-bold text-ink">엑셀 / PDF 내려받기</h2>
        <p className="mt-1 text-xs font-medium leading-relaxed text-ink-soft">
          별빚 목록 + 상환 기록을 보기 좋게 정리한 파일로 내려받으실 수 있어요.
          엑셀은 통계·필터링하실 때, PDF는 인쇄·보관하실 때 좋습니다.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={downloadCSV}
            className="flex items-center justify-center gap-2 rounded-xl border border-sage/40 bg-sage/10 px-4 py-3 text-sm font-bold text-sage hover:bg-sage/20"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="15" y2="17" />
            </svg>
            엑셀로 내려받기 (.csv)
          </button>
          <Link
            href="/report"
            className="flex items-center justify-center gap-2 rounded-xl border border-warmgold/40 bg-warmgold/10 px-4 py-3 text-sm font-bold text-warmgold hover:bg-warmgold/20"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M9 15h6" />
              <path d="M9 11h6" />
              <path d="M9 19h2" />
            </svg>
            PDF로 보기 (인쇄·저장)
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-warmgold/40 bg-warmgold/5 p-5">
        <h2 className="text-sm font-bold text-ink">백업 / 복원</h2>
        <p className="mt-1 text-xs font-medium leading-relaxed text-ink-soft">
          데이터는 이 기기 브라우저에만 저장돼요. 휴대폰 변경·캐시 삭제 시 사라지니
          <strong className="text-ink"> 주기적으로 백업</strong>하시고, 다른 기기에서도
          복원하실 수 있습니다.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center gap-2 rounded-xl bg-warmgold px-4 py-3 text-sm font-bold text-ink hover:bg-warmgold/90"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            백업 파일 내려받기 (JSON)
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
              e.target.value = '';
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border border-line/60 bg-paper-card/80 px-4 py-3 text-sm font-bold text-ink hover:bg-paper-card"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            백업 파일에서 복원하기
          </button>
        </div>

        {importStatus && (
          <div
            className={`mt-3 rounded-xl border p-3 text-xs font-medium ${
              importStatus.type === 'success'
                ? 'border-sage/40 bg-sage/10 text-sage'
                : 'border-clay/40 bg-clay/10 text-clay'
            }`}
          >
            {importStatus.type === 'success'
              ? `복원 완료. 별빚 ${importStatus.debts}개, 상환 기록 ${importStatus.payments}건 불러왔어요.`
              : importStatus.message}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-line/60 bg-paper-card/50 p-5">
        <h2 className="text-sm font-bold text-ink">자동 동기화 (준비 중)</h2>
        <p className="mt-1 text-xs font-medium leading-relaxed text-ink-soft">
          이메일 매직링크로 로그인하면 여러 기기 간 자동 동기화 + 클라우드 백업이
          가능해질 예정이에요. 출시 직전 추가 예정입니다.
        </p>
        <button
          type="button"
          disabled
          className="mt-4 w-full rounded-xl border border-dashed border-line/60 bg-paper/40 py-3 text-sm font-bold text-ink-soft/60"
        >
          이메일로 로그인 (준비 중)
        </button>
      </section>

      <section className="rounded-3xl border border-clay/30 bg-clay/5 p-5">
        <h2 className="text-sm font-bold text-clay">위험 구역</h2>
        <p className="mt-1 text-xs font-medium leading-relaxed text-ink-soft">
          모든 별빚 / 상환 기록 / 설정을 영구히 삭제합니다. 되돌릴 수 없어요.
        </p>
        <button
          type="button"
          onClick={handleClearAll}
          className="mt-4 w-full rounded-xl border border-clay/40 bg-clay/10 py-3 text-sm font-bold text-clay hover:bg-clay/20"
        >
          모든 데이터 지우기
        </button>
      </section>

      <section className="rounded-3xl border border-line/40 bg-paper/30 p-4">
        <p className="text-[10px] font-medium leading-relaxed text-ink-soft/80">
          별빚도장 v0.2 ·{' '}
          <Link
            href="https://github.com/jaewonhyeon9-ctrl/byeolbit"
            target="_blank"
            className="text-warmgold hover:underline"
          >
            GitHub
          </Link>
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line/40 bg-paper/40 px-3 py-2">
      <div className="text-[10px] font-medium text-ink-soft">{label}</div>
      <div className="text-sm font-bold text-ink">{value}</div>
    </div>
  );
}
