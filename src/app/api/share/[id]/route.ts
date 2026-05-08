import { NextRequest, NextResponse } from 'next/server';

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function kvGet(key: string): Promise<string | null> {
  if (!KV_URL || !KV_TOKEN) throw new Error('KV not configured');
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KV GET ${res.status}: ${text}`);
  }
  const data = (await res.json()) as { result: string | null };
  return data.result ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!KV_URL || !KV_TOKEN) {
    return NextResponse.json({ error: '백엔드 미설정' }, { status: 503 });
  }

  const { id } = await params;
  if (!id || !/^[a-z0-9]{6,32}$/.test(id)) {
    return NextResponse.json({ error: '잘못된 공유 ID' }, { status: 400 });
  }

  try {
    const value = await kvGet(`byeolbit:share:${id}`);
    if (!value) {
      return NextResponse.json(
        { error: '만료되었거나 존재하지 않는 공유 링크예요.' },
        { status: 404 }
      );
    }
    const parsed = JSON.parse(value) as {
      ciphertext: string;
      iv: string;
    };
    return NextResponse.json(parsed, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '공유 데이터 조회 실패';
    console.error('share get error', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const runtime = 'nodejs';
