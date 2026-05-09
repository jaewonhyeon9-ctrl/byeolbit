'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  INSIGHTS,
  INSIGHT_CATEGORY_LABELS,
  INSIGHT_CATEGORY_TONE,
  getDailyInsight,
  type InsightCategory,
} from '@/lib/insights';
import { loadSettings } from '@/lib/storage';

export default function InsightsPage() {
  const [seed, setSeed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<InsightCategory | 'all'>('all');

  useEffect(() => {
    const s = loadSettings();
    setSeed(s.insightSeed);
    setStreak(s.insightStreak || 0);
    setMounted(true);
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const today_insight = getDailyInsight(seed, today);

  const visibleInsights = useMemo(
    () => (filter === 'all' ? INSIGHTS : INSIGHTS.filter((it) => it.category === filter)),
    [filter]
  );

  const categories = Object.keys(INSIGHT_CATEGORY_LABELS) as InsightCategory[];

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

      <section>
        <h2 className="mb-2 text-sm font-bold text-ink">나만의 도구</h2>
        <div className="grid grid-cols-1 gap-2">
          <HubCard
            href="/principles"
            title="내 원칙 15가지"
            desc="빚을 깨기 위해 나에게 거는 약속"
            tone="warmgold"
          />
          <HubCard
            href="/routine"
            title="빚 줄이기 일과표"
            desc="매일 지킬 시간대별 루틴"
            tone="sage"
          />
          <HubCard
            href="/calendar"
            title="지출 캘린더"
            desc="OCR로 가계부 정리 + 상환일 표시"
            tone="honey"
          />
          <HubCard
            href="/spending"
            title="지출 온도"
            desc="평소 페이스 대비 오늘·이번주·이번달"
            tone="clay"
          />
          <HubCard
            href="/recovery"
            title="신용회복 길잡이"
            desc="워크아웃·개인회생·파산·무료 상담 창구"
            tone="warmgold"
          />
          <HubCard
            href="/mandalart"
            title="만다라트 → 매트릭스"
            desc="9×9 만다라트를 AI가 아이젠하워 4분면으로"
            tone="sage"
          />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">전체 인사이트</h2>
          <span className="text-xs font-medium text-ink-soft">
            {INSIGHTS.length}개의 별빛
          </span>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
              filter === 'all'
                ? 'border-ink/40 bg-ink/10 text-ink'
                : 'border-line/60 bg-paper-card/40 text-ink-soft hover:bg-paper-card/70'
            }`}
          >
            전체 {INSIGHTS.length}
          </button>
          {categories.map((cat) => {
            const tone = INSIGHT_CATEGORY_TONE[cat];
            const count = INSIGHTS.filter((it) => it.category === cat).length;
            const active = filter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                  active
                    ? `${tone.chip} ${tone.chipText}`
                    : 'border-line/60 bg-paper-card/40 text-ink-soft hover:bg-paper-card/70'
                }`}
              >
                {INSIGHT_CATEGORY_LABELS[cat]} {count}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          {visibleInsights.map((it) => {
            const isToday = it.id === today_insight.id;
            const tone = INSIGHT_CATEGORY_TONE[it.category];
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
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone.chip} ${tone.chipText}`}
                    >
                      {INSIGHT_CATEGORY_LABELS[it.category]}
                    </span>
                    <div className="text-sm font-medium text-ink">{it.title}</div>
                  </div>
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

function HubCard({
  href,
  title,
  desc,
  tone,
}: {
  href: string;
  title: string;
  desc: string;
  tone: 'warmgold' | 'sage' | 'honey' | 'clay';
}) {
  const toneClasses =
    tone === 'warmgold'
      ? 'border-warmgold/40 bg-warmgold/5 hover:bg-warmgold/10'
      : tone === 'sage'
        ? 'border-sage/40 bg-sage/5 hover:bg-sage/10'
        : tone === 'honey'
          ? 'border-honey/40 bg-honey/5 hover:bg-honey/10'
          : 'border-clay/40 bg-clay/5 hover:bg-clay/10';
  const arrowClass =
    tone === 'warmgold'
      ? 'text-warmgold'
      : tone === 'sage'
        ? 'text-sage'
        : tone === 'honey'
          ? 'text-honey'
          : 'text-clay';
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-2xl border p-4 ${toneClasses}`}
    >
      <div>
        <div className="text-sm font-bold text-ink">{title}</div>
        <div className="mt-0.5 text-xs font-medium text-ink-soft">{desc}</div>
      </div>
      <span className={arrowClass}>→</span>
    </Link>
  );
}
