export type EmailStatus = 'scheduled' | 'processing' | 'sent' | 'failed' | 'rate_limited';

export interface ScheduleCampaignInput {
  userId: string;
  senderId?: string;
  subject: string;
  body: string;
  recipients: string[];
  startTime: Date;
  delayMs?: number;
  hourlyLimit?: number;
}

export interface EmailRecord {
  id: string;
  campaignId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: Date;
  status: EmailStatus;
  jobId?: string | null;
  attempts: number;
  sentAt?: Date | null;
  errorMessage?: string | null;
}
