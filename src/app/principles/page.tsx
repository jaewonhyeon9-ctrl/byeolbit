'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  loadPrinciples,
  PRINCIPLE_COUNT,
  PRINCIPLE_EXAMPLES,
  savePrinciples,
} from '@/lib/storage';

export default function PrinciplesPage() {
  const [items, setItems] = useState<string[]>(() => Array(PRINCIPLE_COUNT).fill(''));
  const [mounted, setMounted] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setItems(loadPrinciples());
    setMounted(true);
  }, []);

  const filled = useMemo(() => items.filter((s) => s.trim().length > 0).length, [items]);

  function update(i: number, text: string) {
    const next = [...items];
    next[i] = text;
    setItems(next);
    savePrinciples(next);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1200);
  }

  function fillExamples() {
    const ok = window.confirm(
      '예시 15가지로 채우시겠어요?\n\n현재 작성한 내용이 있으면 덮어써집니다.\n예시는 영감용이니 본인 말로 다시 다듬으셔도 좋아요.'
    );
    if (!ok) return;
    const next = [...PRINCIPLE_EXAMPLES];
    setItems(next);
    savePrinciples(next);
  }

  function clearAll() {
    const ok = window.confirm('15가지 원칙을 모두 비우시겠어요?');
    if (!ok) return;
    const next = Array(PRINCIPLE_COUNT).fill('');
    setItems(next);
    savePrinciples(next);
  }

  if (!mounted) {
    return <div className="h-40 animate-pulse rounded-3xl bg-paper-card/30" />;
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-bold text-ink">내 원칙 15가지</h1>
        <p className="mt-1 text-xs font-medium text-ink-soft">
          빚을 깨기 위해 나에게 거는 약속. 한 번 정하면 매일 지킨다.
        </p>
      </header>

      <section className="rounded-2xl border border-warmgold/40 bg-warmgold/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-warmgold">
              작성 진행
            </div>
            <div className="mt-0.5 text-base font-bold text-ink">
              {filled} / {PRINCIPLE_COUNT}
            </div>
          </div>
          <div
            className={`text-xs font-bold transition-opacity ${
              savedFlash ? 'opacity-100 text-sage' : 'opacity-0'
            }`}
          >
            ✦ 저장됨
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-line/40">
          <div
            className="h-full bg-warmgold transition-all duration-500"
            style={{ width: `${(filled / PRINCIPLE_COUNT) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={fillExamples}
            className="flex-1 rounded-full border border-warmgold/40 bg-paper-card/60 py-1.5 text-[11px] font-bold text-warmgold hover:bg-warmgold/10"
          >
            예시로 채우기
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="flex-1 rounded-full border border-line/60 py-1.5 text-[11px] font-bold text-ink-soft hover:text-clay"
          >
            전부 비우기
          </button>
        </div>
      </section>

      <ol className="flex flex-col gap-3">
        {items.map((value, i) => {
          const placeholder = PRINCIPLE_EXAMPLES[i] ?? '예: 매일 한 걸음만 본다';
          const filledThis = value.trim().length > 0;
          return (
            <li
              key={i}
              className={`flex gap-3 rounded-2xl border p-3 transition-colors ${
                filledThis
                  ? 'border-warmgold/40 bg-paper-card/60'
                  : 'border-line/60 bg-paper/40'
              }`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  filledThis
                    ? 'bg-warmgold text-ink'
                    : 'bg-line/60 text-ink-soft'
                }`}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <textarea
                value={value}
                onChange={(e) => update(i, e.target.value)}
                placeholder={placeholder}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm font-bold leading-relaxed text-ink placeholder:font-medium placeholder:text-ink-soft/50 focus:outline-none"
                style={{ minHeight: '1.5em' }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = el.scrollHeight + 'px';
                }}
              />
            </li>
          );
        })}
      </ol>

      <section className="rounded-2xl border border-line/40 bg-paper/30 p-4 text-center">
        <p className="text-xs font-medium leading-relaxed text-ink-soft">
          한 번에 다 채우지 않으셔도 돼요.<br />
          3가지부터 시작해서, 살면서 다듬어가는 게 진짜 원칙입니다.
        </p>
        <Link
          href="/insights"
          className="mt-3 inline-block text-xs font-bold text-warmgold hover:underline"
        >
          오늘의 메시지 보러가기 →
        </Link>
      </section>
    </div>
  );
}
