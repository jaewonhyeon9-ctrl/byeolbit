'use client';

import Link from 'next/link';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import {
  loadDebts,
  loadExpenses,
  newId,
  saveExpenses,
} from '@/lib/storage';
import type { Debt, ExpenseCategory, ScheduledExpense } from '@/lib/types';
import { formatKRW, formatKRWShort } from '@/lib/format';
import {
  EXPENSE_CATEGORY_EMOJI,
  EXPENSE_CATEGORY_LABELS,
  isDebtDueOn,
} from '@/lib/expense';

const WEEK_HEADER = ['일', '월', '화', '수', '목', '금', '토'];

const CATEGORY_KEYS = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[];

interface DayItem {
  type: 'expense' | 'debt';
  id: string;
  name: string;
  amount: number;
  category?: ExpenseCategory;
  paid?: boolean;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve((result.split(',')[1] ?? ''));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function CalendarPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [expenses, setExpenses] = useState<ScheduledExpense[]>([]);
  const [mounted, setMounted] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('food');
  const [newPaid, setNewPaid] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [ocrPreview, setOcrPreview] = useState<{
    expenses: ExtractedExpense[];
    confidence: number;
    selected: boolean[];
  } | null>(null);

  useEffect(() => {
    setDebts(loadDebts());
    setExpenses(loadExpenses());
    setMounted(true);
  }, []);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, DayItem[]>();

