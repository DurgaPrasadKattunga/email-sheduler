export type EmailStatus = 'scheduled' | 'processing' | 'sent' | 'failed' | 'rate_limited';

export interface Email {
  id: string;
  campaignId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  status: EmailStatus;
  jobId?: string | null;
  attempts: number;
  sentAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}
