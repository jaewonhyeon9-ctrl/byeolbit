'use client';

import Link from 'next/link';
import type { Debt } from '@/lib/types';
import {
  classify,
  CATEGORY_LABELS,
  CLASSIFICATION_LABELS,
  CLASSIFICATION_TONE,
} from '@/lib/classifier';
import { formatKRW, formatPercent } from '@/lib/format';

interface Props {
  debt: Debt;
}

export function DebtCard({ debt }: Props) {
  const cls = classify(debt);
  const tone = CLASSIFICATION_TONE[cls];

  return (
    <Link
      href={`/debts/${debt.id}`}
      className={`flex w-full flex-col gap-2 rounded-2xl border border-line/60 bg-paper-card/60 p-4 text-left ring-1 backdrop-blur-sm transition-colors hover:bg-paper-card/80 ${tone.ring}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-ink">{debt.name}</div>
          <div className="text-[11px] font-medium text-ink-soft">
            {CATEGORY_LABELS[debt.category]}
          </div>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${tone.chip} ${tone.chipText}`}
        >
          {CLASSIFICATION_LABELS[cls]}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-[10px] font-medium text-ink-soft">잔액</div>
          <div className={`text-base font-bold ${tone.text}`}>
            {formatKRW(debt.principal)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-medium text-ink-soft">이율</div>
          <div className="text-sm font-bold text-ink">{formatPercent(debt.interestRate)}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-medium text-ink-soft">월 최소</div>
          <div className="text-sm font-bold text-ink">{formatKRW(debt.minPayment)}</div>
        </div>
      </div>
    </Link>
  );
}
