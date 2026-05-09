import type { NextRequest } from 'next/server';

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  resetIn: number;
}

export async function rateLimit(
  bucket: string,
  ip: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  if (!KV_URL || !KV_TOKEN) {
    return { allowed: true, count: 0, limit, resetIn: windowSec };
  }
  const key = `byeolbit:rl:${bucket}:${ip}`;
  try {
    const incrRes = await fetch(`${KV_URL}/incr/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
    if (!incrRes.ok) {
      return { allowed: true, count: 0, limit, resetIn: windowSec };
    }
    const incrData = (await incrRes.json()) as { result: number };
    const count = incrData.result;

    if (count === 1) {
      await fetch(
        `${KV_URL}/expire/${encodeURIComponent(key)}/${windowSec}`,
        { method: 'POST', headers: { Authorization: `Bearer ${KV_TOKEN}` } }
      );
    }

    return {
      allowed: count <= limit,
      count,
      limit,
      resetIn: windowSec,
    };
  } catch {
    return { allowed: true, count: 0, limit, resetIn: windowSec };
  }
}

export const MAX_OCR_IMAGE_BASE64_LEN = 8_000_000;

export function checkImageSize(image: string): { ok: true } | { ok: false; error: string } {
  if (image.length > MAX_OCR_IMAGE_BASE64_LEN) {
    const mb = Math.round((image.length * 0.75) / 1024 / 1024);
    return {
      ok: false,
      error: `이미지가 너무 커요 (약 ${mb}MB). 최대 6MB까지만 처리해요. 캡처를 더 작게 잘라 다시 올려주세요.`,
    };
  }
  return { ok: true };
}
