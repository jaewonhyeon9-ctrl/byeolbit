import type { Debt, RepaymentFrequency } from './types';

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function formatKRW(amount: number): string {
  if (!Number.isFinite(amount)) return '—';
  if (amount === 0) return '0원';

  const negative = amount < 0;
  const n = Math.abs(amount);

  const eok = Math.floor(n / 100_000_000);
  const man = Math.floor((n % 100_000_000) / 10_000);
  const won = n % 10_000;

  const parts: string[] = [];
  if (eok > 0) parts.push(`${eok.toLocaleString()}억`);
  if (man > 0) parts.push(`${man.toLocaleString()}만`);
  if (won > 0) parts.push(`${won.toLocaleString()}`);

  return (negative ? '-' : '') + parts.join(' ') + '원';
}

export function formatKRWShort(amount: number): string {
  if (!Number.isFinite(amount)) return '—';
  const n = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (n >= 100_000_000) {
    const eok = n / 100_000_000;
    return `${sign}${eok >= 10 ? eok.toFixed(0) : eok.toFixed(1)}억`;
  }
  if (n >= 10_000) {
    const man = n / 10_000;
    return `${sign}${man.toFixed(0)}만`;
  }
  return `${sign}${n.toLocaleString()}`;
}

export function formatMonths(months: number): string {
  if (!Number.isFinite(months)) return '—';
  if (months <= 0) return '완납';
  const years = Math.floor(months / 12);
  const m = months % 12;
  if (years === 0) return `${m}개월`;
  if (m === 0) return `${years}년`;
  return `${years}년 ${m}개월`;
}

export function formatPercent(rate: number, fractionDigits = 1): string {
  if (!Number.isFinite(rate)) return '—';
  return `${rate.toFixed(fractionDigits)}%`;
}

export const FREQUENCY_LABELS: Record<RepaymentFrequency, string> = {
  monthly: '매월',
  weekly: '매주',
  daily: '매일',
  banking: '영업일',
};

export function formatFrequency(d: Pick<Debt, 'frequency' | 'dueDay' | 'weekDay'>): string {
  const freq = d.frequency ?? 'monthly';
  if (freq === 'monthly') {
    return d.dueDay ? `매월 ${d.dueDay}일` : '매월';
  }
  if (freq === 'weekly') {
    if (d.weekDay != null && d.weekDay >= 0 && d.weekDay < 7) {
      return `매주 ${WEEK_DAYS[d.weekDay]}요일`;
    }
    return '매주';
  }
  if (freq === 'banking') return '영업일 매일';
  return '매일';
}

export function paymentLabelForFrequency(freq: RepaymentFrequency): string {
  switch (freq) {
    case 'monthly': return '월 최소 상환';
    case 'weekly': return '주 최소 상환';
    case 'daily': return '일 최소 상환';
    case 'banking': return '영업일 1회 상환';
  }
}
