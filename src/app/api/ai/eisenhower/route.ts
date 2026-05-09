import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/api-limits';

const MODEL = 'gemini-2.5-flash';

const ITEM_SCHEMA = {
  type: 'OBJECT',
  properties: {
    text: { type: 'STRING' },
    reason: { type: 'STRING', nullable: true },
  },
  required: ['text'],
};

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    q1: { type: 'ARRAY', items: ITEM_SCHEMA },
    q2: { type: 'ARRAY', items: ITEM_SCHEMA },
    q3: { type: 'ARRAY', items: ITEM_SCHEMA },
    q4: { type: 'ARRAY', items: ITEM_SCHEMA },
  },
  required: ['q1', 'q2', 'q3', 'q4'],
};

interface IncomingAction {
  text: string;
  subGoal: string;
}

interface IncomingPayload {
  mainGoal: string;
  subGoals: string[];
  actions: IncomingAction[];
}

const MAX_ACTIONS = 80;
const MAX_TEXT_LEN = 200;

function buildPrompt(payload: IncomingPayload): string {
  const { mainGoal, subGoals, actions } = payload;

  const subGoalLines = subGoals
    .map((s, i) => `  ${i + 1}. ${s.trim() || '(비어있음)'}`)
    .join('\n');

  const actionLines = actions
    .map((a, i) => {
      const sub = a.subGoal?.trim() || '(미지정)';
      return `  ${i + 1}. [${sub}] ${a.text.trim()}`;
    })
    .join('\n');

  return `당신은 한국어 사용자의 만다라트(Mandal-Art) 차트를 아이젠하워 매트릭스(긴급/중요 4분면)로 자동 분류하는 도구입니다.

[핵심 목표]
${mainGoal.trim() || '(미작성)'}

[8가지 세부 목표]
${subGoalLines}

[실행 항목 ${actions.length}개]
${actionLines}

위 실행 항목 ${actions.length}개를 모두 다음 4분면 중 정확히 하나에 배치하세요. 절대 누락하지 말고, 중복 배치하지 마세요.

- q1 (급함 + 중요): 마감·위기·갚아야 할 빚처럼 즉시 안 하면 손해가 나는 일
- q2 (안급함 + 중요): 핵심 목표·세부 목표 달성에 본질적이지만 데드라인이 없는 일 — 학습, 건강, 관계, 시스템화, 장기 투자
- q3 (급함 + 안중요): 마감은 있지만 사용자의 핵심 목표와 거리가 먼 일 — 타인의 요청, 잡무, 즉답 알림
- q4 (안급함 + 안중요): 시간 도둑 — 습관적 SNS, 의미 없는 영상, 안 해도 무관한 일

분류 규칙:
1. 핵심 목표가 "빚 갚기/별빚도장" 같은 재무 회복이라면, 빚 상환·이자 비용 차단·소득 증대 관련 항목은 q1 또는 q2로 우선 분류.
2. 데드라인이 명시되거나 "오늘", "이번 주", "당장" 같은 시급성 표현이 있으면 q1 또는 q3.
3. "공부하기", "운동", "장기 계획"처럼 시급성이 없지만 본질적인 자기개발은 q2.
4. "SNS 보기", "유튜브 시청", "쇼핑 구경"처럼 회복에 역행하는 습관은 q4.
5. 핵심 목표가 비어있으면 일반적 우선순위 상식으로 판단.

각 항목의 reason 필드에 한 줄로 분류 근거를 한국어로 작성하세요 (15자 내외).
응답은 JSON만. 인사말, 설명, markdown 절대 금지.`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY 미설정' }, { status: 500 });
  }

  const ip = clientIp(req);
  const rl = await rateLimit('ai-eisenhower', ip, 10, 60);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `자동 분류 요청이 너무 잦아요. 1분 뒤 다시 시도해주세요. (${rl.count}/${rl.limit})`,
      },
      { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
    );
  }

  let payload: IncomingPayload;
  try {
    const body = (await req.json()) as Partial<IncomingPayload>;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: '요청 본문이 비어있어요' }, { status: 400 });
    }
    const mainGoal = typeof body.mainGoal === 'string' ? body.mainGoal : '';
    const subGoals = Array.isArray(body.subGoals)
      ? body.subGoals.slice(0, 8).map((v) => (typeof v === 'string' ? v : ''))
      : [];
    const rawActions = Array.isArray(body.actions) ? body.actions : [];
    const actions: IncomingAction[] = [];
    for (const a of rawActions) {
      if (!a || typeof a !== 'object') continue;
      const text = typeof a.text === 'string' ? a.text.trim().slice(0, MAX_TEXT_LEN) : '';
      const subGoal =
        typeof a.subGoal === 'string' ? a.subGoal.trim().slice(0, MAX_TEXT_LEN) : '';
      if (!text) continue;
      actions.push({ text, subGoal });
      if (actions.length >= MAX_ACTIONS) break;
    }

    if (actions.length === 0) {
      return NextResponse.json(
        { error: '분류할 실행 항목이 비어있어요. 만다라트의 바깥 칸들을 채워주세요.' },
        { status: 400 }
      );
    }

    payload = {
      mainGoal: mainGoal.slice(0, MAX_TEXT_LEN),
      subGoals: subGoals.map((s) => s.slice(0, MAX_TEXT_LEN)),
      actions,
    };
  } catch {
    return NextResponse.json({ error: '요청 파싱 실패' }, { status: 400 });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(payload) }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: SCHEMA,
          temperature: 0.2,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini eisenhower error', geminiRes.status, errText);
      return NextResponse.json(
        { error: '자동 분류 처리 중 오류가 발생했어요', detail: errText },
        { status: 502 }
      );
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json(
        { error: 'AI 응답이 비어있어요. 다시 시도해주세요.' },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(text);
    return NextResponse.json({
      matrix: {
        q1: Array.isArray(parsed.q1) ? parsed.q1 : [],
        q2: Array.isArray(parsed.q2) ? parsed.q2 : [],
        q3: Array.isArray(parsed.q3) ? parsed.q3 : [],
        q4: Array.isArray(parsed.q4) ? parsed.q4 : [],
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '분류 처리 실패';
    console.error('Eisenhower route error', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 30;
