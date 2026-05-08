'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { loadDebts, loadSettings, saveSettings } from '@/lib/storage';
import {
  avgInterestRate,
  simulatePayoff,
  sortByStrategy,
  totalInterestPerMonth,
  totalMinPayment,
  totalPrincipal,
} from '@/lib/calculator';
import {
  formatKRW,
  formatKRWShort,
  formatMonths,
  formatPercent,
} from '@/lib/format';
import type { Debt, Strategy } from '@/lib/types';
import { CATEGORY_LABELS, CLASSIFICATION_TONE, classify } from '@/lib/classifier';

export default function PlanPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [strategy, setStrategy] = useState<Strategy>('avalanche');
  const [monthlyInput, setMonthlyInput] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDebts(loadDebts());
    setStrategy(loadSettings().strategy);
    setMounted(true);
  }, []);

  const total = totalPrincipal(debts);
  const minSum = totalMinPayment(debts);
  const rate = avgInterestRate(debts);
  const monthlyInterest = totalInterestPerMonth(debts);

  useEffect(() => {
    if (mounted && monthlyInput === '' && minSum > 0) {
      setMonthlyInput(String(Math.round(minSum)));
    }
  }, [mounted, minSum, monthlyInput]);

  const monthlyTotal = Number(monthlyInput) || 0;
  const sliderMax = Math.max(10_000_000, Math.ceil(minSum * 4));
  const sliderStep = Math.max(10_000, Math.round(sliderMax / 200 / 10_000) * 10_000);

  const baseSim = useMemo(
    () => simulatePayoff(debts, minSum, strategy),
    [debts, minSum, strategy]
  );
  const userSim = useMemo(
    () => simulatePayoff(debts, monthlyTotal, strategy),
    [debts, monthlyTotal, strategy]
  );

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
        <p className="text-sm font-medium text-ink-soft">
          별빚을 먼저 새겨야 플랜을 짤 수 있어요.
        </p>
        <Link
          href="/debts/new"
          className="rounded-full bg-warmgold px-5 py-2.5 text-sm font-bold text-ink"
        >
          첫 별빚 새기기
        </Link>
      </div>
    );
  }

  const savedMonths =
    Number.isFinite(baseSim.totalMonths) && Number.isFinite(userSim.totalMonths)
      ? Math.max(0, baseSim.totalMonths - userSim.totalMonths)
      : 0;
  const savedInterest = baseSim.totalInterestPaid - userSim.totalInterestPaid;

  const payoffByDebtId = new Map(userSim.perDebt.map((p) => [p.debtId, p]));

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-bold text-ink">상환 플랜</h1>
        <p className="text-xs font-medium text-ink-soft">
          언제 별빛이 되는지, 무엇이 바뀌는지
        </p>
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
        <h2 className="text-sm font-bold text-ink">상환 방식</h2>
        <p className="mt-1 text-xs font-medium text-ink-soft">
          {strategy === 'avalanche'
            ? '이율 높은 별빚부터 깨면 이자가 가장 적게 듭니다 (수학적 최적).'
            : '잔액 작은 별빚부터 깨면 빠르게 도장이 부서지며 동기부여가 됩니다.'}
        </p>
        <div className="mt-3 flex gap-2 rounded-full border border-line/60 bg-paper/40 p-1 text-xs">
          <button
            onClick={() => changeStrategy('avalanche')}
            className={`flex-1 rounded-full py-1.5 font-bold transition-colors ${
              strategy === 'avalanche'
                ? 'bg-warmgold text-ink'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            눈사태 (이율순)
          </button>
          <button
            onClick={() => changeStrategy('snowball')}
            className={`flex-1 rounded-full py-1.5 font-bold transition-colors ${
              strategy === 'snowball'
                ? 'bg-warmgold text-ink'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            눈덩이 (잔액순)
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-warmgold/40 bg-gradient-to-br from-warmgold/15 to-transparent p-5 backdrop-blur-md">
        <h2 className="text-sm font-bold text-ink">월 상환 시뮬레이션</h2>
        <p className="mt-1 text-xs font-medium text-ink-soft">
          한 달에 얼마 갚으시겠어요? 마지막 도장이 언제 깨지는지 보여드릴게요.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={sliderMax}
            step={sliderStep}
            value={monthlyTotal}
            onChange={(e) => setMonthlyInput(e.target.value)}
            className="flex-1 accent-warmgold"
          />
          <input
            inputMode="numeric"
            value={monthlyInput}
            onChange={(e) =>
              setMonthlyInput(e.target.value.replace(/[^0-9]/g, ''))
            }
            className="w-32 rounded-lg border border-line/60 bg-paper/60 px-2 py-1 text-right text-sm font-bold text-ink"
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-medium text-ink-soft">
          <span>0원</span>
          <span>≈ {formatKRWShort(monthlyTotal)}원/월</span>
          <span>{formatKRWShort(sliderMax)}원</span>
        </div>

        {userSim.insufficientMonthly && (
          <div className="mt-4 rounded-xl border border-clay/40 bg-clay/10 p-3 text-xs font-bold text-clay">
            ⚠ 월 최소 상환액({formatKRW(minSum)})에 못 미쳐요. 이대로면 이자가 계속 늘어납니다.
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat
            label={`현 페이스 (월 ${formatKRWShort(minSum)})`}
            value={formatMonths(baseSim.totalMonths)}
            sub={
              Number.isFinite(baseSim.totalMonths)
                ? `이자 ${formatKRWShort(baseSim.totalInterestPaid)}원`
                : '재설계 필요'
            }
          />
          <Stat
            label={`월 ${formatKRWShort(monthlyTotal)} 상환 시`}
            value={formatMonths(userSim.totalMonths)}
            sub={
              Number.isFinite(userSim.totalMonths)
                ? savedMonths > 0
                  ? `${formatMonths(savedMonths)} 단축 · 이자 ${formatKRWShort(Math.max(0, savedInterest))}원 절약`
                  : '동일'
                : '계산 불가'
            }
          />
        </div>

        {userSim.finite && userSim.totalMonths > 0 && (
          <p className="mt-4 rounded-xl border border-honey/40 bg-honey/10 p-3 text-xs font-bold text-ink">
            마지막 도장은 {finalBreakDate(userSim.totalMonths)}쯤 깨집니다
          </p>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-ink">도장이 깨지는 순서</h2>
          <span className="text-[10px] font-medium text-ink-soft">
            월 {formatKRWShort(monthlyTotal)}원 기준
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {sorted.map((d, idx) => {
            const cls = classify(d);
            const tone = CLASSIFICATION_TONE[cls];
            const payoff = payoffByDebtId.get(d.id);
            const months = payoff?.payoffMonth;
            return (
              <div
                key={d.id}
                className={`flex items-center gap-3 rounded-xl border border-line/60 bg-paper-card/50 p-3 ring-1 ${tone.ring}`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warmgold/20 text-xs font-bold text-warmgold">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-ink">{d.name}</div>
                  <div className="text-[10px] font-medium text-ink-soft">
                    {CATEGORY_LABELS[d.category]} · {formatPercent(d.interestRate)} ·{' '}
                    {formatKRWShort(d.principal)}원
                  </div>
                </div>
                <div className="text-right">
                  {months != null && Number.isFinite(months) && months > 0 ? (
                    <>
                      <div className={`text-sm font-bold ${tone.text}`}>
                        {formatMonths(months)} 후
                      </div>
                      <div className="text-[10px] font-medium text-ink-soft">
                        {breakDate(months)}
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] font-bold text-ink-soft">계산 불가</div>
                  )}
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
    <div className="rounded-xl border border-line/40 bg-paper/50 px-3 py-2.5">
      <div className="text-[10px] font-medium text-ink-soft">{label}</div>
      <div className="text-base font-bold text-ink">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] font-medium text-ink-soft">{sub}</div>}
    </div>
  );
}

function breakDate(monthsAhead: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' });
}

function finalBreakDate(monthsAhead: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
}
