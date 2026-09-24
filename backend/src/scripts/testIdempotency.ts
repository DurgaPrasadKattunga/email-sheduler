import { processEmailJob } from '../queue/email.worker';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { Job } from 'bullmq';
import { SendEmailJobData, SendEmailJobResult } from '../types/queue.types';

async function testIdempotency() {
  logger.info('🛡️ Running Idempotency and Duplicate Protection Test...');

  // Find a sent email
  const sentEmail = await prisma.email.findFirst({
    where: { status: 'sent' },
  });

  if (!sentEmail) {
    logger.warn('No sent email found. Please run seed or send an email first.');
    process.exit(0);
  }

  logger.info(
    { emailId: sentEmail.id, recipient: sentEmail.recipient, sentAt: sentEmail.sentAt },
    'Targeting already sent email'
  );

  const mockJob = {
    id: `mock_dup_job_${Date.now()}`,
    data: {
      emailId: sentEmail.id,
      campaignId: sentEmail.campaignId,
      senderId: sentEmail.senderId,
      recipient: sentEmail.recipient,
      subject: sentEmail.subject,
      body: sentEmail.body,
      scheduledAt: sentEmail.scheduledAt.toISOString(),
    },
    attemptsMade: 0,
  } as unknown as Job<SendEmailJobData, SendEmailJobResult>;

  const result = await processEmailJob(mockJob);

  logger.info({ result }, 'Worker result for duplicate trigger');

  if (result.messageId === 'already_sent_idempotent_skip') {
    logger.info('✅ SUCCESS: Worker successfully recognized already-sent email and skipped duplicate delivery!');
  } else {
    logger.error('❌ FAILURE: Worker did not trigger idempotency guard.');
    process.exit(1);
  }

  process.exit(0);
}

testIdempotency().catch((err) => {
  logger.error({ err }, 'Idempotency test failed');
  process.exit(1);
});
