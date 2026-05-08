'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadDebts, loadSettings } from '@/lib/storage';
import {
  totalPrincipal,
  totalMinPayment,
  classificationBreakdown,
  estimateRepaymentForPortfolio,
} from '@/lib/calculator';
import { formatKRW, formatKRWShort, formatMonths } from '@/lib/format';
import { getDailyInsight } from '@/lib/insights';
import { DojangSeal } from '@/components/DojangSeal';
import type { Debt } from '@/lib/types';

export default function HomePage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [seed, setSeed] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDebts(loadDebts());
    setSeed(loadSettings().insightSeed);
    setMounted(true);
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const insight = getDailyInsight(seed, today);

  const total = totalPrincipal(debts);
  const minSum = totalMinPayment(debts);
  const months = estimateRepaymentForPortfolio(debts);
  const breakdown = classificationBreakdown(debts);
  const breakdownTotal = breakdown.good + breakdown.neutral + breakdown.bad || 1;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-ink">별빚도장</h1>
          <p className="text-xs text-ink-soft">별빛이 되는 순간까지</p>
        </div>
        <Link
          href="/debts/new"
          className="rounded-full border border-warmgold/40 bg-warmgold/10 px-3 py-1.5 text-xs font-medium text-warmgold hover:bg-warmgold/20"
        >
          + 별빚 새기기
        </Link>
      </header>

      {mounted && debts.length === 0 ? (
        <EmptyState />
      ) : mounted ? (
        <>
          <section className="rounded-3xl border border-line/60 bg-paper-card/40 p-5 ring-1 ring-warmgold/20 backdrop-blur-md">
            <div className="text-xs text-ink-soft">현재 별빚 합계</div>
            <div className="mt-1 text-3xl font-bold tracking-tight text-ink">
              {formatKRW(total)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Stat label="월 최소 상환" value={formatKRWShort(minSum) + '원'} />
              <Stat
                label="현 페이스 완납"
                value={Number.isFinite(months) ? formatMonths(months) : '재설계 필요'}
              />
            </div>
            <BreakdownBar breakdown={breakdown} total={breakdownTotal} />
          </section>

          <section className="rounded-2xl border border-warmgold/30 bg-gradient-to-br from-warmgold/15 to-transparent p-5 backdrop-blur-md">
            <div className="text-[10px] uppercase tracking-widest text-warmgold/80">
              오늘의 메시지
            </div>
            <h2 className="mt-1 text-base font-semibold text-ink">{insight.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{insight.body}</p>
            <p className="mt-3 text-sm font-medium italic text-honey star-glow">
              “{insight.affirmation}”
            </p>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">별빚 도장</h2>
              <Link href="/debts" className="text-xs text-ink-soft hover:text-ink">
                전체 보기 →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {debts.slice(0, 6).map((d) => (
                <DojangSeal key={d.id} debt={d} />
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="h-40 animate-pulse rounded-3xl bg-paper-card/30" />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line/40 bg-paper/40 px-3 py-2">
      <div className="text-[10px] text-ink-soft">{label}</div>
      <div className="text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}

function BreakdownBar({
  breakdown,
  total,
}: {
  breakdown: Record<'good' | 'neutral' | 'bad', number>;
  total: number;
}) {
  const goodPct = (breakdown.good / total) * 100;
  const neutralPct = (breakdown.neutral / total) * 100;
  const badPct = (breakdown.bad / total) * 100;
  return (
    <div className="mt-4">
      <div className="flex h-2 overflow-hidden rounded-full bg-line/40">
        <div className="bg-sage" style={{ width: `${goodPct}%` }} />
        <div className="bg-honey" style={{ width: `${neutralPct}%` }} />
        <div className="bg-clay" style={{ width: `${badPct}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-ink-soft">
        <span>긍정 {Math.round(goodPct)}%</span>
        <span>중립 {Math.round(neutralPct)}%</span>
        <span>부정 {Math.round(badPct)}%</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center">
      <div className="relative">
        <svg viewBox="0 0 100 100" className="h-32 w-32 text-warmgold star-glow">
          <polygon
            points="50,8 61,38 93,40 68,58 78,90 50,72 22,90 32,58 7,40 39,38"
            fill="currentColor"
            opacity={0.25}
          />
          <polygon
            points="50,8 61,38 93,40 68,58 78,90 50,72 22,90 32,58 7,40 39,38"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-bold text-ink">첫 별빚을 새겨주세요</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          빚은 흐려진 별일 뿐이에요.<br />
          하나씩 새기면 우주가 보이기 시작합니다.
        </p>
      </div>
      <Link
        href="/debts/new"
        className="rounded-full bg-warmgold px-6 py-3 text-sm font-semibold text-ink hover:bg-warmgold/90"
      >
        별빚 새기기
      </Link>
    </div>
  );
}
