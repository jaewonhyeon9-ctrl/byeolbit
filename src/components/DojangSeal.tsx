'use client';

import Link from 'next/link';
import type { Debt } from '@/lib/types';
import { classify, CLASSIFICATION_TONE } from '@/lib/classifier';
import { formatKRWShort } from '@/lib/format';

interface Props {
  debt: Debt;
}

export function DojangSeal({ debt }: Props) {
  const cls = classify(debt);
  const tone = CLASSIFICATION_TONE[cls];

  const original = debt.originalAmount && debt.originalAmount > 0 ? debt.originalAmount : 0;
  const progress = original > 0 ? Math.max(0, Math.min(1, 1 - debt.principal / original)) : 0;

  return (
    <Link
      href={`/debts/${debt.id}`}
      className={`group relative flex aspect-square w-full flex-col items-center justify-center rounded-2xl border border-line/70 bg-paper-card/50 p-3 ring-1 backdrop-blur-sm transition-transform hover:scale-[1.03] active:scale-95 ${tone.ring} ${tone.glow}`}
    >
      <svg
        viewBox="0 0 100 100"
        className={`absolute inset-0 h-full w-full opacity-30 ${tone.text} star-drift`}
        aria-hidden
      >
        <polygon
          points="50,8 61,38 93,40 68,58 78,90 50,72 22,90 32,58 7,40 39,38"
          fill="currentColor"
        />
      </svg>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="line-clamp-1 text-[10px] font-medium text-ink-soft">{debt.name}</div>
        <div className={`text-lg font-bold leading-tight ${tone.text}`}>
          {formatKRWShort(debt.principal)}
        </div>
        <div className="text-[10px] font-medium text-ink-soft/80">{debt.interestRate}%</div>
      </div>

      {progress > 0 && (
        <div className="absolute bottom-2 left-3 right-3 h-1 overflow-hidden rounded-full bg-line/60">
          <div
            className={`h-full ${cls === 'good' ? 'bg-sage' : cls === 'neutral' ? 'bg-honey' : 'bg-clay'}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </Link>
  );
}
