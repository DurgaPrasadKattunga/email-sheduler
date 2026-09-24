import { redisConnection } from '../config/redis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface RateLimitCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  nextWindowMs: number;
  nextWindow: Date;
}

export const rateLimitService = {
  /**
   * Generates a deterministic hourly window key for Redis
   * Format: email-rate:{senderId}:YYYY-MM-DDTHH
   */
  getHourWindowKey(senderId: string, date = new Date()): string {
    const hourString = date.toISOString().slice(0, 13); // e.g. "2026-09-23T18"
    return `email-rate:${senderId}:${hourString}`;
  },

  /**
   * Calculates milliseconds remaining until the start of the next clock hour
   */
  getTimeUntilNextHour(now = new Date()): { nextWindowMs: number; nextWindow: Date } {
    const nextWindow = new Date(now);
    nextWindow.setMinutes(0, 0, 0);
    nextWindow.setHours(nextWindow.getHours() + 1);

    const nextWindowMs = Math.max(1000, nextWindow.getTime() - now.getTime() + 1000); // 1s buffer into next hour
    return { nextWindowMs, nextWindow };
  },

  /**
   * Atomic check-and-increment of sender hourly rate limit in Redis.
   * Multi-worker and multi-instance safe via Redis Lua script.
   */
  async checkAndIncrementHourlyLimit(
    senderId: string,
    customLimit?: number
  ): Promise<RateLimitCheckResult> {
    const limit =
      customLimit !== undefined && customLimit > 0
        ? customLimit
        : env.MAX_EMAILS_PER_HOUR || 100;

    const now = new Date();
    const key = this.getHourWindowKey(senderId, now);
    const { nextWindowMs, nextWindow } = this.getTimeUntilNextHour(now);

    // Lua script executes atomically in Redis:
    // If current count >= limit, return [0, current] (disallowed)
    // If current count < limit, INCR and return [1, newCount] (allowed)
    const luaScript = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local current = tonumber(redis.call('get', key) or "0")
      if current >= limit then
        return {0, current}
      else
        local newCount = redis.call('incr', key)
        if newCount == 1 then
          redis.call('expire', key, 7200)
        end
        return {1, newCount}
      end
    `;

    const result = (await redisConnection.eval(
      luaScript,
      1,
      key,
      limit.toString()
    )) as [number, number];

    const allowed = result[0] === 1;
    const currentCount = result[1];

    if (!allowed) {
      logger.warn(
        { senderId, currentCount, limit, nextWindow: nextWindow.toISOString() },
        '🛑 Sender hourly rate limit reached. Rescheduling required.'
      );
    }

    return {
      allowed,
      currentCount,
      limit,
      nextWindowMs,
      nextWindow,
    };
  },

  /**
   * Fetch current hourly usage for a sender
   */
  async getHourlyUsage(senderId: string): Promise<number> {
    const key = this.getHourWindowKey(senderId);
    const val = await redisConnection.get(key);
    return val ? parseInt(val, 10) : 0;
  },

  /**
   * Reset hourly limit for a sender (useful for testing / admin reset)
   */
  async resetHourlyUsage(senderId: string): Promise<void> {
    const key = this.getHourWindowKey(senderId);
    await redisConnection.del(key);
  },

  /**
   * Enforces configurable minimum delay between email sends per sender across distributed workers.
   */
  async enforceMinimumDelay(senderId: string, customMinDelayMs?: number): Promise<number> {
    const minDelayMs =
      customMinDelayMs !== undefined && customMinDelayMs > 0
        ? customMinDelayMs
        : env.MIN_EMAIL_DELAY_MS || 2000;

    if (minDelayMs <= 0) {
      return 0;
    }

    const key = `email-last-sent:${senderId}`;
    const lastSentStr = await redisConnection.get(key);
    let waitMs = 0;

    if (lastSentStr) {
      const lastSent = parseInt(lastSentStr, 10);
      const elapsed = Date.now() - lastSent;

      if (elapsed < minDelayMs) {
        waitMs = minDelayMs - elapsed;
        logger.info(
          { senderId, waitMs, minDelayMs, elapsed },
          '⏳ Throttling: applying minimum inter-email delay spacing'
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }

    await redisConnection.set(key, Date.now().toString(), 'EX', 3600);
    return waitMs;
  },
};