    for (const e of expenses) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push({
        type: 'expense',
        id: e.id,
        name: e.name,
        amount: e.amount,
        category: e.category,
        paid: e.paid,
      });
    }

    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(cursor.year, cursor.month, day);
      const dateStr = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      for (const debt of debts) {
        if (isDebtDueOn(debt, date)) {
          if (!map.has(dateStr)) map.set(dateStr, []);
          map.get(dateStr)!.push({
            type: 'debt',
            id: debt.id,
            name: `${debt.name} (상환일)`,
            amount: debt.minPayment,
          });
        }
      }
    }

    return map;
  }, [expenses, debts, cursor]);

  const monthTotal = useMemo(() => {
    let sum = 0;
    const monthPrefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`;
    for (const [date, items] of itemsByDate.entries()) {
      if (date.startsWith(monthPrefix)) {
        sum += items.reduce((s, it) => s + it.amount, 0);
      }
    }
    return sum;
  }, [itemsByDate, cursor]);

  const cells = useMemo(() => {
    const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const out: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) out.push(null);
    for (let i = 1; i <= daysInMonth; i++) out.push(i);
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [cursor]);

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const date = new Date(c.year, c.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  function goToday() {
    const d = new Date();
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    setSelectedDate(d.toISOString().slice(0, 10));
  }

  function dateStrFor(day: number): string {
    return `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function persistExpenses(next: ScheduledExpense[]) {
    setExpenses(next);
    saveExpenses(next);
  }

  function addExpense() {
    if (!selectedDate || !newName.trim() || !Number(newAmount)) return;
    const next: ScheduledExpense[] = [
      ...expenses,
      {
        id: newId(),
        name: newName.trim(),
        amount: Number(newAmount),
        date: selectedDate,
        category: newCategory,
        paid: newPaid,
        source: 'manual',
      },
    ];
    persistExpenses(next);
    setNewName('');
    setNewAmount('');
  }

  function removeExpense(id: string) {
    persistExpenses(expenses.filter((e) => e.id !== id));
  }

  function togglePaid(id: string) {
    persistExpenses(
      expenses.map((e) => (e.id === id ? { ...e, paid: !e.paid } : e))
    );
  }

  async function handleOcrFile(file: File) {
    setOcrLoading(true);
    setOcrError('');
    setOcrPreview(null);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/ocr/extract-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: file.type }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `OCR 실패 (${res.status})`);
      }
      const data = (await res.json()) as {
        expenses: ExtractedExpense[];
        confidence: number;
      };
      const list = Array.isArray(data.expenses) ? data.expenses : [];
      setOcrPreview({
        expenses: list,
        confidence: data.confidence ?? 0,
        selected: list.map(() => true),
      });
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : 'OCR 실패');
    } finally {
      setOcrLoading(false);
    }
  }

  function handleOcrInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleOcrFile(file);
    e.target.value = '';
  }

  function importOcrSelected() {
    if (!ocrPreview || !selectedDate) return;
    const today = selectedDate;
    const newOnes: ScheduledExpense[] = ocrPreview.expenses
      .filter((_, i) => ocrPreview.selected[i])
      .map((it) => ({
        id: newId(),
        name: it.name,
        amount: it.amount,
        date: it.date && /^\d{4}-\d{2}-\d{2}$/.test(it.date) ? it.date : today,
        category: (it.category as ExpenseCategory | undefined) ?? 'other',
        paid: true,
        source: 'ocr',
      }));
    persistExpenses([...expenses, ...newOnes]);
    setOcrPreview(null);
  }

  if (!mounted) {
    return <div className="h-40 animate-pulse rounded-3xl bg-paper-card/30" />;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const selectedItems = selectedDate ? itemsByDate.get(selectedDate) ?? [] : [];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-ink">지출 캘린더</h1>
          <p className="mt-0.5 text-xs font-medium text-ink-soft">
            상환일 + 지출 한눈에
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/spending"
            className="rounded-full border border-clay/40 bg-clay/10 px-3 py-1 text-[11px] font-bold text-clay hover:bg-clay/20"
          >
            지출 온도
          </Link>
          <button
            type="button"
            onClick={goToday}
            className="rounded-full border border-warmgold/40 bg-warmgold/10 px-3 py-1 text-[11px] font-bold text-warmgold hover:bg-warmgold/20"
          >
            오늘
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-warmgold/40 bg-warmgold/5 p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleOcrInputChange}
          className="hidden"
        />
        {!ocrPreview && !ocrLoading && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-warmgold/40 px-4 py-4 text-warmgold hover:bg-warmgold/10"
          >
            <span className="text-sm font-bold">캡처에서 가계부 가져오기</span>
            <span className="text-[11px] font-medium text-ink-soft">
              토스·뱅크샐러드·카드 결제내역 캡처 → 자동 정리
            </span>
          </button>
        )}
        {ocrLoading && (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-warmgold/30 border-t-warmgold" />
            <p className="text-xs font-medium text-ink-soft">지출 읽는 중...</p>
          </div>
        )}
        {ocrError && (
          <div className="rounded-lg border border-clay/40 bg-clay/10 p-3 text-xs font-bold text-clay">
            {ocrError}
            <button
              onClick={() => setOcrError('')}
              className="ml-2 underline"
            >
              닫기
            </button>
          </div>
        )}
        {ocrPreview && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-ink">
                {ocrPreview.expenses.length}개 항목 발견
              </p>
              <span className="text-[10px] font-medium text-ink-soft">
                신뢰도 {Math.round(ocrPreview.confidence * 100)}%
              </span>
            </div>
            {ocrPreview.expenses.length === 0 ? (
              <p className="text-xs font-medium text-ink-soft">
                이미지에서 지출 항목을 찾을 수 없었어요. 더 또렷한 이미지로 다시 시도해주세요.
              </p>
            ) : (
              <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
                {ocrPreview.expenses.map((it, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-line/60 bg-paper-card/80 p-2"
                  >
                    <input
                      type="checkbox"
                      checked={ocrPreview.selected[i]}
                      onChange={() => {
                        const next = [...ocrPreview.selected];
                        next[i] = !next[i];
                        setOcrPreview({ ...ocrPreview, selected: next });
                      }}
                      className="h-4 w-4 accent-warmgold"
                    />
                    <span className="text-base">
                      {EXPENSE_CATEGORY_EMOJI[
                        (it.category as ExpenseCategory) ?? 'other'
                      ] ?? '·'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-ink">
                        {it.name}
                      </div>
                      <div className="text-[10px] font-medium text-ink-soft">
                        {EXPENSE_CATEGORY_LABELS[
                          (it.category as ExpenseCategory) ?? 'other'
                        ]}
                        {it.date ? ` · ${it.date}` : ''}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-ink">
                      {formatKRW(it.amount)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setOcrPreview(null)}
                className="flex-1 rounded-lg border border-line/60 py-2 text-xs font-bold text-ink-soft"
              >
                취소
              </button>
              <button
                onClick={importOcrSelected}
                disabled={
                  ocrPreview.expenses.length === 0 ||
                  !ocrPreview.selected.some(Boolean)
                }
                className="flex-[2] rounded-lg bg-warmgold py-2 text-xs font-bold text-ink disabled:opacity-40"
              >
                선택 항목 가져오기
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-line/60 bg-paper-card/50 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => shiftMonth(-1)}
            className="rounded-md p-2 text-ink-soft hover:bg-paper/60 hover:text-ink"
          >
            ‹
          </button>
          <div className="text-base font-bold text-ink">
            {cursor.year}년 {cursor.month + 1}월
          </div>
          <button
            onClick={() => shiftMonth(1)}
            className="rounded-md p-2 text-ink-soft hover:bg-paper/60 hover:text-ink"
          >
            ›
          </button>
        </div>

        <div className="mt-1 text-center text-[11px] font-medium text-ink-soft">
          이달 합계 {formatKRW(monthTotal)}
        </div>

        <div className="mt-3 grid grid-cols-7 gap-0.5 text-center text-[10px] font-bold text-ink-soft">
          {WEEK_HEADER.map((d, i) => (
            <div
              key={d}
              className={`pb-1 ${i === 0 ? 'text-clay' : ''} ${i === 6 ? 'text-warmgold' : ''}`}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={i} className="aspect-square" />;
            }
            const dateStr = dateStrFor(day);
            const dayItems = itemsByDate.get(dateStr) ?? [];
            const sum = dayItems.reduce((s, it) => s + it.amount, 0);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const dow = i % 7;
            const hasDebt = dayItems.some((it) => it.type === 'debt');
            const hasExpense = dayItems.some((it) => it.type === 'expense');
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(dateStr)}
                className={`flex aspect-square flex-col items-center justify-start rounded-lg p-1 text-[10px] font-bold transition-colors ${
                  isSelected
                    ? 'bg-warmgold text-ink ring-2 ring-warmgold'
                    : isToday
                      ? 'bg-warmgold/15 text-ink ring-1 ring-warmgold/40'
                      : 'hover:bg-paper/60'
                } ${dow === 0 && !isSelected && !isToday ? 'text-clay' : ''} ${dow === 6 && !isSelected && !isToday ? 'text-warmgold' : ''}`}
              >
                <span>{day}</span>
                {sum > 0 && (
                  <span
                    className={`mt-0.5 truncate text-[8px] font-bold ${
                      isSelected ? 'text-ink' : 'text-ink-soft'
                    }`}
                  >
                    {formatKRWShort(sum)}
                  </span>
                )}
                {(hasDebt || hasExpense) && (
                  <span className="mt-auto flex gap-0.5">
                    {hasDebt && <span className="h-1 w-1 rounded-full bg-clay" />}
                    {hasExpense && (
                      <span className="h-1 w-1 rounded-full bg-warmgold" />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex justify-center gap-3 text-[10px] font-medium text-ink-soft">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-clay" /> 상환일
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-warmgold" /> 지출
          </span>
        </div>
      </section>

      {selectedDate && (
        <section className="rounded-2xl border border-warmgold/40 bg-warmgold/5 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">
              {new Date(selectedDate).toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
            </h2>
            <span className="text-xs font-bold text-warmgold">
              {formatKRWShort(
                selectedItems.reduce((s, it) => s + it.amount, 0)
              )}
              원
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="지출 항목"
              className="flex-1 rounded-lg border border-line/60 bg-paper-card/80 px-3 py-2 text-sm font-bold text-ink placeholder:font-medium placeholder:text-ink-soft/60"
            />
            <input
              inputMode="numeric"
              value={newAmount}
              onChange={(e) =>
                setNewAmount(e.target.value.replace(/[^0-9]/g, ''))
              }
              placeholder="금액"
              className="w-24 rounded-lg border border-line/60 bg-paper-card/80 px-2 py-2 text-right text-sm font-bold text-ink placeholder:font-medium placeholder:text-ink-soft/60"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as ExpenseCategory)}
              className="flex-1 rounded-lg border border-line/60 bg-paper-card/80 px-2 py-2 text-xs font-bold text-ink"
            >
              {CATEGORY_KEYS.map((c) => (
                <option key={c} value={c} className="bg-paper text-ink">
                  {EXPENSE_CATEGORY_EMOJI[c]} {EXPENSE_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-ink">
              <input
                type="checkbox"
                checked={newPaid}
                onChange={(e) => setNewPaid(e.target.checked)}
                className="h-4 w-4 accent-warmgold"
              />
              완료
            </label>
            <button
              type="button"
              onClick={addExpense}
              disabled={!newName.trim() || !Number(newAmount)}
              className="rounded-lg bg-warmgold px-3 py-2 text-xs font-bold text-ink disabled:opacity-40"
            >
              추가
            </button>
          </div>

          <ul className="mt-3 flex flex-col gap-2">
            {selectedItems.length === 0 ? (
              <li className="rounded-lg border border-dashed border-line/60 px-3 py-4 text-center text-xs font-medium text-ink-soft">
                이 날짜엔 예정된 항목이 없어요.
              </li>
            ) : (
              selectedItems.map((it) => (
                <li
                  key={`${it.type}-${it.id}`}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                    it.type === 'debt'
                      ? 'border-clay/40 bg-clay/10'
                      : 'border-line/60 bg-paper-card/80'
                  }`}
                >
                  {it.type === 'expense' && (
                    <input
                      type="checkbox"
                      checked={!!it.paid}
                      onChange={() => togglePaid(it.id)}
                      className="h-4 w-4 accent-warmgold"
                    />
                  )}
                  <span className="text-base">
                    {it.type === 'debt'
                      ? '💳'
                      : EXPENSE_CATEGORY_EMOJI[it.category ?? 'other']}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-sm font-bold ${
                        it.paid && it.type === 'expense'
                          ? 'text-ink'
                          : it.type === 'expense'
                            ? 'text-ink-soft'
                            : 'text-ink'
                      }`}
                    >
                      {it.name}
                    </div>
                    <div className="text-[10px] font-medium text-ink-soft">
                      {it.type === 'debt'
                        ? '별빚 상환일'
                        : EXPENSE_CATEGORY_LABELS[it.category ?? 'other']}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-ink">
                    {formatKRW(it.amount)}
                  </div>
                  {it.type === 'expense' && (
                    <button
                      onClick={() => removeExpense(it.id)}
                      className="text-ink-soft/60 hover:text-clay"
                      aria-label="삭제"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>
        </section>
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

interface ExtractedExpense {
  name: string;
  amount: number;
  date?: string | null;
  category?: string | null;
}
