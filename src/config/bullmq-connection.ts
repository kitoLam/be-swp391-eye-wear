import IORedis from 'ioredis';
import { config } from './env.config';

// Dùng chung một connection instance cho tất cả những gì liên quan đến BullMQ
export const bullMqConnection = new IORedis('rediss://default:AUQxAAIncDIzOTQ0Y2E4ODJmZTM0MDVjYmMzYmRlMWUzNDQ2ZjU1MnAyMTc0NTc@relaxing-squirrel-17457.upstash.io:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});