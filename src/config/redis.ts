import Redis from 'ioredis';
import { createLogger } from './logger';
import { getEnv } from './env';

const log = createLogger('redis');

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (redis) return redis;

  const env = getEnv();
  redis = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        log.error('Redis connection failed after 3 retries');
        return null;
      }
      return Math.min(times * 100, 3000);
    },
    reconnectOnError: (err) => {
      log.error({ err }, 'Redis reconnect on error');
      return true;
    },
  });

  redis.on('connect', () => {
    log.info('Redis connected');
  });

  redis.on('error', (err) => {
    log.error({ err }, 'Redis error');
  });

  redis.on('reconnecting', () => {
    log.warn('Redis reconnecting');
  });

  return redis;
}

export async function connectRedis(): Promise<void> {
  const r = getRedis();
  await r.ping();
  log.info('Redis health check passed');
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    log.info('Redis disconnected');
  }
}

export async function healthCheckRedis(): Promise<boolean> {
  try {
    const r = getRedis();
    const result = await r.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}