import crypto from 'crypto';

/**
 * Generate a deterministic idempotency key for an individual email dispatch job.
 */
export const generateEmailJobKey = (
  campaignId: string,
  recipient: string,
  scheduledAt: Date | string
): string => {
  const timeStr = typeof scheduledAt === 'string' ? scheduledAt : scheduledAt.toISOString();
  const payload = `${campaignId}:${recipient.toLowerCase().trim()}:${timeStr}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
};

/**
 * Generate a hash for a campaign to prevent accidental duplicate submission.
 */
export const generateCampaignHash = (
  userId: string,
  subject: string,
  recipients: string[]
): string => {
  const sortedRecipients = [...recipients].map((r) => r.toLowerCase().trim()).sort().join(',');
  const payload = `${userId}:${subject.trim()}:${sortedRecipients}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
};
