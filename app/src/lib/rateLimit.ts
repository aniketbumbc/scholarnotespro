import { connection } from "../config/redis";
const LIMIT = 5; // max requests
const WINDOW_SEC = 60; // per 60 seconds

export async function checkRateLimit(key: string): Promise<{
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}> {
  const redisKey = `ratelimit:${key}`;

  // INCR returns the new count; on first hit in a window, set the TTL.
  const count = await connection.incr(redisKey);
  if (count === 1) {
    await connection.expire(redisKey, WINDOW_SEC);
  }

  const ttl = await connection.ttl(redisKey);
  return {
    allowed: count <= LIMIT,
    remaining: Math.max(0, LIMIT - count),
    retryAfter: ttl > 0 ? ttl : WINDOW_SEC,
  };
}
