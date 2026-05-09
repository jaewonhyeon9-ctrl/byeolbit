export type InsightCategory =
  | 'mindset'      // 마인드셋·신념
  | 'action'       // 행동·실행
  | 'spending'     // 소비·지출
  | 'relationship' // 관계·사회적 자본
  | 'recovery';    // 회복·자기 돌봄

export interface Insight {
  id: number;
  title: string;
  body: string;
  affirmation: string;
  category: InsightCategory;
}

export const INSIGHT_CATEGORY_LABELS: Record<InsightCategory, string> = {
  mindset: '마인드',
  action: '실행',
  spending: '소비',
  relationship: '관계',
  recovery: '회복',
};

export const INSIGHT_CATEGORY_TONE: Record<
  InsightCategory,
  { chip: string; chipText: string }
> = {
  mindset: { chip: 'bg-warmgold/15 border-warmgold/40', chipText: 'text-warmgold' },
  action: { chip: 'bg-sage/15 border-sage/40', chipText: 'text-sage' },
  spending: { chip: 'bg-clay/15 border-clay/40', chipText: 'text-clay' },
  relationship: { chip: 'bg-honey/15 border-honey/40', chipText: 'text-honey' },
  recovery: { chip: 'bg-ink/10 border-ink/30', chipText: 'text-ink' },
};

