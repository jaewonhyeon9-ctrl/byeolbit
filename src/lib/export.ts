'use client';

import { loadDebts, loadPayments } from './storage';
import {
  CATEGORY_LABELS,
  CLASSIFICATION_LABELS,
  classify,
} from './classifier';
import {
  avgInterestRate,
  totalInterestPerMonth,
  totalMinPayment,
  totalPrincipal,
} from './calculator';
import { formatFrequency } from './format';

function csvEscape(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (/[,"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCSV(rows: (string | number | undefined | null)[][]): string {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
}

export function generateCSV(): string {
  const debts = loadDebts();
  const payments = loadPayments();
  const debtMap = new Map(debts.map((d) => [d.id, d.name]));

  const summary: (string | number)[][] = [
    ['[요약]'],
    ['추출일', new Date().toLocaleString('ko-KR')],
    ['총 별빚', totalPrincipal(debts)],
    ['활성 별빚', debts.filter((d) => !d.paidOff).length],
    ['완납 별빚', debts.filter((d) => d.paidOff).length],
    ['평균 이율(%)', Number(avgInterestRate(debts).toFixed(2))],
    ['월 최소 상환합', Math.round(totalMinPayment(debts))],
    ['월 이자 비용', Math.round(totalInterestPerMonth(debts))],
    ['상환 횟수', payments.length],
    ['총 상환액', payments.reduce((s, p) => s + p.amount, 0)],
  ];

  const debtHeader = [
    '이름',
    '종류',
    '분류',
    '현재 잔액',
    '처음 빌린 금액',
    '연 이율(%)',
    '회당 최소 상환',
    '상환 주기',
    '상환일',
    '메모',
    '등록일',
    '완납 여부',
    '완납일',
  ];
  const debtRows: (string | number)[][] = debts.map((d) => [
    d.name,
    CATEGORY_LABELS[d.category],
    CLASSIFICATION_LABELS[classify(d)],
    d.principal,
    d.originalAmount ?? '',
    d.interestRate,
    d.minPayment,
    formatFrequency(d),
    d.dueDay ?? '',
    d.note ?? '',
    new Date(d.createdAt).toLocaleDateString('ko-KR'),
    d.paidOff ? '완납' : '진행중',
    d.paidOffAt ? new Date(d.paidOffAt).toLocaleDateString('ko-KR') : '',
  ]);

  const paymentHeader = ['빚 이름', '금액', '날짜', '메모'];
  const paymentRows: (string | number)[][] = [...payments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((p) => [
      debtMap.get(p.debtId) ?? '(삭제됨)',
      p.amount,
      new Date(p.date).toLocaleString('ko-KR'),
      p.note ?? '',
    ]);

  const blocks = [
    rowsToCSV(summary),
    '',
    '[별빚 목록]',
    rowsToCSV([debtHeader, ...debtRows]),
    '',
    '[상환 기록]',
    rowsToCSV([paymentHeader, ...paymentRows]),
  ];

  return '﻿' + blocks.join('\r\n');
}

export function downloadCSV() {
  const csv = generateCSV();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `byeolbit-${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
