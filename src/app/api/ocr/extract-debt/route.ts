import { NextRequest, NextResponse } from 'next/server';

const MODEL = 'gemini-2.5-flash';

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING', nullable: true },
    category: {
      type: 'STRING',
      nullable: true,
      enum: [
        'mortgage',
        'jeonse',
        'business',
        'student',
        'auto',
        'card',
        'personal',
        'private',
        'medical',
        'family',
        'other',
      ],
    },
    principal: { type: 'INTEGER', nullable: true },
    originalAmount: { type: 'INTEGER', nullable: true },
    interestRate: { type: 'NUMBER', nullable: true },
    minPayment: { type: 'INTEGER', nullable: true },
    dueDay: { type: 'INTEGER', nullable: true },
    note: { type: 'STRING', nullable: true },
    confidence: { type: 'NUMBER' },
  },
  required: ['confidence'],
};

const PROMPT = `이 이미지는 한국의 부채/대출 관련 화면 캡처입니다 (은행 앱, 카드사 앱, 대출 명세서, 이체 내역, 마이페이지 등).

이미지에서 다음 정보를 추출하여 JSON으로만 응답하세요. 친절한 설명·인사·markdown 절대 금지.

- name: 빚을 부르기 좋은 짧은 이름. 금융사명 + 상품명. 예: "신한카드 카드론", "국민은행 주택담보대출"
- category: 다음 중 정확히 하나 선택
  - mortgage: 주택담보대출
  - jeonse: 전세자금대출
  - business: 사업자대출
  - student: 학자금대출
  - auto: 자동차 할부
  - card: 카드론·현금서비스·리볼빙·카드 결제 미납
  - personal: 일반 신용대출 (마이너스통장 포함)
  - private: 사채
  - medical: 의료비 대출
  - family: 가족·지인 차용
  - other: 기타
- principal: 현재 남은 원금/잔액 (원 단위 정수). "12,345,678원" → 12345678. "1,234만원" → 12340000. "1.2억" → 120000000.
- originalAmount: 처음 빌린 금액 (이미지에 있을 때만), 정수
- interestRate: 연 이율 숫자만 (% 기호 제외). "연 14.5%" → 14.5. "월 1.2%" → 14.4 (×12 환산).
- minPayment: 월 최소 상환액 (원), 정수
- dueDay: 매월 상환일 (1-31 정수)
- note: 이미지에서 본 추가 메모/특이사항 (있을 때만)
- confidence: 0~1 사이 추출 신뢰도. 이미지가 명확하면 0.9+, 흐릿하거나 일부 추정이면 0.5~0.8, 거의 못 읽었으면 0.3 미만.

확실하지 않은 필드는 null. principal과 interestRate가 가장 중요하니 우선 추출.
이미지가 부채 관련이 아니면 confidence를 0.1로 두고 다른 필드는 모두 null.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY 미설정' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { image, mimeType } = body as { image?: string; mimeType?: string };

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: '이미지 데이터 누락' }, { status: 400 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: mimeType || 'image/jpeg',
                  data: image,
                },
              },
              { text: PROMPT },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: SCHEMA,
          temperature: 0.1,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini error', geminiRes.status, errText);
      return NextResponse.json(
        { error: 'OCR 처리 중 오류가 발생했어요', detail: errText },
        { status: 502 }
      );
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json(
        { error: '응답이 비어있어요. 더 또렷한 이미지로 다시 시도해주세요.' },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'OCR 처리 실패';
    console.error('OCR route error', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 30;
