import type { Debt, ExpenseCategory, ScheduledExpense } from './types';

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: '식비',
  transport: '교통',
  housing: '주거 (월세·관리비)',
  utility: '공과금 (통신·전기)',
  shopping: '쇼핑',
  medical: '의료',
  entertainment: '여가',
  cardbill: '카드 결제',
  gift: '경조사',
  subscription: '구독',
  education: '교육',
  other: '기타',
};

export const EXPENSE_CATEGORY_EMOJI: Record<ExpenseCategory, string> = {
  food: '🍚',
  transport: '🚇',
  housing: '🏠',
  utility: '💡',
  shopping: '🛍️',
  medical: '💊',
  entertainment: '🎬',
  cardbill: '💳',
  gift: '🎁',
  subscription: '📺',
  education: '📚',
  other: '·',
};

export function getCategoryLabel(category?: ExpenseCategory): string {
  return EXPENSE_CATEGORY_LABELS[category ?? 'other'];
}

export function isDebtDueOn(debt: Debt, date: Date): boolean {
  if (debt.paidOff) return false;
  const freq = debt.frequency ?? 'monthly';
  if (freq === 'monthly') {
    return debt.dueDay != null && debt.dueDay === date.getDate();
  }
  if (freq === 'weekly') {
    return debt.weekDay != null && debt.weekDay === date.getDay();
  }
  if (freq === 'daily') {
    return true;
  }
  if (freq === 'banking') {
    const dow = date.getDay();
    return dow >= 1 && dow <= 5;
  }
  return false;
}

export interface CategoryStat {
  category: ExpenseCategory;
  total: number;
  count: number;
  changeRatio: number;
}

export interface SpendingAnalysis {
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  prevMonthTotal: number;
  daily30dAvg: number;
  todayTemperature: number;
  weekTemperature: number;
  monthTemperature: number;
  categoryStats: CategoryStat[];
  dailyTrend: { date: string; amount: number }[];
  topItems: ScheduledExpense[];
}

function ratioToTemperature(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0) return 20;
  if (ratio < 0.5) return Math.round(20 + ratio * 20);
  if (ratio < 1.0) return Math.round(30 + (ratio - 0.5) * 60);
  if (ratio < 1.5) return Math.round(60 + (ratio - 1.0) * 40);
  return Math.min(100, Math.round(80 + (ratio - 1.5) * 30));
}

export function analyzeSpending(
  expenses: ScheduledExpense[],
  now: Date = new Date()
): SpendingAnalysis {
  const today = isoDate(now);
  const startOfToday = startOfDay(now);
  const startOfThisWeek = startOfWeek(now);
  const startOfThisMonth = startOfMonth(now);
  const startOf30dAgo = addDays(startOfToday, -30);
  const startOf60dAgo = addDays(startOfToday, -60);
  const startOfPrevMonth = addMonths(startOfThisMonth, -1);

  const paid = expenses.filter((e) => e.paid !== false);

  const inRange = (e: ScheduledExpense, start: Date, endExclusive: Date) => {
    const d = new Date(e.date);
    return d >= start && d < endExclusive;
  };

  const sumIn = (start: Date, endExclusive: Date) =>
    paid
      .filter((e) => inRange(e, start, endExclusive))
      .reduce((s, e) => s + e.amount, 0);

  const tomorrow = addDays(startOfToday, 1);
  const todayTotal = sumIn(startOfToday, tomorrow);
  const weekTotal = sumIn(startOfThisWeek, addDays(startOfThisWeek, 7));
  const monthTotal = sumIn(startOfThisMonth, addMonths(startOfThisMonth, 1));
  const prevMonthTotal = sumIn(startOfPrevMonth, startOfThisMonth);
  const last30d = sumIn(startOf30dAgo, tomorrow);
  const daily30dAvg = last30d / 30;

  const todayTemp = ratioToTemperature(todayTotal / Math.max(daily30dAvg, 1));
  const weekTemp = ratioToTemperature(weekTotal / Math.max(daily30dAvg * 7, 1));
  const monthTemp = ratioToTemperature(
    monthTotal / Math.max(prevMonthTotal || daily30dAvg * 30, 1)
  );

  const catLast30 = new Map<ExpenseCategory, number>();
  const catCount = new Map<ExpenseCategory, number>();
  const catPrev30 = new Map<ExpenseCategory, number>();

  for (const e of paid) {
    const d = new Date(e.date);
    const cat = e.category ?? 'other';
    if (d >= startOf30dAgo && d < tomorrow) {
      catLast30.set(cat, (catLast30.get(cat) ?? 0) + e.amount);
      catCount.set(cat, (catCount.get(cat) ?? 0) + 1);
    } else if (d >= startOf60dAgo && d < startOf30dAgo) {
      catPrev30.set(cat, (catPrev30.get(cat) ?? 0) + e.amount);
    }
  }

  const categoryStats: CategoryStat[] = Array.from(catLast30.entries())
    .map(([cat, total]) => {
      const prev = catPrev30.get(cat) ?? 0;
      const change = prev > 0 ? (total - prev) / prev : total > 0 ? 1 : 0;
      return {
        category: cat,
        total,
        count: catCount.get(cat) ?? 0,
        changeRatio: change,
      };
    })
    .sort((a, b) => b.total - a.total);

  const dailyTrend: { date: string; amount: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = addDays(startOfToday, -i);
    const amount = sumIn(day, addDays(day, 1));
    dailyTrend.push({ date: isoDate(day), amount });
  }

  const topItems = [...paid]
    .filter((e) => {
      const d = new Date(e.date);
      return d >= startOf30dAgo && d < tomorrow;
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    todayTotal,
    weekTotal,
    monthTotal,
    prevMonthTotal,
    daily30dAvg,
    todayTemperature: todayTemp,
    weekTemperature: weekTemp,
    monthTemperature: monthTemp,
    categoryStats,
    dailyTrend,
    topItems,
  };
}

export function temperatureLabel(temp: number): {
  label: string;
  color: 'sage' | 'warmgold' | 'honey' | 'clay';
  hint: string;
} {
  if (temp < 35) {
    return { label: '차가움', color: 'sage', hint: '평소보다 적게 쓰셨어요' };
  }
  if (temp < 60) {
    return { label: '평온', color: 'warmgold', hint: '평소 페이스대로' };
  }
  if (temp < 80) {
    return { label: '미지근함', color: 'honey', hint: '조금 더 쓰셨어요' };
  }
  return { label: '뜨거움', color: 'clay', hint: '지출 점검이 필요해요' };
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
}
