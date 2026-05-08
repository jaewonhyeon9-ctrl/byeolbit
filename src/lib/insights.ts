export interface Insight {
  id: number;
  title: string;
  body: string;
  affirmation: string;
}

export const INSIGHTS: Insight[] = [
  {
    id: 1,
    title: '빚도 별이다',
    body: '빚은 부끄러운 게 아닙니다. 잠시 흐려진 별일 뿐. 갚는 순간 다시 빛납니다.',
    affirmation: '나의 별빚은 곧 별빛이 됩니다.',
  },
  {
    id: 2,
    title: '한 걸음의 위력',
    body: '오늘 만 원을 갚는다고 4억이 사라지지 않아요. 하지만 그 한 걸음이 없으면 아무것도 사라지지 않습니다.',
    affirmation: '오늘의 작은 한 걸음이 별빛이 됩니다.',
  },
  {
    id: 3,
    title: '풍요는 이미 안에',
    body: '돈은 결과지 원인이 아니에요. 풍요로운 마음이 풍요로운 통장을 끌어옵니다.',
    affirmation: '나는 이미 풍요로 향하고 있습니다.',
  },
  {
    id: 4,
    title: '과거 나를 용서하기',
    body: '그때의 나는 그때의 정보로 최선이었어요. 지금의 나는 더 많은 것을 알고 더 잘할 수 있습니다.',
    affirmation: '과거의 나를 안아주고 오늘을 시작합니다.',
  },
  {
    id: 5,
    title: '비교하지 않기',
    body: '남의 별을 부러워하면 내 별이 어두워 보여요. 내 우주는 내 속도로 빛나면 됩니다.',
    affirmation: '나는 나의 시간표대로 빛납니다.',
  },
  {
    id: 6,
    title: '오늘의 감사 한 가지',
    body: '아무리 작은 것이라도 좋아요. 따뜻한 물, 누군가의 안부, 이 앱을 켠 나 자신.',
    affirmation: '감사가 풍요의 문을 엽니다.',
  },
  {
    id: 7,
    title: '완벽한 출발은 없다',
    body: '계획이 완벽해질 때를 기다리면 평생 못 시작해요. 부족한 채로 오늘 한 발만 나가세요.',
    affirmation: '나는 부족한 채로도 충분히 시작합니다.',
  },
  {
    id: 8,
    title: '돈에게 친절하기',
    body: '"돈이 무서워" 대신 "돈아 와줘서 고마워". 돈은 듣고 있고, 우주도 듣고 있습니다.',
    affirmation: '나는 돈에게 친절한 사람입니다.',
  },
  {
    id: 9,
    title: '부정의 별빚부터',
    body: '이율 높은 빚은 매일 우주의 빛을 빨아먹어요. 부정 별빚을 가장 먼저 깨세요.',
    affirmation: '오늘 가장 무거운 빚을 한 칸 줄입니다.',
  },
  {
    id: 10,
    title: '자기 자비',
    body: '자기 비난은 별을 더 흐리게 할 뿐이에요. 친한 친구에게 하듯 나에게 말해주세요.',
    affirmation: '나는 나에게 친절합니다.',
  },
  {
    id: 11,
    title: '한 번에 한 별',
    body: '4억을 한 번에 보면 막막해요. 가장 작은 별빚 하나만 보세요. 그것만 깨면 됩니다.',
    affirmation: '오늘 나는 단 하나의 별만 봅니다.',
  },
  {
    id: 12,
    title: '풍요의 언어',
    body: '"없어"보다 "아직"을, "못해"보다 "지금은"을. 단어가 바뀌면 우주가 바뀝니다.',
    affirmation: '내 입에서 풍요의 언어가 흐릅니다.',
  },
  {
    id: 13,
    title: '두려움 인정하기',
    body: '두려움을 외면하면 더 커져요. "그래, 무서워"라고 말하면 두려움도 별이 됩니다.',
    affirmation: '나는 두려움도 안고 갈 수 있습니다.',
  },
  {
    id: 14,
    title: '지출은 가치의 거울',
    body: '지난 한 주 가장 큰 지출이 정말 나를 행복하게 했나요? 가치 없는 별빚을 줄여보세요.',
    affirmation: '나는 가치 있는 곳에 빛을 둡니다.',
  },
  {
    id: 15,
    title: '별빛의 약속',
    body: '오늘 흐려도, 내일 빛날 수 있어요. 별빛이 되는 순간까지, 함께 갑니다.',
    affirmation: '나는 별빛이 되는 중입니다.',
  },
];

export function getDailyInsight(seed: number, dateStr: string): Insight {
  const d = new Date(dateStr || new Date().toISOString());
  const dayKey = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const idx = (dayKey + seed) % INSIGHTS.length;
  return INSIGHTS[idx];
}
