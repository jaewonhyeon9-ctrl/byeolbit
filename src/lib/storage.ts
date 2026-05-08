'use client';

import type { Debt, Payment, Settings } from './types';

const KEY_DEBTS = 'byeolbit:debts:v1';
const KEY_PAYMENTS = 'byeolbit:payments:v1';
const KEY_SETTINGS = 'byeolbit:settings:v1';

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

export function clearAll(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY_DEBTS);
  window.localStorage.removeItem(KEY_PAYMENTS);
  window.localStorage.removeItem(KEY_SETTINGS);
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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
