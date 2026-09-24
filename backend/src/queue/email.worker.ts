import { Worker, Job } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { EMAIL_QUEUE_NAME, queueRedisConnection, addEmailJob } from './email.queue';
import { SendEmailJobData, SendEmailJobResult } from '../types/queue.types';
import { prisma } from '../config/database';
import { smtpService } from '../services/smtp.service';
import { rateLimitService } from '../services/rateLimit.service';
import { slackService } from '../services/slack.service';
import { searchService } from '../services/search.service';
import { EmailStatus } from '@prisma/client';

let emailWorker: Worker<SendEmailJobData, SendEmailJobResult> | null = null;

/**
 * Worker processor function for email jobs
 * Strictly executes email sending with atomic CAS state transitions, hourly rate limiting,
 * automatic rescheduling, minimum delay throttling, and idempotency checks
 */
export const processEmailJob = async (
  job: Job<SendEmailJobData, SendEmailJobResult>
): Promise<SendEmailJobResult> => {
  const { emailId, recipient, subject, body, senderId, delayMs, hourlyLimit, userId } = job.data;

  logger.info(
    {
      jobId: job.id,
      emailId,
      recipient,
      attempt: job.attemptsMade + 1,
    },
    '⚡ BullMQ Worker processing email dispatch'
  );

  // 1. Atomic Compare-And-Swap (CAS) state transition in PostgreSQL
  // Prevents duplicate sends across distributed workers
  const lockResult = await prisma.email.updateMany({
    where: {
      id: emailId,
      status: { in: [EmailStatus.scheduled, EmailStatus.rate_limited] },
    },
    data: {
      status: EmailStatus.processing,
      attempts: { increment: 1 },
    },
  });

  if (lockResult.count === 0) {
    const current = await prisma.email.findUnique({ where: { id: emailId } });
    if (!current) {
      logger.warn({ emailId }, 'Job skipped: Email record not found in database');
      return { emailId, success: false, error: 'Record not found' };
    }

    if (current.status === EmailStatus.sent) {
      logger.info(
        { emailId, recipient },
        '🛡️ Idempotency: Email is already marked as SENT. Skipping duplicate send.'
      );
      return {
        emailId,
        success: true,
        messageId: 'already_sent_idempotent_skip',
        sentAt: current.sentAt?.toISOString(),
      };
    }

    if (current.status === EmailStatus.processing) {
      logger.warn(
        { emailId, recipient },
        'Job skipped: Email is currently being processed by another worker'
      );
      return { emailId, success: true, messageId: 'in_flight_concurrent_worker' };
    }

    logger.warn({ emailId, status: current.status }, 'Job skipped: Email is in non-processable state');
    return { emailId, success: false, error: `Email in state ${current.status}` };
  }

  // 2. Fetch full email record with associated sender details
  const emailRecord = await prisma.email.findUnique({
    where: { id: emailId },
    include: { sender: true, campaign: true },
  });

  if (!emailRecord) {
    logger.warn({ emailId }, 'Email record not found after lock acquisition');
    return { emailId, success: false, error: 'Record not found' };
  }

  try {
    const resolvedSenderId = senderId || emailRecord.senderId || 'default-sender';
    const effectiveHourlyLimit =
      hourlyLimit || emailRecord.campaign?.hourlyLimit || env.MAX_EMAILS_PER_HOUR || 100;
    const resolvedUserId = userId || emailRecord.campaign?.userId;
    const senderEmail = emailRecord.sender?.email || 'outreach@ethereal.email';

    // 3. Distributed Atomic Hourly Rate Limit Check (Multi-Worker Safe via Redis)
    const rateCheck = await rateLimitService.checkAndIncrementHourlyLimit(
      resolvedSenderId,
      effectiveHourlyLimit
    );

    if (!rateCheck.allowed) {
      logger.warn(
        {
          emailId,
          recipient,
          senderId: resolvedSenderId,
          limit: rateCheck.limit,
          rescheduledFor: rateCheck.nextWindow.toISOString(),
        },
        '🛑 Hourly rate limit exhausted. Gracefully rescheduling email job to next hour window.'
      );

      // A. Update PostgreSQL record to rate_limited and update scheduledAt
      await prisma.email.update({
        where: { id: emailId },
        data: {
          status: EmailStatus.rate_limited,
          scheduledAt: rateCheck.nextWindow,
          errorMessage: `Hourly rate limit (${rateCheck.limit}/hr) reached. Rescheduled to ${rateCheck.nextWindow.toISOString()}`,
        },
      });

      // B. Reschedule BullMQ delayed job for the next clock hour
      await addEmailJob(
        {
          ...job.data,
          scheduledAt: rateCheck.nextWindow.toISOString(),
        },
        rateCheck.nextWindowMs,
        `rescheduled_job_${emailId}_${Date.now()}`
      );

      // C. Trigger Slack Alert if connected
      await slackService.sendRateLimitAlert({
        userId: resolvedUserId,
        senderEmail,
        hourlyLimit: rateCheck.limit,
        nextWindow: rateCheck.nextWindow,
      });

      // D. Update Elasticsearch Document
      searchService.indexEmail({
        id: emailId,
        campaignId: emailRecord.campaignId,
        senderId: resolvedSenderId,
        userId: resolvedUserId,
        recipient,
        senderEmail,
        subject,
        body,
        status: EmailStatus.rate_limited,
        scheduledAt: rateCheck.nextWindow.toISOString(),
        errorMessage: `Hourly rate limit (${rateCheck.limit}/hr) reached. Rescheduled to ${rateCheck.nextWindow.toISOString()}`,
        createdAt: emailRecord.createdAt.toISOString(),
      }).catch((err) => logger.warn({ err }, 'Failed to update ES index on rate limit'));

      return {
        emailId,
        success: false,
        rescheduled: true,
        rescheduledFor: rateCheck.nextWindow.toISOString(),
      };
    }

    // 4. Enforce Redis-backed minimum inter-send delay spacing across concurrent workers
    await rateLimitService.enforceMinimumDelay(resolvedSenderId, delayMs);

    // 5. Dispatch through Nodemailer & Ethereal SMTP
    const sendResult = await smtpService.sendMail({
      from: senderEmail,
      to: recipient,
      subject,
      text: body,
    });

    const sentAt = new Date();

    // 6. Atomically transition state to 'sent'
    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: EmailStatus.sent,
        sentAt,
        errorMessage: null,
      },
    });

    // 7. Update Elasticsearch document
    searchService.indexEmail({
      id: emailId,
      campaignId: emailRecord.campaignId,
      senderId: resolvedSenderId,
      userId: resolvedUserId,
      recipient,
      senderEmail,
      subject,
      body,
      status: EmailStatus.sent,
      scheduledAt: emailRecord.scheduledAt.toISOString(),
      sentAt: sentAt.toISOString(),
      createdAt: emailRecord.createdAt.toISOString(),
    }).catch((err) => logger.warn({ err }, 'Failed to update ES index on sent'));

    logger.info(
      {
        emailId,
        recipient,
        messageId: sendResult.messageId,
        previewUrl: sendResult.previewUrl,
      },
      '✅ Email sent & marked SENT in DB'
    );

    return {
      emailId,
      success: true,
      messageId: sendResult.messageId,
      sentAt: sentAt.toISOString(),
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'SMTP dispatch failure';

    logger.error(
      {
        emailId,
        recipient,
        error: errorMsg,
        attempt: job.attemptsMade + 1,
      },
      '❌ Email sending failed'
    );

    await prisma.email.update({
      where: { id: emailId },
      data: {
        status: EmailStatus.failed,
        errorMessage: errorMsg,
      },
    });

    searchService.indexEmail({
      id: emailId,
      campaignId: emailRecord?.campaignId || '',
      senderId: senderId || emailRecord?.senderId || '',
      userId: userId || emailRecord?.campaign?.userId,
      recipient,
      subject,
      body,
      status: EmailStatus.failed,
      scheduledAt: emailRecord?.scheduledAt.toISOString() || new Date().toISOString(),
      errorMessage: errorMsg,
      createdAt: emailRecord?.createdAt.toISOString() || new Date().toISOString(),
    }).catch((err) => logger.warn({ err }, 'Failed to update ES index on failed'));

    throw error;
  }
};