export const INSIGHTS: Insight[] = [
  {
    id: 1,
    title: '빚도 별이다',
    body: '빚은 부끄러운 게 아닙니다. 잠시 흐려진 별일 뿐. 갚는 순간 다시 빛납니다.',
    affirmation: '나의 별빚은 곧 별빛이 됩니다.',
    category: 'mindset',
  },
  {
    id: 2,
    title: '한 걸음의 위력',
    body: '오늘 만 원을 갚는다고 4억이 사라지지 않아요. 하지만 그 한 걸음이 없으면 아무것도 사라지지 않습니다.',
    affirmation: '오늘의 작은 한 걸음이 별빛이 됩니다.',
    category: 'action',
  },
  {
    id: 3,
    title: '풍요는 이미 안에',
    body: '돈은 결과지 원인이 아니에요. 풍요로운 마음이 풍요로운 통장을 끌어옵니다.',
    affirmation: '나는 이미 풍요로 향하고 있습니다.',
    category: 'mindset',
  },
  {
    id: 4,
    title: '과거 나를 용서하기',
    body: '그때의 나는 그때의 정보로 최선이었어요. 지금의 나는 더 많은 것을 알고 더 잘할 수 있습니다.',
    affirmation: '과거의 나를 안아주고 오늘을 시작합니다.',
    category: 'recovery',
  },
  {
    id: 5,
    title: '비교하지 않기',
    body: '남의 별을 부러워하면 내 별이 어두워 보여요. 내 우주는 내 속도로 빛나면 됩니다.',
    affirmation: '나는 나의 시간표대로 빛납니다.',
    category: 'mindset',
  },
  {
    id: 6,
    title: '오늘의 감사 한 가지',
    body: '아무리 작은 것이라도 좋아요. 따뜻한 물, 누군가의 안부, 이 앱을 켠 나 자신.',
    affirmation: '감사가 풍요의 문을 엽니다.',
    category: 'recovery',
  },
  {
    id: 7,
    title: '완벽한 출발은 없다',
    body: '계획이 완벽해질 때를 기다리면 평생 못 시작해요. 부족한 채로 오늘 한 발만 나가세요.',
    affirmation: '나는 부족한 채로도 충분히 시작합니다.',
    category: 'action',
  },
  {
    id: 8,
    title: '돈에게 친절하기',
    body: '"돈이 무서워" 대신 "돈아 와줘서 고마워". 돈은 듣고 있고, 우주도 듣고 있습니다.',
    affirmation: '나는 돈에게 친절한 사람입니다.',
    category: 'mindset',
  },
  {
    id: 9,
    title: '부정의 별빚부터',
    body: '이율 높은 빚은 매일 우주의 빛을 빨아먹어요. 부정 별빚을 가장 먼저 깨세요.',
    affirmation: '오늘 가장 무거운 빚을 한 칸 줄입니다.',
    category: 'action',
  },
  {
    id: 10,
    title: '자기 자비',
    body: '자기 비난은 별을 더 흐리게 할 뿐이에요. 친한 친구에게 하듯 나에게 말해주세요.',
    affirmation: '나는 나에게 친절합니다.',
    category: 'recovery',
  },
  {
    id: 11,
    title: '한 번에 한 별',
    body: '4억을 한 번에 보면 막막해요. 가장 작은 별빚 하나만 보세요. 그것만 깨면 됩니다.',
    affirmation: '오늘 나는 단 하나의 별만 봅니다.',
    category: 'action',
  },
  {
    id: 12,
    title: '풍요의 언어',
    body: '"없어"보다 "아직"을, "못해"보다 "지금은"을. 단어가 바뀌면 우주가 바뀝니다.',
    affirmation: '내 입에서 풍요의 언어가 흐릅니다.',
    category: 'mindset',
  },
  {
    id: 13,
    title: '두려움 인정하기',
    body: '두려움을 외면하면 더 커져요. "그래, 무서워"라고 말하면 두려움도 별이 됩니다.',
    affirmation: '나는 두려움도 안고 갈 수 있습니다.',
    category: 'recovery',
  },
  {
    id: 14,
    title: '지출은 가치의 거울',
    body: '지난 한 주 가장 큰 지출이 정말 나를 행복하게 했나요? 가치 없는 별빚을 줄여보세요.',
    affirmation: '나는 가치 있는 곳에 빛을 둡니다.',
    category: 'spending',
  },
  {
    id: 15,
    title: '별빛의 약속',
    body: '오늘 흐려도, 내일 빛날 수 있어요. 별빛이 되는 순간까지, 함께 갑니다.',
    affirmation: '나는 별빛이 되는 중입니다.',
    category: 'mindset',
  },
  {
    id: 16,
    title: '자동이체의 힘',
    body: '의지력은 한정 자원입니다. 매달 1일 자동이체 한 줄이, 1년치 결심보다 셉니다.',
    affirmation: '나는 의지가 아니라 시스템으로 빚을 깹니다.',
    category: 'action',
  },
  {
    id: 17,
    title: '비상금 5만 원',
    body: '비상금이 0원이면 작은 사고도 새 빚이 돼요. 5만 원 한 장만 따로 두어도 흐름이 바뀝니다.',
    affirmation: '나는 작은 안전망 한 장을 먼저 둡니다.',
    category: 'action',
  },
  {
    id: 18,
    title: '충동의 24시간 룰',
    body: '사고 싶은 게 떠오르면 24시간만 묵혀보세요. 다음 날에도 진심이면 그건 진짜 필요한 별빛이에요.',
    affirmation: '나는 충동에 즉답하지 않습니다.',
    category: 'spending',
  },
  {
    id: 19,
    title: '카드를 잠시 봉투에',
    body: '쓰지 않는 카드는 봉투에 넣어 손이 안 닿는 서랍에. 마찰력 한 번이 결제 한 번을 막습니다.',
    affirmation: '나는 환경을 바꿔 결심을 지킵니다.',
    category: 'spending',
  },
  {
    id: 20,
    title: '빚을 말할 용기',
    body: '믿을 수 있는 한 사람에게 빚을 말하는 순간, 별빚은 절반 가벼워져요. 혼자 들고 있을 짐이 아닙니다.',
    affirmation: '나는 혼자 모든 걸 들지 않아도 됩니다.',
    category: 'relationship',
  },
  {
    id: 21,
    title: '도움 요청은 약함이 아니다',
    body: '신용회복위원회·사회복지·가족, 모두 별빛입니다. 받는 것도 갚을 줄 아는 사람의 자격이에요.',
    affirmation: '나는 도움을 받을 자격이 있습니다.',
    category: 'relationship',
  },
  {
    id: 22,
    title: '관혼상제의 무게',
    body: '경조사비는 우정도 풍요도 아니에요. 형편에 맞는 작은 마음이, 거짓 풍요보다 오래 빛납니다.',
    affirmation: '나는 진짜 마음에 진짜 액수를 둡니다.',
    category: 'relationship',
  },
  {
    id: 23,
    title: '부수입 한 줄',
    body: '안 입는 옷 한 장, 안 쓰는 카메라 한 대. 오늘 단 한 줄의 부수입이 다음 빚돌을 깹니다.',
    affirmation: '나는 가진 것에서부터 빛을 끌어냅니다.',
    category: 'action',
  },
  {
    id: 24,
    title: '절약은 의지가 아니라 환경',
    body: '냉장고 정리, 장보기 목록, 결제 알림. 환경이 절약을 대신해주면 의지는 다른 별을 비춥니다.',
    affirmation: '나는 의지를 아껴 다른 별에 씁니다.',
    category: 'action',
  },
  {
    id: 25,
    title: '회복은 직선이 아니다',
    body: '한 달 잘 갚다 한 번 무너져도 출발점이 아니에요. 들쭉날쭉해도 평균은 위로 갑니다.',
    affirmation: '나는 흔들려도 방향을 잃지 않습니다.',
    category: 'recovery',
  },
  {
    id: 26,
    title: '월말 5분 의식',
    body: '매달 마지막 날 5분, 잔액·이번 달 갚은 액·다음 달 갚을 액 세 줄만 적어두세요. 별이 늘어나는 게 보입니다.',
    affirmation: '나는 매달 별을 다시 셉니다.',
    category: 'action',
  },
  {
    id: 27,
    title: '기록은 거울',
    body: '쓴 걸 적기만 해도 다음 달 지출이 줄어요. 보이는 순간 인간은 자연히 정돈됩니다.',
    affirmation: '나는 보이게 두는 사람입니다.',
    category: 'spending',
  },
  {
    id: 28,
    title: '빚의 진짜 비용',
    body: '연 18% 카드론 100만 원은 1년 18만 원입니다. 그 18만 원이면 비상금이 거의 절반이에요.',
    affirmation: '나는 이자를 작게 만드는 사람입니다.',
    category: 'spending',
  },
  {
    id: 29,
    title: '만남의 별빛',
    body: '돈 없이도 빛나는 만남이 있습니다. 산책, 도서관, 따뜻한 물 한 잔. 풍요는 가격표가 없어요.',
    affirmation: '나는 가격표 없는 풍요를 안다.',
    category: 'relationship',
  },
  {
    id: 30,
    title: '다시 시작',
    body: '실수한 그날도 별이 떴어요. 어제와 다른 오늘 한 가지가, 새 별의 첫 빛입니다.',
    affirmation: '나는 매일 새로 시작할 수 있습니다.',
    category: 'recovery',
  },
];

export function getDailyInsight(seed: number, dateStr: string): Insight {
  const d = new Date(dateStr || new Date().toISOString());
  const dayKey = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const idx = (dayKey + seed) % INSIGHTS.length;
  return INSIGHTS[idx];
}
