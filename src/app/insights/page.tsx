'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { INSIGHTS, getDailyInsight } from '@/lib/insights';
import { loadSettings } from '@/lib/storage';

export default function InsightsPage() {
  const [seed, setSeed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const s = loadSettings();
    setSeed(s.insightSeed);
    setStreak(s.insightStreak || 0);
    setMounted(true);
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const today_insight = getDailyInsight(seed, today);

  if (!mounted) {
    return <div className="h-40 animate-pulse rounded-3xl bg-paper-card/30" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-lg font-bold text-ink">오늘의 메시지</h1>
        <p className="text-xs text-ink-soft">
          {streak > 0 ? `${streak}일 연속 별빛 받는 중` : '오늘부터 별빛 모으기 시작'}
        </p>
      </header>

      <section className="rounded-3xl border border-warmgold/30 bg-gradient-to-br from-warmgold/20 via-paper-card/40 to-transparent p-6 backdrop-blur-md">
        <div className="text-[10px] uppercase tracking-widest text-warmgold">
          {today.replaceAll('-', '. ')}
        </div>
        <h2 className="mt-2 text-2xl font-bold leading-snug text-ink">
          {today_insight.title}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">{today_insight.body}</p>
        <div className="mt-6 rounded-2xl border border-honey/30 bg-honey/5 p-4">
          <div className="text-[10px] uppercase tracking-widest text-honey/80">확언</div>
          <p className="mt-1 text-base font-medium italic text-honey star-glow">
            “{today_insight.affirmation}”
          </p>
        </div>
      </section>

      <Link
        href="/principles"
        className="flex items-center justify-between rounded-2xl border border-line/60 bg-paper-card/50 p-4 hover:bg-paper-card/70"
      >
        <div>
          <div className="text-sm font-bold text-ink">내 원칙 15가지</div>
          <div className="mt-0.5 text-xs font-medium text-ink-soft">
            빚을 깨기 위해 나에게 거는 약속
          </div>
        </div>
        <span className="text-warmgold">→</span>
      </Link>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">전체 인사이트</h2>
          <span className="text-xs text-ink-soft">{INSIGHTS.length}개의 별빛</span>
        </div>
        <div className="flex flex-col gap-2">
          {INSIGHTS.map((it) => {
            const isToday = it.id === today_insight.id;
            return (
              <div
                key={it.id}
                className={`rounded-xl border p-3 backdrop-blur-sm ${
                  isToday
                    ? 'border-warmgold/40 bg-warmgold/10'
                    : 'border-line/50 bg-paper-card/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium text-ink">{it.title}</div>
                  {isToday && (
                    <span className="rounded-full bg-warmgold/20 px-2 py-0.5 text-[10px] text-warmgold">
                      오늘
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">{it.body}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
