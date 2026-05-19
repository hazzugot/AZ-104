import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

/**
 * Shared ioredis client. `lazyConnect` prevents Next.js builds from opening
 * sockets during static analysis; first real call triggers connection.
 */
export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

/** Cache wrapper with stampede protection via SETNX lock. */
export async function cached<T>(
  key: string,
  ttlSec: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = await redis.get(key);
  if (hit) {
    try {
      return JSON.parse(hit) as T;
    } catch {
      // fall through on corrupt cache entry
    }
  }

  const lockKey = `${key}:lock`;
  const gotLock = await redis.set(lockKey, "1", "EX", 30, "NX");
  if (!gotLock) {
    // Another worker is loading — short wait and re-read.
    await new Promise((r) => setTimeout(r, 250));
    const second = await redis.get(key);
    if (second) return JSON.parse(second) as T;
  }

  try {
    const value = await loader();
    await redis.set(key, JSON.stringify(value), "EX", ttlSec);
    return value;
  } finally {
    await redis.del(lockKey);
  }
}
