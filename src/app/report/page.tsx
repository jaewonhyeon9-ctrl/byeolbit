'use client';

import { useEffect, useState } from 'react';
import { loadDebts, loadPayments } from '@/lib/storage';
import {
  CATEGORY_LABELS,
  CLASSIFICATION_LABELS,
  classify,
} from '@/lib/classifier';
import {
  avgInterestRate,
  totalInterestPerMonth,
  totalMinPayment,
  totalPrincipal,
} from '@/lib/calculator';
import {
  formatFrequency,
  formatKRW,
  formatPercent,
} from '@/lib/format';
import type { Debt, Payment } from '@/lib/types';

export default function ReportPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDebts(loadDebts());
    setPayments(loadPayments());
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-8">불러오는 중...</div>;
  }

  const total = totalPrincipal(debts);
  const minSum = totalMinPayment(debts);
  const rate = avgInterestRate(debts);
  const interest = totalInterestPerMonth(debts);
  const debtMap = new Map(debts.map((d) => [d.id, d.name]));
  const paidTotal = payments.reduce((s, p) => s + p.amount, 0);
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sortedPayments = [...payments].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  return (
    <div className="report-root">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 14mm 12mm;
          }
          body {
            background: white !important;
            color: black !important;
          }
          nav, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
          }
          .report-root {
            background: white !important;
            color: black !important;
            font-size: 10pt;
          }
          .report-root table {
            page-break-inside: auto;
          }
          .report-root tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          .report-root section {
            page-break-inside: avoid;
          }
        }

        .report-root {
          background: white;
          color: #1a1a1a;
          font-family: var(--font-sans);
          font-weight: 500;
          padding: 20px 8px;
          max-width: 100%;
        }
        .report-root h1 {
          font-size: 20px;
          font-weight: 800;
          margin: 0;
        }
        .report-root h2 {
          font-size: 14px;
          font-weight: 800;
          margin: 0 0 8px;
          padding-bottom: 4px;
          border-bottom: 1.5px solid #1a1a1a;
        }
        .report-root section {
          margin-top: 18px;
        }
        .report-root table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10pt;
        }
        .report-root th, .report-root td {
          padding: 6px 4px;
          text-align: left;
          border-bottom: 0.5px solid #999;
          vertical-align: top;
        }
        .report-root th {
          background: #f0f0f0;
          font-weight: 700;
          font-size: 9pt;
        }
        .report-root .num {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        .report-root .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px 16px;
          font-size: 11pt;
        }
        .report-root .summary-grid .label {
          color: #555;
        }
        .report-root .summary-grid .value {
          text-align: right;
          font-weight: 700;
        }
      `}</style>

      <div className="no-print mb-4 flex items-center justify-between gap-2 rounded-xl border border-line/60 bg-paper-card/50 p-3">
        <p className="text-xs font-medium text-ink-soft">
          브라우저 인쇄 (<kbd className="rounded border px-1">Ctrl</kbd>+
          <kbd className="rounded border px-1">P</kbd>) → "PDF로 저장"
        </p>
        <button
          onClick={() => window.print()}
          className="rounded-full bg-warmgold px-4 py-2 text-xs font-bold text-ink"
        >
          🖨️ 인쇄 / PDF로 저장
        </button>
      </div>

      <header style={{ borderBottom: '2px solid #1a1a1a', paddingBottom: 8 }}>
        <h1>별빚도장 리포트</h1>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#666' }}>
          추출일 {today} · 별빛이 되는 순간까지
        </p>
      </header>

      <section>
        <h2>요약</h2>
        <div className="summary-grid">
          <span className="label">총 별빚</span>
          <span className="value">{formatKRW(total)}</span>
          <span className="label">평균 연 이율</span>
          <span className="value">{formatPercent(rate)}</span>
          <span className="label">월 최소 상환합</span>
          <span className="value">{formatKRW(Math.round(minSum))}</span>
          <span className="label">월 이자 비용</span>
          <span className="value">{formatKRW(Math.round(interest))}</span>
          <span className="label">활성 별빚</span>
          <span className="value">
            {debts.filter((d) => !d.paidOff).length}개
          </span>
          <span className="label">완납 별빚</span>
          <span className="value">
            {debts.filter((d) => d.paidOff).length}개
          </span>
          <span className="label">총 상환 횟수</span>
          <span className="value">{payments.length}건</span>
          <span className="label">총 상환액</span>
          <span className="value">{formatKRW(paidTotal)}</span>
        </div>
      </section>

      <section>
        <h2>별빚 목록</h2>
        {debts.length === 0 ? (
          <p style={{ color: '#666', fontSize: 11 }}>등록된 별빚이 없어요.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>이름</th>
                <th>종류</th>
                <th>분류</th>
                <th className="num">잔액</th>
                <th className="num">이율</th>
                <th className="num">회당 최소</th>
                <th>상환 주기</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{CATEGORY_LABELS[d.category]}</td>
                  <td>{CLASSIFICATION_LABELS[classify(d)]}</td>
                  <td className="num">{formatKRW(d.principal)}</td>
                  <td className="num">{formatPercent(d.interestRate)}</td>
                  <td className="num">{formatKRW(d.minPayment)}</td>
                  <td>{formatFrequency(d)}</td>
                  <td>{d.paidOff ? '완납' : '진행중'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>상환 기록</h2>
        {sortedPayments.length === 0 ? (
          <p style={{ color: '#666', fontSize: 11 }}>아직 상환 기록이 없어요.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>빚 이름</th>
                <th className="num">금액</th>
                <th>메모</th>
              </tr>
            </thead>
            <tbody>
              {sortedPayments.map((p) => (
                <tr key={p.id}>
                  <td>
                    {new Date(p.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td>{debtMap.get(p.debtId) ?? '(삭제됨)'}</td>
                  <td className="num">{formatKRW(p.amount)}</td>
                  <td>{p.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer style={{ marginTop: 20, fontSize: 9, color: '#888' }}>
        별빚도장 v0.2 · 별빛이 되는 순간까지
      </footer>
    </div>
  );
}
