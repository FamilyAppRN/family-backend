import { Redis } from 'ioredis';
import { ENV } from './env.js';

let redis: Redis;

export function connectRedis(): Redis {
  if (redis) {
    return redis;
  }

  console.log('Connecting to Redis...');
  redis = new Redis(ENV.REDIS_URI, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected successfully.');
  });

  redis.on('error', (error) => {
    console.error('❌ Redis error:', error);
  });

  return redis;
}

export function getRedisClient(): Redis {
  if (!redis) {
    throw new Error('Redis client has not been initialized. Call connectRedis first.');
  }
  return redis;
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    console.log('🔌 Redis disconnected.');
  }
}
