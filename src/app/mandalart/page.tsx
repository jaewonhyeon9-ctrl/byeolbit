'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  countFilled,
  emptyState,
  getActions,
  getCellInfo,
  getMainGoal,
  getSubGoals,
  loadMandalart,
  MANDALART_SIZE,
  QUADRANT_GUIDES,
  QUADRANT_LABELS,
  QUADRANT_TONES,
  saveMandalart,
  setCell,
  type EisenhowerItem,
  type EisenhowerMatrix,
  type EisenhowerQuadrant,
  type MandalartState,
} from '@/lib/mandalart';

type BlockTone = 'warmgold' | 'sage' | 'honey' | 'clay' | 'center';

const BLOCK_TONES: BlockTone[] = [
  'warmgold',
  'sage',
  'honey',
  'clay',
  'center',
  'warmgold',
  'sage',
  'honey',
  'clay',
];

const TONE_BG: Record<BlockTone, string> = {
  warmgold: 'bg-warmgold/5',
  sage: 'bg-sage/5',
  honey: 'bg-honey/5',
  clay: 'bg-clay/5',
  center: 'bg-paper-card/40',
};

const TONE_TEXT: Record<BlockTone, string> = {
  warmgold: 'text-warmgold',
  sage: 'text-sage',
  honey: 'text-honey',
  clay: 'text-clay',
  center: 'text-ink',
};

const QUADRANTS: EisenhowerQuadrant[] = ['q1', 'q2', 'q3', 'q4'];

