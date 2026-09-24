import { Queue, JobsOptions } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { SendEmailJobData, SendEmailJobResult, QueueStats } from '../types/queue.types';

export const EMAIL_QUEUE_NAME = 'email-queue';

const isUpstash = env.REDIS_HOST.includes('upstash.io');

export const queueRedisConnection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  tls: isUpstash ? {} : undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

export const emailQueue = new Queue<SendEmailJobData, SendEmailJobResult>(EMAIL_QUEUE_NAME, {
  connection: queueRedisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: {
      count: 1000,
    },
    removeOnFail: {
      count: 2000,
    },
  },
});

emailQueue.on('error', (err) => {
  logger.error({ err: err.message }, 'BullMQ Email Queue error');
});

/**
 * Schedule or enqueue an email job using BullMQ delayed jobs
 * Zero cron - pure Redis-backed delayed jobs
 */
export const addEmailJob = async (
  data: SendEmailJobData,
  delayMs: number,
  customJobId?: string
) => {
  const jobOptions: JobsOptions = {
    jobId: customJobId || `job_${data.emailId}`,
    delay: Math.max(0, delayMs),
  };

  const job = await emailQueue.add('send-email', data, jobOptions);
  logger.info(
    {
      jobId: job.id,
      emailId: data.emailId,
      recipient: data.recipient,
      delayMs,
      scheduledFor: new Date(Date.now() + delayMs).toISOString(),
    },
    'Enqueued BullMQ Email Job'
  );

  return job;
};

/**
 * Fetch live queue statistics (waiting, active, delayed, completed, failed)
 */
export const getQueueStats = async (): Promise<QueueStats> => {
  const counts = await emailQueue.getJobCounts(
    'waiting',
    'active',
    'delayed',
    'completed',
    'failed',
    'paused'
  );

  return {
    waiting: counts.waiting || 0,
    active: counts.active || 0,
    delayed: counts.delayed || 0,
    completed: counts.completed || 0,
    failed: counts.failed || 0,
    paused: counts.paused || 0,
  };
};

/**
 * Graceful queue shutdown
 */
export const closeEmailQueue = async (): Promise<void> => {
  try {
    await emailQueue.close();
    logger.info('BullMQ Email Queue closed');
  } catch (error) {
    logger.warn({ error }, 'Error closing BullMQ Email Queue');
  }
};
