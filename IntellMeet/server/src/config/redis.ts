import Redis from 'ioredis';
import { config } from './index';

let redis: Redis | null = null;

export const connectRedis = async (): Promise<Redis | null> => {
  try {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('⚠️ Redis connection failed, running without cache');
          return null;
        }
        return Math.min(times * 200, 1000);
      },
    });

    redis.on('connect', () => console.log('✅ Redis connected'));
    redis.on('error', (err) => {
      console.warn('⚠️ Redis error (non-fatal):', err.message);
    });

    return redis;
  } catch (error) {
    console.warn('⚠️ Redis not available, running without cache');
    return null;
  }
};

export const getRedis = (): Redis | null => redis;