export default function MandalartPage() {
  const [state, setState] = useState<MandalartState>(emptyState);
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState<{ r: number; c: number } | null>(null);
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setState(loadMandalart());
    setMounted(true);
  }, []);

  const filled = useMemo(() => countFilled(state.cells), [state.cells]);
  const actionsCount = useMemo(() => getActions(state.cells).length, [state.cells]);

  function persist(next: MandalartState) {
    setState(next);
    saveMandalart(next);
  }

  function openEdit(r: number, c: number) {
    setDraft(state.cells[r]![c] ?? '');
    setEditing({ r, c });
  }

  function commitEdit() {
    if (!editing) return;
    const { r, c } = editing;
    const nextCells = setCell(state.cells, r, c, draft.trim());
    persist({ ...state, cells: nextCells });
    setEditing(null);
  }

  function clearEdit() {
    if (!editing) return;
    const { r, c } = editing;
    const nextCells = setCell(state.cells, r, c, '');
    persist({ ...state, cells: nextCells });
    setEditing(null);
  }

  function clearAll() {
    const ok = window.confirm(
      '만다라트와 분류 결과를 모두 비우시겠어요? 되돌릴 수 없어요.'
    );
    if (!ok) return;
    persist(emptyState());
  }

  async function generateMatrix() {
    setError(null);
    setGenerating(true);
    try {
      const mainGoal = getMainGoal(state.cells);
      const subGoals = getSubGoals(state.cells);
      const actions = getActions(state.cells).map((a) => ({
        text: a.text,
        subGoal: a.subGoal,
      }));

      if (actions.length === 0) {
        setError('실행 항목을 먼저 채워주세요. 바깥 칸들이 비어있어요.');
        return;
      }

      const res = await fetch('/api/ai/eisenhower', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mainGoal, subGoals, actions }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? `요청 실패 (${res.status})`);
        return;
      }

      const data = (await res.json()) as {
        matrix: EisenhowerMatrix;
        generatedAt: string;
      };
      persist({ ...state, matrix: data.matrix, generatedAt: data.generatedAt });
    } catch (e) {
      setError(e instanceof Error ? e.message : '분류 요청 실패');
    } finally {
      setGenerating(false);
    }
  }

  if (!mounted) {
    return <div className="h-40 animate-pulse rounded-3xl bg-paper-card/30" />;
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link href="/insights" className="text-xs text-ink-soft hover:text-ink">
          ← 오늘
        </Link>
        <h1 className="mt-2 text-lg font-bold text-ink">만다라트 → 매트릭스</h1>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">
          가운데에 핵심 목표를 적고, 둘러싼 8칸에 세부 목표를 적은 뒤 바깥 64칸에
          실행 항목을 채우세요. 다 채우면 AI가 아이젠하워 매트릭스(긴급/중요 4분면)로
          자동 분류해요.
        </p>
      </header>

      <section className="rounded-2xl border border-line/60 bg-paper-card/30 p-3">
        <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-ink-soft">
          <span>
            채운 칸 <span className="text-ink">{filled}</span>/81
          </span>
          <span>
            실행 항목 <span className="text-ink">{actionsCount}</span>/64
          </span>
        </div>
        <div className="overflow-x-auto">
          <div
            className="grid gap-px rounded-lg bg-ink/15 p-px"
            style={{ gridTemplateColumns: `repeat(${MANDALART_SIZE}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: MANDALART_SIZE * MANDALART_SIZE }, (_, idx) => {
              const r = Math.floor(idx / MANDALART_SIZE);
              const c = idx % MANDALART_SIZE;
              const info = getCellInfo(r, c);
              const tone = BLOCK_TONES[info.blockIndex] ?? 'warmgold';
              const value = state.cells[r]![c] ?? '';
              const isMain = info.role === 'main';
              const isSub = info.role === 'subGoal' || info.role === 'subGoalMirror';

              const baseBg = isMain
                ? 'bg-warmgold/30'
                : isSub
                  ? 'bg-paper-card/80'
                  : TONE_BG[tone];
              const textColor = isMain
                ? 'text-ink'
                : isSub
                  ? 'text-ink'
                  : value
                    ? 'text-ink'
                    : `${TONE_TEXT[tone]}/40`;
              const border =
                isMain || isSub
                  ? 'ring-1 ring-inset ring-warmgold/30'
                  : '';

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => openEdit(r, c)}
                  className={`aspect-square min-h-[42px] overflow-hidden p-0.5 text-center text-[9px] leading-tight font-medium transition-colors hover:opacity-80 ${baseBg} ${textColor} ${border}`}
                  aria-label={cellAriaLabel(info, value)}
                >
                  <span className="line-clamp-3 break-keep">
                    {value || (isMain ? '핵심' : isSub ? '세부' : '+')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={generateMatrix}
            disabled={generating || actionsCount === 0}
            className="w-full rounded-xl bg-warmgold px-4 py-3 text-sm font-bold text-ink transition disabled:opacity-40"
          >
            {generating
              ? '분류 중…'
              : `AI로 아이젠하워 매트릭스 만들기 (${actionsCount}개 항목)`}
          </button>
          {error && (
            <div className="rounded-lg border border-clay/50 bg-clay/10 px-3 py-2 text-xs font-medium text-clay">
              {error}
            </div>
          )}
          {filled > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="self-center text-[11px] font-bold text-clay/70 hover:text-clay"
            >
              만다라트 모두 비우기
            </button>
          )}
        </div>
      </section>

      {state.matrix && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold text-ink">아이젠하워 매트릭스</h2>
            {state.generatedAt && (
              <span className="text-[10px] font-medium text-ink-soft">
                {formatTimestamp(state.generatedAt)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {QUADRANTS.map((q) => (
              <QuadrantCard key={q} quadrant={q} items={state.matrix![q]} />
            ))}
          </div>
          <p className="text-[11px] leading-relaxed text-ink-soft">
            ⚠ AI 분류는 참고용이에요. 본인 사정을 가장 잘 아는 건 본인입니다 — 결과를
            보고 직접 우선순위를 조정하세요.
          </p>
        </section>
      )}

      {editing && (
        <CellEditor
          info={getCellInfo(editing.r, editing.c)}
          value={draft}
          onChange={setDraft}
          onSave={commitEdit}
          onClear={clearEdit}
          onCancel={() => setEditing(null)}
        />
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

function QuadrantCard({
  quadrant,
  items,
}: {
  quadrant: EisenhowerQuadrant;
  items: EisenhowerItem[];
}) {
  const tone = QUADRANT_TONES[quadrant];
  return (
    <article className={`rounded-2xl border ${tone.border} ${tone.bg} p-3`}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className={`text-sm font-bold ${tone.text}`}>{QUADRANT_LABELS[quadrant]}</h3>
        <span className="text-[10px] font-bold text-ink-soft">{items.length}개</span>
      </div>
      <p className="mt-0.5 text-[10px] leading-relaxed text-ink-soft">
        {QUADRANT_GUIDES[quadrant]}
      </p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.length === 0 ? (
          <li className="rounded-lg border border-dashed border-line/50 px-2 py-3 text-center text-[11px] text-ink-soft/70">
            해당 항목이 없어요
          </li>
        ) : (
          items.map((it, i) => (
            <li
              key={`${it.text}-${i}`}
              className="rounded-lg border border-line/40 bg-paper-card/40 px-2.5 py-1.5"
            >
              <div className="text-xs font-bold text-ink">{it.text}</div>
              {it.reason && (
                <div className="mt-0.5 text-[10px] text-ink-soft">{it.reason}</div>
              )}
            </li>
          ))
        )}
      </ul>
    </article>
  );
}

function CellEditor({
  info,
  value,
  onChange,
  onSave,
  onClear,
  onCancel,
}: {
  info: ReturnType<typeof getCellInfo>;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onClear: () => void;
  onCancel: () => void;
}) {
  const role =
    info.role === 'main'
      ? '핵심 목표'
      : info.role === 'subGoal'
        ? `세부 목표 ${(info.subGoalIndex ?? 0) + 1}`
        : info.role === 'subGoalMirror'
          ? `세부 목표 ${(info.subGoalIndex ?? 0) + 1} (연결됨)`
          : '실행 항목';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-line/60 bg-paper p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[10px] uppercase tracking-widest text-warmgold">
          {role}
        </div>
        <textarea
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              onSave();
            }
            if (e.key === 'Escape') onCancel();
          }}
          rows={3}
          maxLength={200}
          placeholder={
            info.role === 'main'
              ? '예: 별빚 4억 갚기, 신용 회복'
              : info.role === 'subGoal' || info.role === 'subGoalMirror'
                ? '예: 소비 통제, 부수입 만들기'
                : '예: 매일 영수증 OCR로 가계부 정리'
          }
          className="mt-2 w-full rounded-xl border border-line/60 bg-paper-card/80 px-3 py-2 text-sm font-medium text-ink placeholder:text-ink-soft/50 focus:border-warmgold/60 focus:outline-none"
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-line/60 bg-paper-card/40 py-2.5 text-sm font-bold text-ink-soft"
          >
            취소
          </button>
          {value && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-xl border border-clay/40 bg-clay/5 px-4 py-2.5 text-sm font-bold text-clay"
            >
              비우기
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            className="flex-1 rounded-xl bg-warmgold py-2.5 text-sm font-bold text-ink"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

function cellAriaLabel(
  info: ReturnType<typeof getCellInfo>,
  value: string
): string {
  const role =
    info.role === 'main'
      ? '핵심 목표'
      : info.role === 'subGoal' || info.role === 'subGoalMirror'
        ? `세부 목표 ${(info.subGoalIndex ?? 0) + 1}`
        : '실행 항목';
  return value ? `${role}: ${value}` : `${role} (비어있음)`;
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return sameDay
      ? `오늘 ${hh}:${mm}`
      : `${d.getMonth() + 1}월 ${d.getDate()}일 ${hh}:${mm}`;
  } catch {
    return '';
  }
}
