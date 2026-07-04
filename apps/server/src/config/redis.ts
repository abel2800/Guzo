import { env } from './env.js';
import { logger } from './logger.js';

/**
 * Redis is OPTIONAL. The platform runs fully on PostgreSQL alone.
 * When REDIS_ENABLED=true and `ioredis` is installed, we connect lazily.
 * Everything that uses caching/pub-sub should depend on `getRedis()` and
 * gracefully fall back when it returns null. This is the seam that lets you
 * later add Redis clusters / BullMQ / Socket.IO adapter without touching
 * business logic.
 */

// Loosely typed to avoid a hard dependency on ioredis types.
type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
  del(key: string): Promise<unknown>;
  on(event: string, cb: (...a: unknown[]) => void): unknown;
};

let client: RedisLike | null = null;
let initialized = false;

export async function initRedis(): Promise<RedisLike | null> {
  if (initialized) return client;
  initialized = true;

  if (!env.redis.enabled) {
    logger.info('Redis disabled (REDIS_ENABLED=false). Running PostgreSQL-only.');
    return null;
  }

  try {
    const { default: Redis } = await import('ioredis');
    client = new Redis(env.redis.url) as unknown as RedisLike;
    client.on('connect', () => logger.info('Redis connected'));
    client.on('error', (err) => logger.error(`Redis error: ${String(err)}`));
    return client;
  } catch (err) {
    logger.warn(`Redis enabled but unavailable (${String(err)}). Falling back to no-cache mode.`);
    client = null;
    return null;
  }
}

export function getRedis(): RedisLike | null {
  return client;
}
