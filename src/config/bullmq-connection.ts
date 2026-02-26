import IORedis from 'ioredis';
import { config } from './env.config';

// Dùng chung một connection instance cho tất cả những gì liên quan đến BullMQ
export const bullMqConnection = new IORedis(config.redis.bullMQ_URL, {
  maxRetriesPerRequest: false as any,
  enableReadyCheck: false,
});