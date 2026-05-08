'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  classify,
  CATEGORY_LABELS,
  CLASSIFICATION_LABELS,
  CLASSIFICATION_DESCRIPTIONS,
  CLASSIFICATION_TONE,
} from '@/lib/classifier';
import { loadDebts, newId, saveDebts } from '@/lib/storage';
import type { Debt, DebtCategory, DebtClassification } from '@/lib/types';
import { formatKRWShort } from '@/lib/format';

const CATEGORY_OPTIONS = Object.keys(CATEGORY_LABELS) as DebtCategory[];

export default function NewDebtPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DebtCategory>('card');
  const [principal, setPrincipal] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [rate, setRate] = useState('');
  const [minPayment, setMinPayment] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [note, setNote] = useState('');
  const [overrideClass, setOverrideClass] = useState<DebtClassification | ''>('');
  const [submitting, setSubmitting] = useState(false);

  const principalN = Number(principal) || 0;
  const rateN = Number(rate) || 0;
  const minN = Number(minPayment) || 0;

  const auto = useMemo(
    () => classify({ category, interestRate: rateN, classification: undefined }),
    [category, rateN]
  );
  const finalClass = (overrideClass || auto) as DebtClassification;
  const tone = CLASSIFICATION_TONE[finalClass];

  const valid = name.trim().length > 0 && principalN > 0 && rateN >= 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    const debt: Debt = {
      id: newId(),
      name: name.trim(),
      category,
      principal: principalN,
      originalAmount: Number(originalAmount) || principalN,
      interestRate: rateN,
      minPayment: minN,
      classification: overrideClass || undefined,
      dueDay: Number(dueDay) || undefined,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
      paidOff: false,
    };
    const list = loadDebts();
    saveDebts([...list, debt]);
    router.push('/debts');
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-bold text-ink">새 별빚 새기기</h1>
        <p className="text-xs text-ink-soft">이 별빚이 곧 별빛이 됩니다.</p>
      </header>

      <Field label="이름" required>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 신한카드 카드론"
          className={inputCls}
          autoFocus
        />
      </Field>

      <Field label="종류">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as DebtCategory)}
          className={inputCls}
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c} className="bg-paper text-ink">
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="현재 잔액 (원)" required>
          <input
            inputMode="numeric"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="3000000"
            className={inputCls}
          />
          {principalN > 0 && (
            <span className="mt-1 text-[10px] text-ink-soft">
              ≈ {formatKRWShort(principalN)}원
            </span>
          )}
        </Field>
        <Field label="처음 빌린 금액 (선택)">
          <input
            inputMode="numeric"
            value={originalAmount}
            onChange={(e) => setOriginalAmount(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="동일하면 비워두세요"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="연 이율 (%)" required>
          <input
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="14.5"
            className={inputCls}
          />
        </Field>
        <Field label="월 최소 상환 (원)">
          <input
            inputMode="numeric"
            value={minPayment}
            onChange={(e) => setMinPayment(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="100000"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="매월 상환일 (선택, 1-31)">
        <input
          inputMode="numeric"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
          placeholder="25"
          className={inputCls}
        />
      </Field>

      <Field label="메모 (선택)">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="이 빚에 대해 기억할 것이 있나요?"
          rows={2}
          className={inputCls + ' resize-none'}
        />
      </Field>

      <section
        className={`rounded-2xl border border-line/60 bg-paper-card/40 p-4 ring-1 ${tone.ring}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-ink-soft">분류</div>
            <div className={`text-base font-bold ${tone.text}`}>
              {CLASSIFICATION_LABELS[finalClass]}
            </div>
          </div>
          <select
            value={overrideClass}
            onChange={(e) => setOverrideClass(e.target.value as DebtClassification | '')}
            className="rounded-md border border-line/60 bg-paper/40 px-2 py-1 text-xs text-ink"
          >
            <option value="" className="bg-paper">자동 ({CLASSIFICATION_LABELS[auto]})</option>
            <option value="good" className="bg-paper">긍정으로 지정</option>
            <option value="neutral" className="bg-paper">중립으로 지정</option>
            <option value="bad" className="bg-paper">부정으로 지정</option>
          </select>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          {CLASSIFICATION_DESCRIPTIONS[finalClass]}
        </p>
      </section>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-full border border-line/60 py-3 text-sm font-medium text-ink-soft hover:text-ink"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!valid || submitting}
          className="flex-[2] rounded-full bg-warmgold py-3 text-sm font-semibold text-ink transition-opacity disabled:opacity-40"
        >
          별빚 새기기
        </button>
      </div>
    </form>
  );
}

const inputCls =
  'w-full rounded-xl border border-line/60 bg-paper/40 px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 focus:border-warmgold/60 focus:outline-none focus:ring-2 focus:ring-warmgold/20';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-soft">
        {label}
        {required && <span className="ml-1 text-clay">*</span>}
      </span>
      {children}
    </label>
  );
}
