'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { loadExpenses } from '@/lib/storage';
import {
  analyzeSpending,
  EXPENSE_CATEGORY_EMOJI,
  EXPENSE_CATEGORY_LABELS,
  temperatureLabel,
} from '@/lib/expense';
import type { ScheduledExpense } from '@/lib/types';
import { formatKRW, formatKRWShort } from '@/lib/format';

export default function SpendingPage() {
  const [expenses, setExpenses] = useState<ScheduledExpense[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setExpenses(loadExpenses());
    setMounted(true);
  }, []);

  const analysis = useMemo(() => analyzeSpending(expenses), [expenses]);

  if (!mounted) {
    return <div className="h-40 animate-pulse rounded-3xl bg-paper-card/30" />;
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-lg font-bold text-ink">지출 온도</h1>
        <p className="text-sm font-medium text-ink-soft">
          지출 데이터가 없어 온도를 측정할 수 없어요.
          <br />
          지출 캘린더에서 항목을 등록해보세요.
        </p>
        <Link
          href="/calendar"
          className="rounded-full bg-warmgold px-5 py-2.5 text-sm font-bold text-ink"
        >
          캘린더로 가기
        </Link>
      </div>
    );
  }

  const today = temperatureLabel(analysis.todayTemperature);
  const week = temperatureLabel(analysis.weekTemperature);
  const month = temperatureLabel(analysis.monthTemperature);

  const monthChange =
    analysis.prevMonthTotal > 0
      ? (analysis.monthTotal - analysis.prevMonthTotal) / analysis.prevMonthTotal
      : 0;

  const maxDaily = Math.max(...analysis.dailyTrend.map((d) => d.amount), 1);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-bold text-ink">지출 온도</h1>
        <p className="mt-0.5 text-xs font-medium text-ink-soft">
          평소 페이스 대비 얼마나 뜨거운지 살펴보세요.
        </p>
      </header>

      <Thermometer
        temp={analysis.todayTemperature}
        primaryLabel="오늘의 지출 온도"
        toneLabel={today.label}
        tone={today.color}
        hint={today.hint}
        amount={analysis.todayTotal}
        avg={analysis.daily30dAvg}
      />

      <section className="grid grid-cols-2 gap-3">
        <MiniTemp
          label="이번 주"
          temp={analysis.weekTemperature}
          tone={week.color}
          toneLabel={week.label}
          amount={analysis.weekTotal}
        />
        <MiniTemp
          label="이번 달"
          temp={analysis.monthTemperature}
          tone={month.color}
          toneLabel={month.label}
          amount={analysis.monthTotal}
          subtext={
            analysis.prevMonthTotal > 0
              ? monthChange > 0
                ? `지난달보다 +${Math.round(monthChange * 100)}%`
                : `지난달보다 ${Math.round(monthChange * 100)}%`
              : undefined
          }
        />
      </section>

      <section className="rounded-2xl border border-line/60 bg-paper-card/50 p-4">
        <h2 className="text-sm font-bold text-ink">최근 14일 흐름</h2>
        <div className="mt-3 flex h-24 items-end gap-0.5">
          {analysis.dailyTrend.map((d) => {
            const height = (d.amount / maxDaily) * 100;
            const isToday = d.date === new Date().toISOString().slice(0, 10);
            return (
              <div
                key={d.date}
                className="flex flex-1 flex-col items-center justify-end gap-1"
              >
                <div
                  className={`w-full rounded-t-sm ${
                    isToday ? 'bg-warmgold' : 'bg-warmgold/40'
                  }`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
                <span className="text-[8px] font-bold text-ink-soft">
                  {d.date.slice(8)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold text-ink">
          지난 30일 카테고리별
        </h2>
        {analysis.categoryStats.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line/60 p-4 text-center text-xs font-medium text-ink-soft">
            지출 기록이 부족해요.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {analysis.categoryStats.map((stat) => {
              const totalAll =
                analysis.categoryStats.reduce((s, x) => s + x.total, 0) || 1;
              const pct = (stat.total / totalAll) * 100;
              return (
                <div
                  key={stat.category}
                  className="rounded-xl border border-line/60 bg-paper-card/50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {EXPENSE_CATEGORY_EMOJI[stat.category]}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-ink">
                          {EXPENSE_CATEGORY_LABELS[stat.category]}
                        </div>
                        <div className="text-[10px] font-medium text-ink-soft">
                          {stat.count}건 · {Math.round(pct)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-ink">
                        {formatKRW(stat.total)}
                      </div>
                      {stat.changeRatio !== 0 && (
                        <div
                          className={`text-[10px] font-bold ${
                            stat.changeRatio > 0.2
                              ? 'text-clay'
                              : stat.changeRatio < -0.1
                                ? 'text-sage'
                                : 'text-ink-soft'
                          }`}
                        >
                          {stat.changeRatio > 0 ? '+' : ''}
                          {Math.round(stat.changeRatio * 100)}% vs 직전 30일
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line/40">
                    <div
                      className="h-full bg-warmgold"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-warmgold/40 bg-warmgold/5 p-4">
        <h2 className="text-sm font-bold text-ink">지출 억제 팁</h2>
        <ul className="mt-3 flex flex-col gap-2 text-xs font-medium leading-relaxed text-ink-soft">
          {generateTips(analysis).map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-warmgold">✦</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      {analysis.topItems.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-ink">
            지난 30일 큰 지출 TOP 5
          </h2>
          <div className="flex flex-col gap-2">
            {analysis.topItems.map((it, i) => (
              <div
                key={it.id}
                className="flex items-center gap-3 rounded-xl border border-line/60 bg-paper-card/50 p-3"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-warmgold/20 text-xs font-bold text-warmgold">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-ink">
                    {it.name}
                  </div>
                  <div className="text-[10px] font-medium text-ink-soft">
                    {EXPENSE_CATEGORY_LABELS[it.category ?? 'other']} · {it.date}
                  </div>
                </div>
                <div className="text-sm font-bold text-clay">
                  {formatKRW(it.amount)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Link
        href="/calendar"
        className="self-center text-xs font-bold text-warmgold hover:underline"
      >
        ← 캘린더로 돌아가기
      </Link>
    </div>
  );
}

function Thermometer({
  temp,
  primaryLabel,
  toneLabel,
  tone,
  hint,
  amount,
  avg,
}: {
  temp: number;
  primaryLabel: string;
  toneLabel: string;
  tone: 'sage' | 'warmgold' | 'honey' | 'clay';
  hint: string;
  amount: number;
  avg: number;
}) {
  const toneClasses = {
    sage: 'from-sage/30 to-sage/10 border-sage/40 text-sage',
    warmgold: 'from-warmgold/30 to-warmgold/10 border-warmgold/40 text-warmgold',
    honey: 'from-honey/30 to-honey/10 border-honey/40 text-honey',
    clay: 'from-clay/40 to-clay/10 border-clay/50 text-clay',
  }[tone];

  return (
    <section
      className={`rounded-3xl border bg-gradient-to-br p-6 backdrop-blur-md ${toneClasses}`}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">
        {primaryLabel}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-5xl font-bold text-ink">{temp}</div>
        <div className="text-2xl font-bold text-ink">°</div>
        <div className="ml-2 text-base font-bold">{toneLabel}</div>
      </div>
      <p className="mt-2 text-xs font-medium text-ink-soft">{hint}</p>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-line/40">
        <div
          className="h-full bg-gradient-to-r from-sage via-warmgold via-honey to-clay"
          style={{ width: `${Math.max(2, Math.min(100, temp))}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] font-medium text-ink-soft">
        <div>
          <div className="text-[10px]">오늘 지출</div>
          <div className="text-base font-bold text-ink">{formatKRW(amount)}</div>
        </div>
        <div>
          <div className="text-[10px]">최근 30일 일평균</div>
          <div className="text-base font-bold text-ink">
            {formatKRW(Math.round(avg))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniTemp({
  label,
  temp,
  tone,
  toneLabel,
  amount,
  subtext,
}: {
  label: string;
  temp: number;
  tone: 'sage' | 'warmgold' | 'honey' | 'clay';
  toneLabel: string;
  amount: number;
  subtext?: string;
}) {
  const dotClass =
    tone === 'sage'
      ? 'bg-sage'
      : tone === 'warmgold'
        ? 'bg-warmgold'
        : tone === 'honey'
          ? 'bg-honey'
          : 'bg-clay';
  const textClass =
    tone === 'sage'
      ? 'text-sage'
      : tone === 'warmgold'
        ? 'text-warmgold'
        : tone === 'honey'
          ? 'text-honey'
          : 'text-clay';
  return (
    <div className="rounded-2xl border border-line/60 bg-paper-card/50 p-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <div className="text-2xl font-bold text-ink">{temp}</div>
        <div className="text-base font-bold text-ink">°</div>
        <span className={`ml-1 flex items-center gap-1 text-[11px] font-bold ${textClass}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          {toneLabel}
        </span>
      </div>
      <div className="mt-1 text-xs font-bold text-ink">
        {formatKRWShort(amount)}원
      </div>
      {subtext && (
        <div className="mt-1 text-[10px] font-medium text-ink-soft">
          {subtext}
        </div>
      )}
    </div>
  );
}

function generateTips(analysis: ReturnType<typeof analyzeSpending>): string[] {
  const tips: string[] = [];

  if (analysis.todayTemperature >= 80) {
    tips.push(
      '오늘은 평소보다 훨씬 많이 쓰셨어요. 지금부터 24시간은 추가 지출 보류해보세요.'
    );
  }

  const food = analysis.categoryStats.find((c) => c.category === 'food');
  if (food && food.changeRatio > 0.3) {
    tips.push(
      `식비가 직전 30일보다 ${Math.round(food.changeRatio * 100)}% 늘었어요. 한 끼 도시락만 늘려도 한 달 큰 차이.`
    );
  }

  const sub = analysis.categoryStats.find((c) => c.category === 'subscription');
  if (sub && sub.total > 0) {
    tips.push(
      `구독료 ${formatKRW(sub.total)}원/월. 안 보는 OTT 1개만 끊어도 한 해 ${formatKRW(sub.total * 0.3 * 12)}원 절약.`
    );
  }

  const shop = analysis.categoryStats.find((c) => c.category === 'shopping');
  if (shop && shop.changeRatio > 0.5) {
    tips.push('쇼핑 지출이 급증했어요. 24시간 보류 규칙 한 번 적용해보세요.');
  }

  if (tips.length === 0) {
    tips.push('지출 흐름이 안정적이에요. 이 페이스 유지하시면 별빚 깨는 속도가 빨라집니다.');
    tips.push(
      '여유분이 생기면 부정 별빚(이율 10%↑) 부터 추가 상환에 사용해보세요.'
    );
  }

  return tips;
}
