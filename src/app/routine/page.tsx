'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { loadRoutine, newId, ROUTINE_EXAMPLES, saveRoutine } from '@/lib/storage';
import type { RoutineItem } from '@/lib/types';

export default function RoutinePage() {
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [newTime, setNewTime] = useState('09:00');
  const [newActivity, setNewActivity] = useState('');

  useEffect(() => {
    setItems(loadRoutine());
    setMounted(true);
  }, []);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.time.localeCompare(b.time)),
    [items]
  );

  function persist(next: RoutineItem[]) {
    setItems(next);
    saveRoutine(next);
  }

  function add() {
    if (!newActivity.trim()) return;
    const item: RoutineItem = {
      id: newId(),
      time: newTime || '09:00',
      activity: newActivity.trim(),
    };
    persist([...items, item]);
    setNewActivity('');
  }

  function update(id: string, patch: Partial<RoutineItem>) {
    persist(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function remove(id: string) {
    persist(items.filter((i) => i.id !== id));
  }

  function fillExamples() {
    const ok = window.confirm(
      '예시 루틴 7가지로 채우시겠어요?\n\n현재 일과표는 모두 사라지니 비어있는 상태에서 진행하세요.'
    );
    if (!ok) return;
    const examples: RoutineItem[] = ROUTINE_EXAMPLES.map((e) => ({
      id: newId(),
      time: e.time,
      activity: e.activity,
    }));
    persist(examples);
  }

  function clearAllItems() {
    const ok = window.confirm('일과표를 모두 비우시겠어요?');
    if (!ok) return;
    persist([]);
  }

  if (!mounted) {
    return <div className="h-40 animate-pulse rounded-3xl bg-paper-card/30" />;
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-bold text-ink">빚 줄이기 일과표</h1>
        <p className="mt-1 text-xs font-medium text-ink-soft">
          매일 지킬 루틴을 시간대별로 적어두세요. 작은 반복이 빚을 깹니다.
        </p>
      </header>

      <section className="rounded-2xl border border-warmgold/40 bg-warmgold/5 p-4">
        <h2 className="text-xs font-bold text-warmgold">새 일과 추가</h2>
        <div className="mt-3 flex gap-2">
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="w-24 rounded-lg border border-line/60 bg-paper-card/80 px-2 py-2 text-sm font-bold text-ink"
          />
          <input
            type="text"
            value={newActivity}
            onChange={(e) => setNewActivity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            placeholder="예: 별빚도장 앱 열고 오늘 인사이트 보기"
            className="flex-1 rounded-lg border border-line/60 bg-paper-card/80 px-3 py-2 text-sm font-bold text-ink placeholder:font-medium placeholder:text-ink-soft/60"
          />
          <button
            type="button"
            onClick={add}
            disabled={!newActivity.trim()}
            className="rounded-lg bg-warmgold px-3 py-2 text-sm font-bold text-ink disabled:opacity-40"
          >
            추가
          </button>
        </div>
        {items.length === 0 && (
          <button
            type="button"
            onClick={fillExamples}
            className="mt-3 w-full rounded-full border border-warmgold/40 bg-paper-card/60 py-1.5 text-[11px] font-bold text-warmgold hover:bg-warmgold/10"
          >
            예시 루틴 7가지로 시작하기
          </button>
        )}
      </section>

      <section className="flex flex-col gap-2">
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line/60 p-8 text-center">
            <p className="text-sm font-medium text-ink-soft">
              아직 일과가 없어요.<br />
              하루 한 가지부터 적어보세요.
            </p>
          </div>
        ) : (
          sorted.map((item) => (
            <RoutineRow
              key={item.id}
              item={item}
              onChange={(p) => update(item.id, p)}
              onDelete={() => remove(item.id)}
            />
          ))
        )}
      </section>

      {sorted.length > 0 && (
        <button
          type="button"
          onClick={clearAllItems}
          className="self-center text-[11px] font-bold text-clay/70 hover:text-clay"
        >
          일과표 모두 비우기
        </button>
      )}

      <Link
        href="/insights"
        className="self-center text-xs font-bold text-warmgold hover:underline"
      >
        ← 오늘의 메시지
      </Link>
    </div>
  );
}

function RoutineRow({
  item,
  onChange,
  onDelete,
}: {
  item: RoutineItem;
  onChange: (p: Partial<RoutineItem>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line/60 bg-paper-card/50 p-3">
      <input
        type="time"
        value={item.time}
        onChange={(e) => onChange({ time: e.target.value })}
        className="w-20 shrink-0 rounded-md border border-line/40 bg-paper/40 px-2 py-1 text-xs font-bold text-warmgold"
      />
      <input
        type="text"
        value={item.activity}
        onChange={(e) => onChange({ activity: e.target.value })}
        className="flex-1 bg-transparent text-sm font-bold text-ink focus:outline-none"
      />
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 rounded-md p-1.5 text-ink-soft/60 hover:bg-clay/10 hover:text-clay"
        aria-label="삭제"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
