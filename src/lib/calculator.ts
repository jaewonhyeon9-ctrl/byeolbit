import type { Debt, RepaymentFrequency, Strategy } from './types';
import { classify } from './classifier';

const PERIODS_PER_MONTH: Record<RepaymentFrequency, number> = {
  monthly: 1,
  weekly: 52 / 12,
  daily: 365 / 12,
  banking: 252 / 12,
};

export function getFrequency(d: Debt): RepaymentFrequency {
  return d.frequency ?? 'monthly';
}

export function periodsPerMonth(freq: RepaymentFrequency): number {
  return PERIODS_PER_MONTH[freq];
}

export function monthlyMinPayment(d: Debt): number {
  return d.minPayment * periodsPerMonth(getFrequency(d));
}

export function activeDebts(debts: Debt[]): Debt[] {
  return debts.filter((d) => !d.paidOff);
}

export function totalPrincipal(debts: Debt[]): number {
  return activeDebts(debts).reduce((s, d) => s + d.principal, 0);
}

export function totalMinPayment(debts: Debt[]): number {
  return activeDebts(debts).reduce((s, d) => s + monthlyMinPayment(d), 0);
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

export interface DebtPayoffEntry {
  debtId: string;
  payoffMonth: number;
  totalInterestPaid: number;
}

export interface PortfolioSimulation {
  totalMonths: number;
  totalInterestPaid: number;
  perDebt: DebtPayoffEntry[];
  finite: boolean;
  insufficientMonthly: boolean;
}

export function simulatePayoff(
  debts: Debt[],
  monthlyTotal: number,
  strategy: Strategy,
  maxMonths = 600
): PortfolioSimulation {
  const work = activeDebts(debts).map((d) => ({
    id: d.id,
    principal: d.principal,
    rateMonthly: d.interestRate / 100 / 12,
    rateAnnual: d.interestRate,
    minPayment: monthlyMinPayment(d),
    payoffMonth: -1,
    totalInterestPaid: 0,
  }));

  if (work.length === 0) {
    return {
      totalMonths: 0,
      totalInterestPaid: 0,
      perDebt: [],
      finite: true,
      insufficientMonthly: false,
    };
  }

  const totalMinSum = work.reduce((s, d) => s + d.minPayment, 0);
  const insufficient = monthlyTotal < totalMinSum - 0.01;

  for (let m = 1; m <= maxMonths; m++) {
    for (const d of work) {
      if (d.principal <= 0) continue;
      const interest = d.principal * d.rateMonthly;
      d.principal += interest;
      d.totalInterestPaid += interest;
    }

    let remaining = monthlyTotal;

    for (const d of work) {
      if (d.principal <= 0) continue;
      const pay = Math.min(d.minPayment, d.principal, remaining);
      d.principal -= pay;
      remaining -= pay;
    }

    const priority = work
      .filter((d) => d.principal > 0)
      .sort((a, b) =>
        strategy === 'snowball'
          ? a.principal - b.principal
          : b.rateAnnual - a.rateAnnual
      );

    for (const d of priority) {
      if (remaining <= 0) break;
      const pay = Math.min(d.principal, remaining);
      d.principal -= pay;
      remaining -= pay;
    }

    for (const d of work) {
      if (d.principal <= 0.5 && d.payoffMonth === -1) {
        d.payoffMonth = m;
        d.principal = 0;
      }
    }

    if (work.every((d) => d.principal <= 0)) {
      return {
        totalMonths: m,
        totalInterestPaid: work.reduce((s, d) => s + d.totalInterestPaid, 0),
        perDebt: work.map((d) => ({
          debtId: d.id,
          payoffMonth: d.payoffMonth,
          totalInterestPaid: d.totalInterestPaid,
        })),
        finite: true,
        insufficientMonthly: insufficient,
      };
    }
  }

  return {
    totalMonths: Infinity,
    totalInterestPaid: work.reduce((s, d) => s + d.totalInterestPaid, 0),
    perDebt: work.map((d) => ({
      debtId: d.id,
      payoffMonth: d.payoffMonth === -1 ? Infinity : d.payoffMonth,
      totalInterestPaid: d.totalInterestPaid,
    })),
    finite: false,
    insufficientMonthly: insufficient,
  };
}
