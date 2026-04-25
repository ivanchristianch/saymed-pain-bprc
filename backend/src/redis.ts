import { Redis } from 'ioredis';
import { PIPELINE_LOCK_TTL_MS } from './constants.js';
import { getLogger } from './logger.js';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  // Queue commands while reconnecting instead of failing immediately
  enableOfflineQueue: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => Math.min(times * 200, 2000),
});

redis.on('error', (err: Error) => {
  getLogger().error({ msg: 'Redis error', err: err.message });
});

redis.on('connect', () => {
  getLogger().info({ msg: 'Redis connected', url: process.env.REDIS_URL || 'redis://localhost:6379' });
});

/**
 * Attempt to acquire a distributed lock for a given encounter pipeline.
 * Uses Redis SET NX PX to atomically set only if not already set.
 * Returns true if the lock was acquired, false if already held.
 */
export async function acquireLock(encounterId: number): Promise<boolean> {
  const key = `process_lock:encounter:${encounterId}`;
  const result = await redis.set(key, '1', 'NX', 'PX', PIPELINE_LOCK_TTL_MS);
  return result === 'OK';
}

/**
 * Release the distributed lock for a given encounter pipeline.
 */
export async function releaseLock(encounterId: number): Promise<void> {
  const key = `process_lock:encounter:${encounterId}`;
  await redis.del(key);
}
