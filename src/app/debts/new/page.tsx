'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  classify,
  CATEGORY_LABELS,
  CLASSIFICATION_LABELS,
  CLASSIFICATION_DESCRIPTIONS,
  CLASSIFICATION_TONE,
} from '@/lib/classifier';
import { loadDebts, newId, saveDebts } from '@/lib/storage';
import type {
  Debt,
  DebtCategory,
  DebtClassification,
  RepaymentFrequency,
} from '@/lib/types';
import { formatKRWShort, paymentLabelForFrequency } from '@/lib/format';

const CATEGORY_OPTIONS = Object.keys(CATEGORY_LABELS) as DebtCategory[];

const FREQUENCY_OPTIONS: { value: RepaymentFrequency; label: string; hint: string }[] = [
  { value: 'monthly', label: '매월', hint: '대부분의 대출·카드 대금' },
  { value: 'weekly', label: '매주', hint: '주간 자동이체 등' },
  { value: 'daily', label: '매일', hint: '주말 포함 매일' },
  { value: 'banking', label: '영업일', hint: '평일만 (월~금)' },
];

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export default function NewDebtPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DebtCategory>('card');
  const [principal, setPrincipal] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [rate, setRate] = useState('');
  const [minPayment, setMinPayment] = useState('');
  const [frequency, setFrequency] = useState<RepaymentFrequency>('monthly');
  const [dueDay, setDueDay] = useState('');
  const [weekDay, setWeekDay] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [overrideClass, setOverrideClass] = useState<DebtClassification | ''>('');
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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

  async function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setOcrError('');
    setOcrConfidence(null);
    setOcrLoading(true);

    try {
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/ocr/extract-debt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: file.type }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `OCR 실패 (${res.status})`);
      }
      const data = (await res.json()) as ExtractedDebt;

      if (data.name) setName(data.name);
      if (data.category && CATEGORY_OPTIONS.includes(data.category as DebtCategory)) {
        setCategory(data.category as DebtCategory);
      }
      if (data.principal != null) setPrincipal(String(data.principal));
      if (data.originalAmount != null) setOriginalAmount(String(data.originalAmount));
      if (data.interestRate != null) setRate(String(data.interestRate));
      if (data.minPayment != null) setMinPayment(String(data.minPayment));
      if (data.dueDay != null) {
        setDueDay(String(data.dueDay));
        setFrequency('monthly');
      }
      if (data.note) setNote(data.note);

      setOcrConfidence(data.confidence ?? null);
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : 'OCR 실패');
    } finally {
      setOcrLoading(false);
    }
  }

  function clearOcr() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setOcrConfidence(null);
    setOcrError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

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
      frequency,
      dueDay: frequency === 'monthly' && dueDay ? Number(dueDay) : undefined,
      weekDay: frequency === 'weekly' && weekDay != null ? weekDay : undefined,
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
        <p className="text-xs font-medium text-ink-soft">이 별빚이 곧 별빛이 됩니다.</p>
      </header>

      <section className="rounded-2xl border border-warmgold/40 bg-warmgold/5 p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!previewUrl && !ocrLoading && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-warmgold/40 px-4 py-5 text-warmgold hover:bg-warmgold/10"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span className="text-sm font-bold">캡처에서 자동 입력</span>
            <span className="text-[11px] font-medium text-ink-soft">
              은행·카드사 앱 화면을 올려주세요
            </span>
          </button>
        )}

        {ocrLoading && (
          <div className="flex flex-col items-center gap-2 py-5">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-warmgold/30 border-t-warmgold" />
            <p className="text-xs font-medium text-ink-soft">별빚을 읽고 있어요...</p>
          </div>
        )}

        {previewUrl && !ocrLoading && (
          <div className="flex gap-3">
            <img
              src={previewUrl}
              alt="업로드한 캡처"
              className="h-20 w-20 shrink-0 rounded-lg border border-line/60 object-cover"
            />
            <div className="min-w-0 flex-1">
              {ocrError ? (
                <>
                  <p className="text-sm font-bold text-clay">읽기 실패</p>
                  <p className="mt-1 text-xs font-medium text-ink-soft">{ocrError}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-ink">자동 입력 완료</p>
                  {ocrConfidence != null && (
                    <p className="mt-1 text-xs font-medium text-ink-soft">
                      신뢰도 {Math.round(ocrConfidence * 100)}% — 아래 값 확인해주세요
                    </p>
                  )}
                </>
              )}
              <div className="mt-2 flex gap-3 text-[11px] font-bold">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-warmgold hover:underline">
                  다른 이미지
                </button>
                <button type="button" onClick={clearOcr} className="text-ink-soft hover:text-ink">
                  초기화
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <Field label="이름" required>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 신한카드 카드론"
          className={inputCls}
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
            <span className="mt-1 text-[10px] font-medium text-ink-soft">
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
        <Field label={`${paymentLabelForFrequency(frequency)} (원)`}>
          <input
            inputMode="numeric"
            value={minPayment}
            onChange={(e) => setMinPayment(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="100000"
            className={inputCls}
          />
        </Field>
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-line/60 bg-paper-card/40 p-4">
        <div>
          <div className="text-xs font-bold text-ink-soft">상환 주기</div>
          <p className="mt-0.5 text-[11px] font-medium text-ink-soft/80">
            얼마나 자주 갚을 빚인가요?
          </p>
        </div>

        <div className="flex gap-1 rounded-full border border-line/60 bg-paper/50 p-1">
          {FREQUENCY_OPTIONS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFrequency(f.value)}
              className={`flex-1 rounded-full py-1.5 text-xs font-bold transition-colors ${
                frequency === f.value
                  ? 'bg-warmgold text-ink'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] font-medium text-ink-soft">
          {FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.hint}
        </p>

        {frequency === 'monthly' && (
          <Field label="매월 상환일 (1-31, 선택)">
            <input
              inputMode="numeric"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
              placeholder="25"
              className={inputCls}
            />
          </Field>
        )}

        {frequency === 'weekly' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-ink-soft">매주 어느 요일?</span>
            <div className="flex gap-1">
              {WEEK_DAYS.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setWeekDay(i)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-bold transition-colors ${
                    weekDay === i
                      ? 'border-warmgold bg-warmgold text-ink'
                      : 'border-line/60 bg-paper/50 text-ink-soft hover:text-ink'
                  } ${i === 0 ? 'text-clay' : ''} ${i === 6 ? 'text-warmgold' : ''} ${
                    weekDay === i ? '!text-ink' : ''
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

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
            <div className="text-[10px] font-medium uppercase tracking-widest text-ink-soft">
              분류
            </div>
            <div className={`text-base font-bold ${tone.text}`}>
              {CLASSIFICATION_LABELS[finalClass]}
            </div>
          </div>
          <select
            value={overrideClass}
            onChange={(e) => setOverrideClass(e.target.value as DebtClassification | '')}
            className="rounded-md border border-line/60 bg-paper/40 px-2 py-1 text-xs font-medium text-ink"
          >
            <option value="" className="bg-paper">자동 ({CLASSIFICATION_LABELS[auto]})</option>
            <option value="good" className="bg-paper">긍정으로 지정</option>
            <option value="neutral" className="bg-paper">중립으로 지정</option>
            <option value="bad" className="bg-paper">부정으로 지정</option>
          </select>
        </div>
        <p className="mt-2 text-xs font-medium leading-relaxed text-ink-soft">
          {CLASSIFICATION_DESCRIPTIONS[finalClass]}
        </p>
      </section>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-full border border-line/60 py-3 text-sm font-bold text-ink-soft hover:text-ink"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!valid || submitting}
          className="flex-[2] rounded-full bg-warmgold py-3 text-sm font-bold text-ink transition-opacity disabled:opacity-40"
        >
          별빚 새기기
        </button>
      </div>
    </form>
  );
}

interface ExtractedDebt {
  name?: string | null;
  category?: string | null;
  principal?: number | null;
  originalAmount?: number | null;
  interestRate?: number | null;
  minPayment?: number | null;
  dueDay?: number | null;
  note?: string | null;
  confidence?: number | null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Part = result.split(',')[1] ?? '';
      resolve(base64Part);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const inputCls =
  'w-full rounded-xl border border-line/60 bg-paper/50 px-3 py-2.5 text-sm font-bold text-ink placeholder:font-medium placeholder:text-ink-soft/50 focus:border-warmgold/60 focus:outline-none focus:ring-2 focus:ring-warmgold/20';

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
      <span className="text-xs font-bold text-ink-soft">
        {label}
        {required && <span className="ml-1 text-clay">*</span>}
      </span>
      {children}
    </label>
  );
}
