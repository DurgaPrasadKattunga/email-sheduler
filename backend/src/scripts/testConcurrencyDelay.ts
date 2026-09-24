import { rateLimitService } from '../services/rateLimit.service';
import { logger } from '../utils/logger';

async function testConcurrencyDelay() {
  logger.info('⏱️ Testing Minimum Delay Spacing & Concurrency Throttling...');

  const senderId = `test_sender_delay_${Date.now()}`;
  const minDelayMs = 2000;

  logger.info({ senderId, minDelayMs }, 'Step 1: First send for sender');
  const t0 = Date.now();
  const wait0 = await rateLimitService.enforceMinimumDelay(senderId, minDelayMs);
  logger.info({ wait0, elapsedMs: Date.now() - t0 }, 'Send 1 completed immediately');

  logger.info('Step 2: Rapid consecutive send for same sender (simulating concurrent worker)');
  const t1 = Date.now();
  const wait1 = await rateLimitService.enforceMinimumDelay(senderId, minDelayMs);
  const totalElapsed1 = Date.now() - t1;

  logger.info(
    { wait1, totalElapsed1, minDelayMs },
    'Send 2 completed with throttled spacing'
  );

  if (totalElapsed1 >= 1800) {
    logger.info(
      `✅ SUCCESS: Minimum delay of ${minDelayMs}ms was accurately enforced by Redis (${totalElapsed1}ms elapsed)!`
    );
  } else {
    logger.error(`❌ FAILURE: Minimum delay was not enforced (${totalElapsed1}ms elapsed).`);
    process.exit(1);
  }

  process.exit(0);
}

testConcurrencyDelay().catch((err) => {
  logger.error({ err }, 'Concurrency test failed');
  process.exit(1);
});
