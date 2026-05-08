'use client';

import type {
  Debt,
  Payment,
  RoutineItem,
  ScheduledExpense,
  Settings,
} from './types';

const KEY_DEBTS = 'byeolbit:debts:v1';
const KEY_PAYMENTS = 'byeolbit:payments:v1';
const KEY_SETTINGS = 'byeolbit:settings:v1';
const KEY_PRINCIPLES = 'byeolbit:principles:v1';
const KEY_ROUTINE = 'byeolbit:routine:v1';
const KEY_EXPENSES = 'byeolbit:expenses:v1';

export const PRINCIPLE_COUNT = 15;

export const PRINCIPLE_EXAMPLES: string[] = [
  '충동 구매 전, 별빚도장을 먼저 열어본다',
  '부수입의 100%는 별빚 상환에 사용한다',
  '매일 아침 가장 무거운 별빚 하나를 떠올린다',
  '매주 일요일 저녁, 가계부를 점검한다',
  '"지금 못 사는 게 아쉽다"는 감정을 인정한다',
  '빚 이야기를 부끄러워하지 않고 솔직히 마주한다',
  '카드 결제는 정해진 항목 외엔 하지 않는다',
  '무이자 할부도 빚이다 — 함부로 신청하지 않는다',
  '갚을 때마다 작은 축하의 의식을 한다',
  '비교하지 않는다 — 내 별빚은 내 속도로 깨진다',
  '우주에게 감사 인사를 매주 한 번 보낸다',
  '부정 별빚(이율 10%↑)부터 우선적으로 깬다',
  '빚이 다 사라진 날의 풍경을 구체적으로 떠올린다',
  '도움이 필요할 땐 신용회복위원회·전문가에게 묻는다',
  '오늘의 한 걸음만 본다 — 4억은 한 번에 사라지지 않는다',
];

const DEFAULT_SETTINGS: Settings = {
  strategy: 'avalanche',
  pushEnabled: false,
  insightStreak: 0,
  insightSeed: Math.floor(Math.random() * 1_000_000),
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadDebts(): Debt[] {
  return read<Debt[]>(KEY_DEBTS, []);
}
export function saveDebts(debts: Debt[]): void {
  write(KEY_DEBTS, debts);
}
export function loadDebt(id: string): Debt | null {
  return loadDebts().find((d) => d.id === id) ?? null;
}

export function loadPayments(): Payment[] {
  return read<Payment[]>(KEY_PAYMENTS, []);
}
export function savePayments(p: Payment[]): void {
  write(KEY_PAYMENTS, p);
}
export function loadPaymentsForDebt(debtId: string): Payment[] {
  return loadPayments()
    .filter((p) => p.debtId === debtId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(KEY_SETTINGS, {}) };
}
export function saveSettings(s: Settings): void {
  write(KEY_SETTINGS, s);
}

export function loadPrinciples(): string[] {
  const raw = read<string[]>(KEY_PRINCIPLES, []);
  const padded = Array.from({ length: PRINCIPLE_COUNT }, (_, i) => raw[i] ?? '');
  return padded;
}

export function savePrinciples(items: string[]): void {
  const padded = Array.from({ length: PRINCIPLE_COUNT }, (_, i) =>
    typeof items[i] === 'string' ? items[i] : ''
  );
  write(KEY_PRINCIPLES, padded);
}

export const ROUTINE_EXAMPLES: { time: string; activity: string }[] = [
  { time: '07:00', activity: '기상 후 별빚도장 앱 열기 — 오늘의 메시지 한 번 읽기' },
  { time: '08:00', activity: '도시락 준비 (외식비 절약)' },
  { time: '12:00', activity: '점심 — 정해진 한도 내에서' },
  { time: '14:00', activity: '영수증 OCR로 가계부 입력' },
  { time: '18:00', activity: '오늘 지출 점검 + 충동 구매 있었는지 자문' },
  { time: '22:00', activity: '별빚도장에서 "오늘 갚기" 입력' },
  { time: '23:00', activity: '잠들기 전 감사 한 가지 떠올리기' },
];

export function loadRoutine(): RoutineItem[] {
  return read<RoutineItem[]>(KEY_ROUTINE, []);
}
export function saveRoutine(items: RoutineItem[]): void {
  write(KEY_ROUTINE, items);
}

export function loadExpenses(): ScheduledExpense[] {
  return read<ScheduledExpense[]>(KEY_EXPENSES, []);
}
export function saveExpenses(items: ScheduledExpense[]): void {
  write(KEY_EXPENSES, items);
}

export function clearAll(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY_DEBTS);
  window.localStorage.removeItem(KEY_PAYMENTS);
  window.localStorage.removeItem(KEY_SETTINGS);
  window.localStorage.removeItem(KEY_PRINCIPLES);
  window.localStorage.removeItem(KEY_ROUTINE);
  window.localStorage.removeItem(KEY_EXPENSES);
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const BACKUP_VERSION = 1;
const APP_VERSION = '0.2';

export interface BackupBundle {
  version: number;
  exportedAt: string;
  appVersion: string;
  debts: Debt[];
  payments: Payment[];
  settings: Settings;
  principles?: string[];
  routine?: RoutineItem[];
  expenses?: ScheduledExpense[];
}

export function exportData(): BackupBundle {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    debts: loadDebts(),
    payments: loadPayments(),
    settings: loadSettings(),
    principles: loadPrinciples(),
    routine: loadRoutine(),
    expenses: loadExpenses(),
  };
}

