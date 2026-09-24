import { rateLimitService } from '../services/rateLimit.service';
import { prisma } from '../config/database';
import { processEmailJob } from '../queue/email.worker';
import { logger } from '../utils/logger';
import { Job } from 'bullmq';
import { SendEmailJobData, SendEmailJobResult } from '../types/queue.types';

async function testRateLimiting() {
  logger.info('🚦 Testing Redis Atomic Hourly Rate Limiting and Automatic Rescheduling...');

  const user = await prisma.user.findFirst();
  if (!user) {
    logger.error('No user found');
    process.exit(1);
  }

  const sender = await prisma.sender.create({
    data: {
      userId: user.id,
      email: `rate.limit.test.${Date.now()}@ethereal.email`,
      etherealUsername: `rl_${Date.now()}`,
      etherealPasswordEncrypted: 'mock_pass',
    },
  });

  const campaign = await prisma.campaign.create({
    data: {
      userId: user.id,
      subject: 'Hourly Rate Limit Test Campaign',
      body: 'Testing hourly limit of 2 emails/hour.',
      startTime: new Date(),
      hourlyLimit: 2, // Strict limit of 2 emails per hour
      delayMs: 0,
    },
  });

  // Create 3 email records in DB
  const email1 = await prisma.email.create({
    data: {
      campaignId: campaign.id,
      senderId: sender.id,
      recipient: 'recipient1@example.com',
      subject: campaign.subject,
      body: campaign.body,
      scheduledAt: new Date(),
      status: 'scheduled',
    },
  });

  const email2 = await prisma.email.create({
    data: {
      campaignId: campaign.id,
      senderId: sender.id,
      recipient: 'recipient2@example.com',
      subject: campaign.subject,
      body: campaign.body,
      scheduledAt: new Date(),
      status: 'scheduled',
    },
  });

  const email3 = await prisma.email.create({
    data: {
      campaignId: campaign.id,
      senderId: sender.id,
      recipient: 'recipient3@example.com',
      subject: campaign.subject,
      body: campaign.body,
      scheduledAt: new Date(),
      status: 'scheduled',
    },
  });

  const makeJob = (email: typeof email1) =>
    ({
      id: `job_${email.id}`,
      data: {
        emailId: email.id,
        campaignId: campaign.id,
        senderId: sender.id,
        userId: user.id,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        scheduledAt: email.scheduledAt.toISOString(),
        hourlyLimit: 2,
        delayMs: 0,
      },
      attemptsMade: 0,
    } as unknown as Job<SendEmailJobData, SendEmailJobResult>);

  // Execute Email 1 (should succeed: 1/2)
  logger.info('--- Processing Email 1 (Limit: 2) ---');
  const res1 = await processEmailJob(makeJob(email1));
  logger.info({ res1 }, 'Result Email 1');

  // Execute Email 2 (should succeed: 2/2)
  logger.info('--- Processing Email 2 (Limit: 2) ---');
  const res2 = await processEmailJob(makeJob(email2));
  logger.info({ res2 }, 'Result Email 2');

  // Execute Email 3 (should be rate limited and rescheduled!)
  logger.info('--- Processing Email 3 (Exceeds Limit: 3/2) ---');
  const res3 = await processEmailJob(makeJob(email3));
  logger.info({ res3 }, 'Result Email 3');

  // Verify Email 3 status in PostgreSQL
  const updatedEmail3 = await prisma.email.findUnique({ where: { id: email3.id } });
  logger.info({ updatedEmail3 }, 'Database state of Email 3');

  if (res3.rescheduled && updatedEmail3?.status === 'rate_limited') {
    logger.info('✅ SUCCESS: Email 3 was gracefully rate-limited, marked "rate_limited" in PostgreSQL, and rescheduled for the next clock hour!');
  } else {
    logger.error('❌ FAILURE: Rate limit was not enforced properly.');
    process.exit(1);
  }

  process.exit(0);
}

testRateLimiting().catch((err) => {
  logger.error({ err }, 'Rate limiting test failed');
  process.exit(1);
});
