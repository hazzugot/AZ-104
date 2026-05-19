import { redis } from "./redis";

/**
 * Fixed-window rate limiter backed by Redis.
 * Returns { ok, remaining, resetAt }. Use Upstash Ratelimit for serverless edge.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
  const bucket = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSec)}`;
  const count = await redis.incr(bucket);
  if (count === 1) await redis.expire(bucket, windowSec);
  const ttl = await redis.ttl(bucket);
  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: Date.now() + ttl * 1000,
  };
}
