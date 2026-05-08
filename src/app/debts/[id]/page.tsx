'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  loadDebt,
  loadPaymentsForDebt,
  recordPayment,
  removeDebt,
} from '@/lib/storage';
import {
  classify,
  CATEGORY_LABELS,
  CLASSIFICATION_LABELS,
  CLASSIFICATION_TONE,
} from '@/lib/classifier';
import {
  formatFrequency,
  formatKRW,
  formatKRWShort,
  formatPercent,
  paymentLabelForFrequency,
} from '@/lib/format';
import type { Debt, Payment } from '@/lib/types';

export default function DebtDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [debt, setDebt] = useState<Debt | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentInput, setPaymentInput] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [celebrating, setCelebrating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!id) return;
    setDebt(loadDebt(id));
    setPayments(loadPaymentsForDebt(id));
    setMounted(true);
  }, [id]);

  if (!mounted) {
    return <div className="h-40 animate-pulse rounded-3xl bg-paper-card/30" />;
  }

  if (!debt) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-medium text-ink-soft">별빚을 찾을 수 없어요.</p>
        <Link
          href="/debts"
          className="mt-4 inline-block rounded-full bg-warmgold px-5 py-2 text-xs font-bold text-ink"
        >
          목록으로
        </Link>
      </div>
    );
  }

  const cls = classify(debt);
  const tone = CLASSIFICATION_TONE[cls];

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const original = debt.originalAmount && debt.originalAmount > 0
    ? debt.originalAmount
    : debt.principal + totalPaid;
  const progress = original > 0
    ? Math.max(0, Math.min(1, 1 - debt.principal / original))
    : 0;
  const isPaidOff = debt.paidOff || debt.principal === 0;

  function handlePay() {
    const amount = Number(paymentInput.replace(/[^0-9]/g, ''));
    if (!amount || amount <= 0 || !debt) return;
    const result = recordPayment(debt.id, amount, paymentNote.trim() || undefined);
    if (!result) return;

    setDebt(result.debt);
    setPayments(loadPaymentsForDebt(debt.id));
    setPaymentInput('');
    setPaymentNote('');

    if (result.wasJustPaidOff) {
      setCelebrating(true);
    }
  }

  function handleDelete() {
    if (!debt) return;
    const ok = window.confirm(
      `"${debt.name}" 별빚을 정말 지우시겠어요?\n상환 기록도 함께 삭제되며 되돌릴 수 없어요.`
    );
    if (!ok) return;
    removeDebt(debt.id);
    router.push('/debts');
  }

  if (celebrating) {
    return <CelebrationView debt={debt} onDone={() => router.push('/debts')} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-sm font-medium text-ink-soft hover:text-ink"
        >
          ← 뒤로
        </button>
        <button
          onClick={handleDelete}
          className="text-xs font-medium text-clay/70 hover:text-clay"
        >
          삭제
        </button>
      </header>

      <section
        className={`rounded-3xl border border-line/60 bg-paper-card/60 p-6 ring-1 backdrop-blur-md ${tone.ring} ${tone.glow}`}
      >
        <div className="flex justify-center">
          <svg
            viewBox="0 0 100 100"
            className={`h-32 w-32 ${tone.text} ${isPaidOff ? 'star-glow' : 'star-drift'}`}
          >
            <polygon
              points="50,8 61,38 93,40 68,58 78,90 50,72 22,90 32,58 7,40 39,38"
              fill="currentColor"
              opacity={isPaidOff ? 0.85 : 0.3}
            />
            <polygon
              points="50,8 61,38 93,40 68,58 78,90 50,72 22,90 32,58 7,40 39,38"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
            />
          </svg>
        </div>

        <h1 className="mt-3 text-center text-xl font-bold text-ink">{debt.name}</h1>
        <div className="mt-1 flex justify-center gap-2 text-xs font-medium text-ink-soft">
          <span>{CATEGORY_LABELS[debt.category]}</span>
          <span>·</span>
          <span className={`font-bold ${tone.text}`}>
            {CLASSIFICATION_LABELS[cls]}
          </span>
        </div>

        <div className="mt-5">
          <div className="h-3 overflow-hidden rounded-full bg-line/40">
            <div
              className={`h-full transition-all duration-500 ${
                cls === 'good' ? 'bg-sage' : cls === 'neutral' ? 'bg-honey' : 'bg-clay'
              }`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs font-medium text-ink-soft">
            <span>갚은 금액 {formatKRW(totalPaid)}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="잔액" value={formatKRWShort(debt.principal) + '원'} />
          <Stat label="이율" value={formatPercent(debt.interestRate)} />
          <Stat
            label={paymentLabelForFrequency(debt.frequency ?? 'monthly').replace(' 상환', '').replace('1회 ', '')}
            value={formatKRWShort(debt.minPayment) + '원'}
          />
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-line/40 bg-paper/40 px-3 py-2 text-xs font-bold text-ink-soft">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{formatFrequency(debt)} 상환</span>
        </div>

        {debt.note && (
          <p className="mt-4 rounded-xl border border-line/40 bg-paper/40 p-3 text-xs leading-relaxed text-ink-soft">
            {debt.note}
          </p>
        )}
      </section>

      {!isPaidOff && (
        <section className="rounded-2xl border border-warmgold/40 bg-warmgold/10 p-5 backdrop-blur-md">
          <h2 className="text-sm font-bold text-ink">오늘 갚기</h2>
          <p className="mt-1 text-xs font-medium text-ink-soft">
            한 걸음씩, 도장에 금이 갑니다.
          </p>
          <div className="mt-4 flex gap-2">
            <input
              inputMode="numeric"
              value={paymentInput}
              onChange={(e) =>
                setPaymentInput(e.target.value.replace(/[^0-9]/g, ''))
              }
              placeholder="금액 (원)"
              className="flex-1 rounded-xl border border-line/60 bg-paper-card/80 px-3 py-2.5 text-sm font-bold text-ink placeholder:font-medium placeholder:text-ink-soft/60 focus:border-warmgold/60 focus:outline-none focus:ring-2 focus:ring-warmgold/20"
            />
            <button
              onClick={handlePay}
              disabled={!Number(paymentInput)}
              className="rounded-xl bg-warmgold px-5 py-2.5 text-sm font-bold text-ink disabled:opacity-40"
            >
              갚기
            </button>
          </div>
          <input
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            placeholder="메모 (선택)"
            className="mt-2 w-full rounded-xl border border-line/60 bg-paper-card/80 px-3 py-2 text-xs font-medium text-ink placeholder:text-ink-soft/60 focus:border-warmgold/60 focus:outline-none"
          />
          {Number(paymentInput) > 0 && (
            <p className="mt-2 text-[11px] font-medium text-ink-soft">
              {Number(paymentInput) >= debt.principal
                ? '✦ 이번에 도장이 깨집니다.'
                : `갚고 나면 잔액 ${formatKRW(debt.principal - Number(paymentInput))}`}
            </p>
          )}
        </section>
      )}

      {isPaidOff && (
        <section className="rounded-2xl border border-honey/40 bg-honey/10 p-5 text-center">
          <p className="text-sm font-bold text-ink">
            이 별빚은 이미 별빛이 되었습니다.
          </p>
          {debt.paidOffAt && (
            <p className="mt-1 text-xs font-medium text-ink-soft">
              {new Date(debt.paidOffAt).toLocaleDateString('ko-KR')}에 깨진 도장
            </p>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-bold text-ink">상환 기록</h2>
        {payments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line/60 p-4 text-center text-sm font-medium text-ink-soft">
            아직 기록이 없어요.<br />
            오늘이 첫 한 걸음입니다.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {payments.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-line/40 bg-paper-card/50 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-ink">
                    {formatKRW(p.amount)}
                  </div>
                  {p.note && (
                    <div className="truncate text-xs font-medium text-ink-soft">
                      {p.note}
                    </div>
                  )}
                </div>
                <span className="ml-3 shrink-0 text-xs font-medium text-ink-soft">
                  {new Date(p.date).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line/40 bg-paper/40 px-2 py-2 text-center">
      <div className="text-[10px] font-medium text-ink-soft">{label}</div>
      <div className="text-sm font-bold text-ink">{value}</div>
    </div>
  );
}

function CelebrationView({ debt, onDone }: { debt: Debt; onDone: () => void }) {
  return (
    <div className="flex flex-col items-center gap-7 py-16 text-center">
      <div className="relative h-44 w-44">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full text-warmgold seal-crack"
        >
          <polygon
            points="50,8 61,38 93,40 68,58 78,90 50,72 22,90 32,58 7,40 39,38"
            fill="currentColor"
            opacity={0.5}
          />
        </svg>
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full text-honey light-burst"
        >
          <circle cx="50" cy="50" r="45" fill="currentColor" opacity={0.5} />
        </svg>
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full text-honey star-glow"
          style={{ animationDelay: '0.8s' }}
        >
          <polygon
            points="50,8 61,38 93,40 68,58 78,90 50,72 22,90 32,58 7,40 39,38"
            fill="currentColor"
            opacity={0.85}
          />
        </svg>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-ink">별빛이 되었습니다</h2>
        <p className="mt-3 text-sm font-medium leading-relaxed text-ink-soft">
          “{debt.name}”<br />
          이 별빚이 우주에 빛으로 새겨졌어요.
        </p>
      </div>
      <button
        onClick={onDone}
        className="rounded-full bg-warmgold px-8 py-3 text-sm font-bold text-ink shadow-[0_4px_18px_rgba(184,149,108,0.3)]"
      >
        목록으로 돌아가기
      </button>
    </div>
  );
}
