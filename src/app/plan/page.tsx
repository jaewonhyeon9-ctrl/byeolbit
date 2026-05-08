'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { loadDebts, loadSettings, saveSettings } from '@/lib/storage';
import {
  avgInterestRate,
  estimateRepaymentForPortfolio,
  sortByStrategy,
  totalInterestPerMonth,
  totalMinPayment,
  totalPrincipal,
} from '@/lib/calculator';
import { formatKRW, formatKRWShort, formatMonths, formatPercent } from '@/lib/format';
import type { Debt, Strategy } from '@/lib/types';
import { CATEGORY_LABELS, CLASSIFICATION_TONE, classify } from '@/lib/classifier';

export default function PlanPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [strategy, setStrategy] = useState<Strategy>('avalanche');
  const [extraInput, setExtraInput] = useState('0');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDebts(loadDebts());
    setStrategy(loadSettings().strategy);
    setMounted(true);
  }, []);

  const extra = Number(extraInput) || 0;

  const total = totalPrincipal(debts);
  const minSum = totalMinPayment(debts);
  const rate = avgInterestRate(debts);
  const monthsBase = useMemo(() => estimateRepaymentForPortfolio(debts, 0), [debts]);
  const monthsExtra = useMemo(
    () => estimateRepaymentForPortfolio(debts, extra),
    [debts, extra]
  );
  const monthlyInterest = totalInterestPerMonth(debts);
  const sorted = useMemo(() => sortByStrategy(debts, strategy), [debts, strategy]);

  function changeStrategy(s: Strategy) {
    setStrategy(s);
    saveSettings({ ...loadSettings(), strategy: s });
  }

  if (!mounted) {
    return <div className="h-40 animate-pulse rounded-3xl bg-paper-card/30" />;
  }

  if (debts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-lg font-bold text-ink">상환 플랜</h1>
        <p className="text-sm text-ink-soft">
          별빚을 먼저 새겨야 플랜을 짤 수 있어요.
        </p>
        <Link
          href="/debts/new"
          className="rounded-full bg-warmgold px-5 py-2.5 text-sm font-semibold text-ink"
        >
          첫 별빚 새기기
        </Link>
      </div>
    );
  }

  const savedMonths =
    Number.isFinite(monthsBase) && Number.isFinite(monthsExtra)
      ? Math.max(0, monthsBase - monthsExtra)
      : 0;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-bold text-ink">상환 플랜</h1>
        <p className="text-xs text-ink-soft">언제 별빛이 되는지, 무엇이 바뀌는지</p>
      </header>

      <section className="rounded-3xl border border-line/60 bg-paper-card/40 p-5 ring-1 ring-warmgold/20 backdrop-blur-md">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="총 별빚" value={formatKRW(total)} />
          <Stat label="평균 이율" value={formatPercent(rate)} />
          <Stat label="월 최소 상환" value={formatKRWShort(minSum) + '원'} />
          <Stat
            label="월 이자 비용"
            value={formatKRWShort(monthlyInterest) + '원'}
            sub="이만큼 매달 사라집니다"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-line/60 bg-paper-card/40 p-5 backdrop-blur-md">
        <h2 className="text-sm font-semibold text-ink">상환 방식</h2>
        <p className="mt-1 text-xs text-ink-soft">
          {strategy === 'avalanche'
            ? '이율 높은 별빚부터 깨면 이자가 가장 적게 듭니다 (수학적 최적).'
            : '잔액 작은 별빚부터 깨면 빠르게 도장이 부서지며 동기부여가 됩니다.'}
        </p>
        <div className="mt-3 flex gap-2 rounded-full border border-line/60 bg-paper/40 p-1 text-xs">
          <button
            onClick={() => changeStrategy('avalanche')}
            className={`flex-1 rounded-full py-1.5 font-medium transition-colors ${
              strategy === 'avalanche'
                ? 'bg-warmgold text-ink'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            눈사태 (이율순)
          </button>
          <button
            onClick={() => changeStrategy('snowball')}
            className={`flex-1 rounded-full py-1.5 font-medium transition-colors ${
              strategy === 'snowball'
                ? 'bg-warmgold text-ink'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            눈덩이 (잔액순)
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-warmgold/30 bg-gradient-to-br from-warmgold/15 to-transparent p-5 backdrop-blur-md">
        <h2 className="text-sm font-semibold text-ink">시뮬레이션</h2>
        <p className="mt-1 text-xs text-ink-soft">월 추가 상환액을 조절해보세요.</p>
        <div className="mt-4 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={3000000}
            step={50000}
            value={extra}
            onChange={(e) => setExtraInput(e.target.value)}
            className="flex-1 accent-warmgold"
          />
          <input
            inputMode="numeric"
            value={extraInput}
            onChange={(e) => setExtraInput(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-28 rounded-lg border border-line/60 bg-paper/40 px-2 py-1 text-right text-sm text-ink"
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat
            label="현 페이스"
            value={formatMonths(monthsBase)}
            sub={Number.isFinite(monthsBase) ? '예상 완납' : '재설계 필요'}
          />
          <Stat
            label={extra > 0 ? `+${formatKRWShort(extra)}원/월` : '추가 0원'}
            value={formatMonths(monthsExtra)}
            sub={savedMonths > 0 ? `${formatMonths(savedMonths)} 단축` : '동일'}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">우선순위 (위에서부터 깨기)</h2>
        <div className="flex flex-col gap-2">
          {sorted.map((d, idx) => {
            const cls = classify(d);
            const tone = CLASSIFICATION_TONE[cls];
            return (
              <div
                key={d.id}
                className={`flex items-center gap-3 rounded-xl border border-line/60 bg-paper-card/40 p-3 ring-1 ${tone.ring}`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warmgold/15 text-xs font-bold text-warmgold">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-ink">{d.name}</div>
                  <div className="text-[10px] text-ink-soft">
                    {CATEGORY_LABELS[d.category]} · {formatPercent(d.interestRate)}
                  </div>
                </div>
                <div className={`text-right text-sm font-semibold ${tone.text}`}>
                  {formatKRWShort(d.principal)}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line/40 bg-paper/40 px-3 py-2.5">
      <div className="text-[10px] text-ink-soft">{label}</div>
      <div className="text-base font-semibold text-ink">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-ink-soft">{sub}</div>}
    </div>
  );
}
