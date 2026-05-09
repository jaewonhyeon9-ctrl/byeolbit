'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  clearAll,
  exportData,
  getStorageStats,
  importData,
  loadSettings,
  saveSettings,
  type BackupBundle,
} from '@/lib/storage';
import {
  fireAllDueChecks,
  getPermissionState,
  registerServiceWorker,
  requestPermission,
  type PermissionState,
} from '@/lib/notifications';
import { downloadCSV } from '@/lib/export';
import { encryptShare } from '@/lib/share-crypto';
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

  const [pushEnabled, setPushEnabled] = useState(false);
  const [permission, setPermission] = useState<PermissionState>('default');
  const [pushBusy, setPushBusy] = useState(false);

  const [shareTtlDays, setShareTtlDays] = useState(7);
  const [shareLink, setShareLink] = useState<{
    url: string;
    expiresAt: string;
  } | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  async function createShareLink() {
    setShareLoading(true);
    setShareError('');
    setShareLink(null);
    setShareCopied(false);
    try {
      const bundle = exportData();
      const { payload, keyB64 } = await encryptShare(bundle);
      const ttlSeconds = shareTtlDays * 24 * 60 * 60;
      const res = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, ttl: ttlSeconds }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `생성 실패 (${res.status})`);
      }
      const result = (await res.json()) as { id: string; expiresAt: string };
      const url = `${window.location.origin}/share/${result.id}#k=${keyB64}`;
      setShareLink({ url, expiresAt: result.expiresAt });
    } catch (e) {
      setShareError(e instanceof Error ? e.message : '공유 링크 생성 실패');
    } finally {
      setShareLoading(false);
    }
  }

  async function copyShareLink() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink.url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      window.prompt('아래 링크를 복사하세요', shareLink.url);
    }
  }

  function refreshStats() {
    setStats(getStorageStats());
    setTotalDebt(totalPrincipal(loadDebts()));
  }

  useEffect(() => {
    refreshStats();
    setPermission(getPermissionState());
    setPushEnabled(loadSettings().pushEnabled);
    setMounted(true);
  }, []);

  async function togglePush(next: boolean) {
    setPushBusy(true);
    try {
      if (next) {
        const state = await requestPermission();
        setPermission(state);
        if (state !== 'granted') {
          setPushEnabled(false);
          return;
        }
        await registerServiceWorker();
        const s = loadSettings();
        saveSettings({ ...s, pushEnabled: true });
        setPushEnabled(true);
        await fireAllDueChecks();
      } else {
        const s = loadSettings();
        saveSettings({ ...s, pushEnabled: false });
        setPushEnabled(false);
      }
    } finally {
      setPushBusy(false);
    }
  }

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

      <Link
        href="/principles"
        className="flex items-center justify-between rounded-2xl border border-warmgold/40 bg-warmgold/5 px-5 py-4 hover:bg-warmgold/10"
      >
        <div>
          <div className="text-sm font-bold text-ink">내 원칙 15가지</div>
          <div className="mt-0.5 text-xs font-medium text-ink-soft">
            빚을 깨기 위한 나만의 약속
          </div>
        </div>
        <span className="text-warmgold">→</span>
      </Link>

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

      <section className="rounded-3xl border border-honey/40 bg-honey/5 p-5">
        <h2 className="text-sm font-bold text-ink">공유 링크 만들기</h2>
        <p className="mt-1 text-xs font-medium leading-relaxed text-ink-soft">
          현재 데이터를 <strong className="text-ink">읽기 전용 링크</strong>로 만들어
          가족·상담사에게 공유하실 수 있어요.
          <br />
          데이터는 본인 브라우저에서 암호화되고, 서버는 풀 수 없습니다.
          만료되면 자동 삭제돼요.
        </p>

        <div className="mt-4 flex gap-1 rounded-full border border-line/60 bg-paper/40 p-1 text-xs">
          {[1, 7, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setShareTtlDays(d)}
              className={`flex-1 rounded-full py-1.5 font-bold transition-colors ${
                shareTtlDays === d
                  ? 'bg-honey text-ink'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              {d}일
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={createShareLink}
          disabled={shareLoading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-honey px-4 py-3 text-sm font-bold text-ink hover:bg-honey/90 disabled:opacity-50"
        >
          {shareLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
              만드는 중...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              {shareTtlDays}일 공유 링크 만들기
            </>
          )}
        </button>

        {shareError && (
          <div className="mt-3 rounded-xl border border-clay/40 bg-clay/10 p-3 text-xs font-bold text-clay">
            {shareError}
          </div>
        )}

        {shareLink && (
          <div className="mt-3 rounded-xl border border-sage/40 bg-sage/10 p-3">
            <div className="flex items-center gap-2">
              <input
                value={shareLink.url}
                readOnly
                onClick={(e) => e.currentTarget.select()}
                className="flex-1 truncate rounded-md border border-line/60 bg-paper-card/80 px-2 py-1.5 text-[11px] font-medium text-ink"
              />
              <button
                onClick={copyShareLink}
                className="shrink-0 rounded-md bg-warmgold px-3 py-1.5 text-[11px] font-bold text-ink"
              >
                {shareCopied ? '복사됨' : '복사'}
              </button>
            </div>
            <p className="mt-2 text-[10px] font-medium text-ink-soft">
              만료: {new Date(shareLink.expiresAt).toLocaleString('ko-KR')}
              <br />⚠ 링크엔 복호화 키가 포함되어 있어요. 받는 사람만 보세요.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-sage/40 bg-sage/5 p-5">
        <h2 className="text-sm font-bold text-ink">오늘의 별빛 알림</h2>
        <p className="mt-1 text-xs font-medium leading-relaxed text-ink-soft">
          앱을 열 때 <strong className="text-ink">오늘 메시지 + 상환일 별빚</strong>을
          알림으로 한 번씩 띄워드려요. 알림은 이 기기에서만 동작하고,
          외부로 데이터가 나가지 않습니다.
        </p>

        {permission === 'unsupported' ? (
          <div className="mt-3 rounded-xl border border-line/60 bg-paper/40 p-3 text-[11px] text-ink-soft">
            이 브라우저는 알림을 지원하지 않아요. iOS Safari는 홈 화면에 추가하면
            지원됩니다 (iOS 16.4+).
          </div>
        ) : permission === 'denied' ? (
          <div className="mt-3 rounded-xl border border-clay/40 bg-clay/10 p-3 text-[11px] text-clay">
            이 사이트의 알림 권한이 차단돼 있어요. 브라우저 주소창 자물쇠 아이콘에서
            알림을 "허용"으로 바꾼 뒤 다시 시도해주세요.
          </div>
        ) : (
          <button
            type="button"
            onClick={() => togglePush(!pushEnabled)}
            disabled={pushBusy}
            className={`mt-4 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-bold transition disabled:opacity-50 ${
              pushEnabled
                ? 'border-sage/50 bg-sage text-paper'
                : 'border-line/60 bg-paper-card/80 text-ink hover:bg-paper-card'
            }`}
          >
            <span>{pushEnabled ? '알림 켜져 있음' : '알림 켜기'}</span>
            <span
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                pushEnabled ? 'bg-paper/40' : 'bg-line/60'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-paper transition ${
                  pushEnabled ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </span>
          </button>
        )}
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
