import { addEmailJob, getQueueStats } from '../queue/email.queue';
import { logger } from '../utils/logger';

async function testBullMQ() {
  logger.info('Testing BullMQ delayed job enqueueing...');

  const statsBefore = await getQueueStats();
  logger.info({ statsBefore }, 'Queue Stats Before');

  // Enqueue a job with a 2-second delay
  const testJob = await addEmailJob(
    {
      emailId: `test_email_${Date.now()}`,
      campaignId: 'test_camp_001',
      senderId: 'test_sender_001',
      recipient: 'test.recipient@example.com',
      subject: 'Test BullMQ Delayed Job',
      body: 'Hello from BullMQ delayed job queue!',
      scheduledAt: new Date(Date.now() + 2000).toISOString(),
    },
    2000
  );

  logger.info({ jobId: testJob.id }, 'Job added with 2000ms delay');

  // Check delayed count
  const statsAfter = await getQueueStats();
  logger.info({ statsAfter }, 'Queue Stats After Enqueue');

  logger.info('Waiting 3.5 seconds for worker to process job...');
  await new Promise((resolve) => setTimeout(resolve, 3500));

  const statsFinal = await getQueueStats();
  logger.info({ statsFinal }, 'Queue Stats After Worker Execution');

  logger.info('BullMQ verification complete.');
  process.exit(0);
}

testBullMQ().catch((err) => {
  logger.error({ err }, 'BullMQ test failed');
  process.exit(1);
});