/**
 * Initialize and start the BullMQ Email Worker
 */
export const startEmailWorker = (): Worker<SendEmailJobData, SendEmailJobResult> => {
  if (emailWorker) {
    return emailWorker;
  }

  const concurrency = env.WORKER_CONCURRENCY || 5;

  emailWorker = new Worker<SendEmailJobData, SendEmailJobResult>(
    EMAIL_QUEUE_NAME,
    async (job) => {
      return await processEmailJob(job);
    },
    {
      connection: queueRedisConnection,
      concurrency,
      useWorkerThreads: false,
      lockDuration: 30000,
    }
  );

  emailWorker.on('ready', () => {
    logger.info(
      { queue: EMAIL_QUEUE_NAME, concurrency },
      '🚀 BullMQ Email Worker is ready and listening for jobs'
    );
  });

  emailWorker.on('active', (job) => {
    logger.info(
      { jobId: job.id, recipient: job.data.recipient },
      'BullMQ Job became active'
    );
  });

  emailWorker.on('completed', (job, result) => {
    if (result.rescheduled) {
      logger.info(
        { jobId: job.id, emailId: result.emailId, rescheduledFor: result.rescheduledFor },
        'BullMQ Job gracefully rescheduled due to rate limit'
      );
    } else {
      logger.info(
        { jobId: job.id, emailId: result.emailId, messageId: result.messageId },
        'BullMQ Job completed successfully'
      );
    }
  });

  emailWorker.on('failed', (job, err) => {
    logger.error(
      {
        jobId: job?.id,
        emailId: job?.data.emailId,
        recipient: job?.data.recipient,
        error: err.message,
        attemptsMade: job?.attemptsMade,
      },
      'BullMQ Job failed'
    );
  });

  emailWorker.on('stalled', (jobId) => {
    logger.warn({ jobId }, 'BullMQ Job stalled and will be re-processed');
  });

  emailWorker.on('error', (err) => {
    logger.error({ error: err.message }, 'BullMQ Worker internal error');
  });

  return emailWorker;
};

/**
 * Graceful worker shutdown
 */
export const stopEmailWorker = async (): Promise<void> => {
  if (emailWorker) {
    try {
      logger.info('Stopping BullMQ Email Worker...');
      await emailWorker.close();
      emailWorker = null;
      logger.info('BullMQ Email Worker stopped');
    } catch (error) {
      logger.warn({ error }, 'Error stopping BullMQ Email Worker');
    }
  }
};
