export type DebtCategory =
  | 'mortgage'   // 주택담보대출
  | 'jeonse'     // 전세자금대출
  | 'business'   // 사업자대출
  | 'student'    // 학자금
  | 'auto'       // 자동차 할부
  | 'card'       // 카드론·현금서비스·리볼빙
  | 'personal'   // 신용대출
  | 'private'    // 사채
  | 'medical'    // 의료비
  | 'family'     // 가족·지인 차용
  | 'other';

export type DebtClassification = 'good' | 'neutral' | 'bad';

export type RepaymentFrequency = 'monthly' | 'weekly' | 'daily' | 'banking';

export interface Debt {
  id: string;
  name: string;
  category: DebtCategory;
  principal: number;
  originalAmount?: number;
  interestRate: number;
  minPayment: number;
  classification?: DebtClassification;
  startDate?: string;
  frequency?: RepaymentFrequency;
  dueDay?: number;
  weekDay?: number;
  note?: string;
  createdAt: string;
  paidOff: boolean;
  paidOffAt?: string;
}

export interface Payment {
  id: string;
  debtId: string;
  amount: number;
  date: string;
  note?: string;
}

export interface RoutineItem {
  id: string;
  time: string;
  activity: string;
}

export interface ScheduledExpense {
  id: string;
  name: string;
  amount: number;
  date: string;
  category?: string;
  paid?: boolean;
}

export type Strategy = 'snowball' | 'avalanche';

export interface Settings {
  strategy: Strategy;
  monthlyIncome?: number;
  pushEnabled: boolean;
  lastInsightDate?: string;
  insightStreak: number;
  insightSeed: number;
}