export function importData(bundle: BackupBundle): {
  debts: number;
  payments: number;
} {
  if (!bundle || typeof bundle !== 'object') {
    throw new Error('백업 파일을 읽을 수 없어요.');
  }
  if (bundle.version !== BACKUP_VERSION) {
    throw new Error(
      `지원하지 않는 백업 버전 (v${bundle.version}). 이 앱은 v${BACKUP_VERSION}만 지원합니다.`
    );
  }
  if (!Array.isArray(bundle.debts) || !Array.isArray(bundle.payments)) {
    throw new Error('백업 파일이 손상됐어요. debts/payments 누락.');
  }

  saveDebts(bundle.debts);
  savePayments(bundle.payments);
  if (bundle.settings && typeof bundle.settings === 'object') {
    saveSettings({ ...loadSettings(), ...bundle.settings });
  }
  if (Array.isArray(bundle.principles)) {
    savePrinciples(bundle.principles);
  }
  if (Array.isArray(bundle.routine)) {
    saveRoutine(bundle.routine);
  }
  if (Array.isArray(bundle.expenses)) {
    saveExpenses(bundle.expenses);
  }

  return { debts: bundle.debts.length, payments: bundle.payments.length };
}

export function getStorageStats() {
  return {
    debts: loadDebts().length,
    activeDebts: loadDebts().filter((d) => !d.paidOff).length,
    paidOffDebts: loadDebts().filter((d) => d.paidOff).length,
    payments: loadPayments().length,
  };
}

export interface RecordPaymentResult {
  debt: Debt;
  payment: Payment;
  wasJustPaidOff: boolean;
}

export function recordPayment(
  debtId: string,
  amount: number,
  note?: string
): RecordPaymentResult | null {
  if (amount <= 0) return null;
  const debts = loadDebts();
  const idx = debts.findIndex((d) => d.id === debtId);
  if (idx === -1) return null;

  const before = debts[idx];
  const newPrincipal = Math.max(0, before.principal - amount);
  const wasJustPaidOff = !before.paidOff && newPrincipal === 0;

  const updated: Debt = {
    ...before,
    principal: newPrincipal,
    paidOff: before.paidOff || newPrincipal === 0,
    paidOffAt:
      before.paidOffAt ?? (newPrincipal === 0 ? new Date().toISOString() : undefined),
  };
  debts[idx] = updated;
  saveDebts(debts);

  const payment: Payment = {
    id: newId(),
    debtId,
    amount,
    date: new Date().toISOString(),
    note,
  };
  savePayments([...loadPayments(), payment]);

  return { debt: updated, payment, wasJustPaidOff };
}

export function removeDebt(debtId: string): void {
  saveDebts(loadDebts().filter((d) => d.id !== debtId));
  savePayments(loadPayments().filter((p) => p.debtId !== debtId));
}
