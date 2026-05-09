import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/api-limits';

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const ID_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789';
const MAX_TTL = 30 * 24 * 60 * 60;
const MIN_TTL = 60;
const MAX_BLOB_BYTES = 800_000;

function generateId(len = 10): string {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  let id = '';
  for (const v of arr) id += ID_CHARS[v % ID_CHARS.length];
  return id;
}

async function kvSet(key: string, value: string, ttl: number) {
  if (!KV_URL || !KV_TOKEN) throw new Error('KV not configured');
  const res = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}?EX=${ttl}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'text/plain',
    },
    body: value,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`KV SET ${res.status}: ${text}`);
  }
}

export async function POST(req: NextRequest) {
  if (!KV_URL || !KV_TOKEN) {
    return NextResponse.json(
      {
        error:
          '공유 기능 백엔드 미설정 — Vercel Storage에서 Upstash Redis (또는 KV) 연결 필요',
      },
      { status: 503 }
    );
  }

  const ip = clientIp(req);
  const rl = await rateLimit('share-create', ip, 20, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `공유 링크 발급이 너무 잦아요. 1시간 뒤 다시 시도해주세요. (${rl.count}/${rl.limit})` },
      { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
    );
  }

  try {
    const body = await req.json();
    const { ciphertext, iv, ttl } = body as {
      ciphertext?: string;
      iv?: string;
      ttl?: number;
    };

    if (!ciphertext || !iv) {
      return NextResponse.json(
        { error: '암호화된 데이터(ciphertext/iv) 누락' },
        { status: 400 }
      );
    }
    if (ciphertext.length > MAX_BLOB_BYTES) {
      return NextResponse.json(
        {
          error: `데이터가 너무 커요 (${Math.round(ciphertext.length / 1024)}KB). 최대 ${MAX_BLOB_BYTES / 1024}KB.`,
        },
        { status: 413 }
      );
    }

    const ttlSeconds = Math.min(
      Math.max(Number(ttl) || 7 * 24 * 60 * 60, MIN_TTL),
      MAX_TTL
    );

    let id = generateId(10);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await kvSet(`byeolbit:share:${id}`, JSON.stringify({ ciphertext, iv }), ttlSeconds);
        break;
      } catch (e) {
        if (attempt === 2) throw e;
        id = generateId(10);
      }
    }

    return NextResponse.json({
      id,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      ttlSeconds,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '공유 링크 생성 실패';
    console.error('share create error', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const runtime = 'nodejs';
