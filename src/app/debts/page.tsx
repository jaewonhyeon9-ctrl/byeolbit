'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { loadDebts, loadSettings, saveSettings } from '@/lib/storage';
import { sortByStrategy, totalPrincipal } from '@/lib/calculator';
import { formatKRW } from '@/lib/format';
import { DebtCard } from '@/components/DebtCard';
import type { Debt, Strategy } from '@/lib/types';

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [strategy, setStrategy] = useState<Strategy>('avalanche');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDebts(loadDebts());
    setStrategy(loadSettings().strategy);
    setMounted(true);
  }, []);

  const sorted = useMemo(() => sortByStrategy(debts, strategy), [debts, strategy]);
  const total = totalPrincipal(debts);

  function changeStrategy(s: Strategy) {
    setStrategy(s);
    const settings = loadSettings();
    saveSettings({ ...settings, strategy: s });
  }

  if (!mounted) {
    return <div className="h-40 animate-pulse rounded-3xl bg-paper-card/30" />;
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-ink">별빚 목록</h1>
          <p className="text-xs text-ink-soft">합계 {formatKRW(total)}</p>
        </div>
        <Link
          href="/debts/new"
          className="rounded-full border border-warmgold/40 bg-warmgold/10 px-3 py-1.5 text-xs font-medium text-warmgold hover:bg-warmgold/20"
        >
          + 새 별빚
        </Link>
      </header>

      <div className="flex gap-2 rounded-full border border-line/60 bg-paper/40 p-1 text-xs">
        <button
          onClick={() => changeStrategy('avalanche')}
          className={`flex-1 rounded-full py-1.5 font-medium transition-colors ${
            strategy === 'avalanche'
              ? 'bg-warmgold text-ink'
              : 'text-ink-soft hover:text-ink'
          }`}
        >
          이율 높은 순 (눈사태)
        </button>
        <button
          onClick={() => changeStrategy('snowball')}
          className={`flex-1 rounded-full py-1.5 font-medium transition-colors ${
            strategy === 'snowball'
              ? 'bg-warmgold text-ink'
              : 'text-ink-soft hover:text-ink'
          }`}
        >
          잔액 작은 순 (눈덩이)
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line/60 p-8 text-center">
          <p className="text-sm text-ink-soft">
            아직 별빚이 없어요.<br />첫 별빚을 새겨보세요.
          </p>
          <Link
            href="/debts/new"
            className="mt-4 inline-block rounded-full bg-warmgold px-5 py-2 text-xs font-semibold text-ink"
          >
            별빚 새기기
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((d) => (
            <DebtCard key={d.id} debt={d} />
          ))}
        </div>
      )}
    </div>
  );
}
