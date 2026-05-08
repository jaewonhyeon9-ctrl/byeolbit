import type { Debt, DebtCategory, DebtClassification } from './types';

export function classify(
  debt: Pick<Debt, 'category' | 'interestRate' | 'classification'>
): DebtClassification {
  if (debt.classification) return debt.classification;

  const { category, interestRate: rate } = debt;

  if (category === 'private') return 'bad';

  if (category === 'card') {
    return rate >= 8 ? 'bad' : 'neutral';
  }

  if (category === 'mortgage' || category === 'jeonse') {
    if (rate < 5) return 'good';
    return 'neutral';
  }

  if (category === 'student') {
    if (rate < 5) return 'good';
    return 'neutral';
  }

  if (category === 'business') {
    if (rate < 7) return 'good';
    if (rate < 10) return 'neutral';
    return 'bad';
  }

  if (rate >= 12) return 'bad';
  if (rate < 5) return 'good';
  return 'neutral';
}

export const CATEGORY_LABELS: Record<DebtCategory, string> = {
  mortgage: '주택담보대출',
  jeonse: '전세자금대출',
  business: '사업자대출',
  student: '학자금대출',
  auto: '자동차 할부',
  card: '카드론·현금서비스',
  personal: '신용대출',
  private: '사채',
  medical: '의료비',
  family: '가족·지인',
  other: '기타',
};

export const CLASSIFICATION_LABELS: Record<DebtClassification, string> = {
  good: '긍정 별빛',
  neutral: '중립',
  bad: '부정 별빚',
};

export const CLASSIFICATION_DESCRIPTIONS: Record<DebtClassification, string> = {
  good: '자산을 키우거나 미래 수익을 만드는 빚. 천천히 갚아도 괜찮아요.',
  neutral: '필수 소비성 빚. 사정 봐가며 갚으면 됩니다.',
  bad: '이율 높은 소비성 빚. 가장 먼저 깨야 할 별빚이에요.',
};

export const CLASSIFICATION_TONE: Record<
  DebtClassification,
  { ring: string; glow: string; text: string; chip: string; chipText: string }
> = {
  good: {
    ring: 'ring-sage/40',
    glow: 'shadow-[0_4px_18px_rgba(90,112,72,0.18)]',
    text: 'text-sage',
    chip: 'bg-sage/12 border-sage/40',
    chipText: 'text-sage',
  },
  neutral: {
    ring: 'ring-honey/45',
    glow: 'shadow-[0_4px_18px_rgba(184,134,46,0.20)]',
    text: 'text-honey',
    chip: 'bg-honey/12 border-honey/40',
    chipText: 'text-honey',
  },
  bad: {
    ring: 'ring-clay/45',
    glow: 'shadow-[0_4px_18px_rgba(168,94,62,0.22)]',
    text: 'text-clay',
    chip: 'bg-clay/12 border-clay/40',
    chipText: 'text-clay',
  },
};
