import type { Debt, Strategy } from './types';
import { classify } from './classifier';

export function activeDebts(debts: Debt[]): Debt[] {
  return debts.filter((d) => !d.paidOff);
}

export function totalPrincipal(debts: Debt[]): number {
  return activeDebts(debts).reduce((s, d) => s + d.principal, 0);
}

export function totalMinPayment(debts: Debt[]): number {
  return activeDebts(debts).reduce((s, d) => s + d.minPayment, 0);
}

export function avgInterestRate(debts: Debt[]): number {
  const active = activeDebts(debts);
  const total = totalPrincipal(active);
  if (total === 0) return 0;
  return active.reduce((s, d) => s + d.principal * d.interestRate, 0) / total;
}

export function classificationBreakdown(debts: Debt[]): Record<'good' | 'neutral' | 'bad', number> {
  const out = { good: 0, neutral: 0, bad: 0 };
  for (const d of activeDebts(debts)) {
    out[classify(d)] += d.principal;
  }
  return out;
}

export function estimateMonthsToRepay(
  principal: number,
  monthly: number,
  annualRate: number
): number {
  if (principal <= 0) return 0;
  if (monthly <= 0) return Infinity;
  const r = annualRate / 100 / 12;
  if (r === 0) return Math.ceil(principal / monthly);
  const denom = 1 - (r * principal) / monthly;
  if (denom <= 0) return Infinity;
  return Math.ceil(-Math.log(denom) / Math.log(1 + r));
}

export function estimateRepaymentForPortfolio(debts: Debt[], extraMonthly = 0): number {
  const active = activeDebts(debts);
  if (active.length === 0) return 0;
  const total = totalPrincipal(active);
  const monthly = totalMinPayment(active) + extraMonthly;
  const rate = avgInterestRate(active);
  return estimateMonthsToRepay(total, monthly, rate);
}

export function sortByStrategy(debts: Debt[], strategy: Strategy): Debt[] {
  const list = [...activeDebts(debts)];
  if (strategy === 'snowball') {
    list.sort((a, b) => a.principal - b.principal);
  } else {
    list.sort((a, b) => b.interestRate - a.interestRate);
  }
  return list;
}

export function totalInterestPerMonth(debts: Debt[]): number {
  return activeDebts(debts).reduce(
    (s, d) => s + (d.principal * d.interestRate) / 100 / 12,
    0
  );
}
