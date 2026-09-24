export interface Campaign {
  id: string;
  userId: string;
  subject: string;
  body: string;
  startTime: string;
  delayMs: number;
  hourlyLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleCampaignPayload {
  subject: string;
  body: string;
  recipients: string[];
  startTime: string;
  delayMs?: number;
  hourlyLimit?: number;
}
