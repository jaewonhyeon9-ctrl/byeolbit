'use client';

import type { Debt } from './types';
import { getDailyInsight } from './insights';
import { loadDebts, loadSettings } from './storage';

const KEY_LAST_DAILY = 'byeolbit:notif:last-daily';
const KEY_LAST_DUE = 'byeolbit:notif:last-due';

export type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export function getPermissionState(): PermissionState {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission as PermissionState;
}

export async function requestPermission(): Promise<PermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result as PermissionState;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (e) {
    console.warn('SW register failed', e);
    return null;
  }
}

async function showNotification(
  title: string,
  body: string,
  url: string,
  tag: string
): Promise<void> {
  if (Notification.permission !== 'granted') return;
  const reg = await navigator.serviceWorker?.getRegistration?.();
  const options: NotificationOptions = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag,
    data: { url },
  };
  if (reg) {
    await reg.showNotification(title, options);
  } else {
    new Notification(title, options);
  }
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function dueOnToday(debt: Debt, today: Date): boolean {
  if (debt.paidOff) return false;
  const freq = debt.frequency || 'monthly';
  if (freq === 'monthly') {
    return typeof debt.dueDay === 'number' && debt.dueDay === today.getDate();
  }
  if (freq === 'weekly') {
    return typeof debt.weekDay === 'number' && debt.weekDay === today.getDay();
  }
  if (freq === 'banking') {
    const day = today.getDay();
    return day !== 0 && day !== 6;
  }
  if (freq === 'daily') return true;
  return false;
}

export async function maybeFireDailyInsight(): Promise<void> {
  if (Notification.permission !== 'granted') return;
  const settings = loadSettings();
  if (!settings.pushEnabled) return;

  const today = todayStr();
  const last = window.localStorage.getItem(KEY_LAST_DAILY);
  if (last === today) return;

  const insight = getDailyInsight(settings.insightSeed, today);
  await showNotification(
    `오늘의 별빛 — ${insight.title}`,
    insight.affirmation,
    '/insights',
    `daily-${today}`
  );
  window.localStorage.setItem(KEY_LAST_DAILY, today);
}

export async function maybeFireDueReminders(): Promise<void> {
  if (Notification.permission !== 'granted') return;
  const settings = loadSettings();
  if (!settings.pushEnabled) return;

  const today = new Date();
  const todayKey = todayStr();
  const last = window.localStorage.getItem(KEY_LAST_DUE);
  if (last === todayKey) return;

  const debts = loadDebts().filter((d) => dueOnToday(d, today));
  if (debts.length === 0) {
    window.localStorage.setItem(KEY_LAST_DUE, todayKey);
    return;
  }

  if (debts.length === 1) {
    const d = debts[0];
    await showNotification(
      `오늘 상환일 — ${d.name}`,
      `회당 상환 ${d.minPayment.toLocaleString('ko-KR')}원 잊지 말기`,
      `/debts/${d.id}`,
      `due-${todayKey}`
    );
  } else {
    await showNotification(
      `오늘 상환일 ${debts.length}건`,
      debts
        .slice(0, 3)
        .map((d) => d.name)
        .join(', ') + (debts.length > 3 ? ` 외 ${debts.length - 3}건` : ''),
      '/debts',
      `due-${todayKey}`
    );
  }
  window.localStorage.setItem(KEY_LAST_DUE, todayKey);
}

export async function fireAllDueChecks(): Promise<void> {
  await maybeFireDailyInsight();
  await maybeFireDueReminders();
}
