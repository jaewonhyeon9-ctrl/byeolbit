import { NextRequest, NextResponse } from 'next/server';

const MODEL = 'gemini-2.5-flash';

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    expenses: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          amount: { type: 'INTEGER' },
          date: { type: 'STRING', nullable: true },
          category: {
            type: 'STRING',
            nullable: true,
            enum: [
              'food',
              'transport',
              'housing',
              'utility',
              'shopping',
              'medical',
              'entertainment',
              'cardbill',
              'gift',
              'subscription',
              'education',
              'other',
            ],
          },
        },
        required: ['name', 'amount'],
      },
    },
    confidence: { type: 'NUMBER' },
  },
  required: ['expenses', 'confidence'],
};

const PROMPT = `이 이미지는 한국의 가계부, 카드 결제 내역, 거래 내역, 영수증, 또는 토스/뱅크샐러드/카카오페이/은행 앱의 지출 화면 캡처입니다.

이미지에서 보이는 모든 **지출 항목** (수입은 제외)을 추출해주세요. JSON으로만 응답하세요.

각 expense 항목:
- name: 지출처/상품명/내용. 예: "스타벅스 강남점", "GS25", "쿠팡", "지하철 충전", "넷플릭스"
- amount: 지출 금액 (원, 정수, 콤마/단위 제거). 마이너스 부호가 있으면 절대값 사용.
- date: YYYY-MM-DD 형식 (이미지에 있을 때만, 없으면 null)
- category: 다음 중 하나
  - food: 식비, 카페, 편의점, 마트, 음식점, 배달
  - transport: 지하철, 버스, 택시, 주유, 톨게이트, KTX, 항공권
  - housing: 월세, 관리비, 보증금
  - utility: 통신비, 전기, 가스, 수도, 인터넷
  - shopping: 옷, 가전, 화장품, 일반 쇼핑몰
  - medical: 병원, 약국, 검진
  - entertainment: 영화, 공연, OTT 결제, 게임, 노래방
  - cardbill: 카드 결제 (다른 카드사 결제, 카드값)
  - gift: 경조사, 선물, 축의금
  - subscription: 구독 (넷플릭스, 멜론, 유튜브 프리미엄, 클라우드 등)
  - education: 학원, 강의, 책
  - other: 위에 안 맞는 것

confidence: 0~1 사이 추출 신뢰도 (이미지 명확도 기반)

수입(입금/급여/이체 받음)이나 잔액은 절대 expense로 추출하지 마세요. 출금/지출만.
이체로 보내는 돈도 일반적으로 지출이 아니므로 제외하세요 (단, 카드값/공과금 송금은 cardbill/utility로 포함).
이미지에 지출 항목이 하나도 없으면 expenses는 빈 배열, confidence는 0으로 두세요.`;

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
        { error: '지출 OCR 처리 중 오류가 발생했어요', detail: errText },
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
    const msg = e instanceof Error ? e.message : 'OCR 실패';
    console.error('OCR expense route error', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 30;
