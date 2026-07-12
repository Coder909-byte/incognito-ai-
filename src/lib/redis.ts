// src/lib/redis.ts
// ioredis client — gracefully no-ops if REDIS_URL is unset (dev mode without Redis)

import Redis from 'ioredis';

let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Redis] Connection error (non-fatal in dev):', err.message);
    }
  });
}

export { redis };

/** Safe get — returns null if Redis unavailable */
export async function redisGet(key: string): Promise<string | null> {
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

/** Safe set with TTL — no-ops if Redis unavailable */
export async function redisSet(
  key: string,
  value: string,
  ttlSeconds = 300
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, 'EX', ttlSeconds);
  } catch {
    // Non-fatal
  }
}

/** Safe del — no-ops if Redis unavailable */
export async function redisDel(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // Non-fatal
  }
}
