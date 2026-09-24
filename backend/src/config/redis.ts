import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

const isUpstash = env.REDIS_HOST.includes('upstash.io');

export const redisConnection = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  tls: isUpstash ? {} : undefined,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableReadyCheck: true,
});

redisConnection.on('connect', () => {
  logger.info('Connected to Redis');
});

redisConnection.on('error', (err) => {
  logger.warn({ err: err.message }, 'Redis connection issue');
});

export const connectRedis = async (): Promise<void> => {
  if (redisConnection.status === 'wait') {
    try {
      await redisConnection.connect();
    } catch (error) {
      logger.warn({ err: error }, 'Redis initial connection failed');
    }
  }
};

export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    const res = await redisConnection.ping();
    return res === 'PONG';
  } catch {
    return false;
  }
};
