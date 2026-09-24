export interface SendEmailJobData {
  emailId: string;
  campaignId: string;
  senderId: string;
  userId?: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  delayMs?: number;
  hourlyLimit?: number;
}

export interface SendEmailJobResult {
  emailId: string;
  success: boolean;
  messageId?: string;
  sentAt?: string;
  error?: string;
  rescheduled?: boolean;
  rescheduledFor?: string;
}

export interface QueueStats {
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
  paused: number;
}
