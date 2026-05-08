'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { decryptShare, type EncryptedPayload } from '@/lib/share-crypto';
import {
  classify,
  CATEGORY_LABELS,
  CLASSIFICATION_LABELS,
  CLASSIFICATION_TONE,
} from '@/lib/classifier';
import {
  formatFrequency,
  formatKRW,
  formatKRWShort,
  formatPercent,
} from '@/lib/format';
import {
  avgInterestRate,
  totalInterestPerMonth,
  totalMinPayment,
  totalPrincipal,
} from '@/lib/calculator';
import {
  EXPENSE_CATEGORY_EMOJI,
  EXPENSE_CATEGORY_LABELS,
} from '@/lib/expense';
import type {
  Debt,
  Payment,
  ScheduledExpense,
  Settings,
} from '@/lib/types';

interface SharedData {
  debts?: Debt[];
  payments?: Payment[];
  expenses?: ScheduledExpense[];
  principles?: string[];
  settings?: Partial<Settings>;
  exportedAt?: string;
}

export default function SharedDataPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
    const keyB64 = hashParams.get('k');
    if (!keyB64) {
      setError('복호화 키가 없는 링크예요. 발신자에게 다시 받아주세요.');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/share/${id}`, { cache: 'no-store' });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error || `불러오기 실패 (${res.status})`);
        }
        const payload = (await res.json()) as EncryptedPayload;
        const decoded = await decryptShare<SharedData>(payload, keyB64);
        setData(decoded);
      } catch (e) {
        setError(e instanceof Error ? e.message : '공유 데이터를 열 수 없어요.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-warmgold/30 border-t-warmgold" />
        <p className="mt-3 text-xs font-medium text-ink-soft">
          공유 데이터를 풀고 있어요...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-lg font-bold text-ink">공유 링크를 열 수 없어요</h1>
        <p className="text-sm font-medium text-ink-soft">{error}</p>
        <Link
          href="/"
          className="rounded-full bg-warmgold px-5 py-2.5 text-xs font-bold text-ink"
        >
          홈으로
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const debts = data.debts ?? [];
  const payments = data.payments ?? [];
  const expenses = data.expenses ?? [];
  const principles = (data.principles ?? []).filter((p) => p && p.trim());
  const total = totalPrincipal(debts);
  const minSum = totalMinPayment(debts);
  const rate = avgInterestRate(debts);
  const interest = totalInterestPerMonth(debts);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl border border-warmgold/40 bg-warmgold/5 p-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-warmgold">
          공유된 데이터 · 읽기 전용
        </p>
        <p className="mt-1 text-xs font-medium text-ink-soft">
          이 링크의 데이터는 별빚도장 사용자가 공유한 스냅샷이에요.
          {data.exportedAt &&
            ` (${new Date(data.exportedAt).toLocaleDateString('ko-KR')} 기준)`}
        </p>
      </header>

      <section className="rounded-3xl border border-line/60 bg-paper-card/50 p-5 ring-1 ring-warmgold/20">
        <div className="text-xs font-medium text-ink-soft">총 별빚 합계</div>
        <div className="mt-1 text-3xl font-bold tracking-tight text-ink">
          {formatKRW(total)}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Stat label="평균 이율" value={formatPercent(rate)} />
          <Stat
            label="월 최소 상환합"
            value={formatKRWShort(minSum) + '원'}
          />
          <Stat
            label="월 이자 비용"
            value={formatKRWShort(interest) + '원'}
          />
          <Stat label="활성 별빚" value={`${debts.filter((d) => !d.paidOff).length}개`} />
        </div>
      </section>

      {debts.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-ink">별빚 목록</h2>
          <div className="flex flex-col gap-2">
            {debts.map((d) => {
              const cls = classify(d);
              const tone = CLASSIFICATION_TONE[cls];
              return (
                <div
                  key={d.id}
                  className={`rounded-xl border border-line/60 bg-paper-card/50 p-3 ring-1 ${tone.ring}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-ink">
                        {d.name}
                        {d.paidOff && (
                          <span className="ml-2 text-[10px] font-bold text-honey">
                            ✦ 완납
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-medium text-ink-soft">
                        {CATEGORY_LABELS[d.category]} · {formatFrequency(d)}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${tone.chip} ${tone.chipText}`}
                    >
                      {CLASSIFICATION_LABELS[cls]}
                    </span>
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-medium text-ink-soft">
                        잔액
                      </div>
                      <div className={`text-base font-bold ${tone.text}`}>
                        {formatKRW(d.principal)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-medium text-ink-soft">
                        이율
                      </div>
                      <div className="text-sm font-bold text-ink">
                        {formatPercent(d.interestRate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-medium text-ink-soft">
                        회당
                      </div>
                      <div className="text-sm font-bold text-ink">
                        {formatKRW(d.minPayment)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {payments.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">상환 기록</h2>
            <span className="text-xs font-medium text-ink-soft">
              총 {formatKRW(totalPaid)} ({payments.length}건)
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {[...payments]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 10)
              .map((p) => {
                const debtName =
                  debts.find((d) => d.id === p.debtId)?.name ?? '(삭제됨)';
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-line/40 bg-paper-card/40 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-ink">
                        {debtName}
                      </div>
                      <div className="text-[10px] font-medium text-ink-soft">
                        {new Date(p.date).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-warmgold">
                      {formatKRW(p.amount)}
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {expenses.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-ink">최근 지출</h2>
          <div className="flex flex-col gap-1.5">
            {[...expenses]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 10)
              .map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-2 rounded-lg border border-line/40 bg-paper-card/40 px-3 py-2"
                >
                  <span className="text-base">
                    {EXPENSE_CATEGORY_EMOJI[e.category ?? 'other']}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-ink">
                      {e.name}
                    </div>
                    <div className="text-[10px] font-medium text-ink-soft">
                      {EXPENSE_CATEGORY_LABELS[e.category ?? 'other']} · {e.date}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-ink">
                    {formatKRW(e.amount)}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {principles.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-ink">
            원칙 ({principles.length}가지)
          </h2>
          <ol className="flex flex-col gap-1.5">
            {principles.map((p, i) => (
              <li
                key={i}
                className="flex gap-2 rounded-lg border border-line/40 bg-paper-card/40 p-3 text-sm font-bold text-ink"
              >
                <span className="text-warmgold">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1">{p}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <footer className="rounded-xl border border-line/40 bg-paper/40 p-3 text-center">
        <p className="text-[10px] font-medium leading-relaxed text-ink-soft">
          이 페이지는 별빚도장 공유 링크예요. 데이터는 만료되면 자동 삭제됩니다.
        </p>
        <Link
          href="/"
          className="mt-2 inline-block text-xs font-bold text-warmgold hover:underline"
        >
          별빚도장 알아보기 →
        </Link>
      </footer>
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
