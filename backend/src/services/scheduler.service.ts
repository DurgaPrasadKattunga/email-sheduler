import { prisma } from '../config/database';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/apiError';
import { parseEmailsFromCsv } from '../utils/csvParser';
import { addEmailJob } from '../queue/email.queue';
import { searchService } from './search.service';
import { EmailStatus } from '@prisma/client';

export interface ScheduleCampaignInput {
  userId: string;
  senderId?: string;
  subject: string;
  body: string;
  recipients: string[] | string;
  startTime: string | Date;
  delayMs?: number;
  hourlyLimit?: number;
}

export const schedulerService = {
  /**
   * Schedule an entire email campaign with BullMQ delayed jobs
   * Guaranteed Zero-Cron architecture
   */
  async scheduleCampaign(input: ScheduleCampaignInput) {
    const {
      userId,
      subject,
      body,
      recipients: rawRecipients,
      startTime: rawStartTime,
      delayMs = env.MIN_EMAIL_DELAY_MS || 2000,
      hourlyLimit = env.MAX_EMAILS_PER_HOUR || 100,
    } = input;

    // 1. Verify User exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiError.notFound(`User ${userId} not found`);
    }

    // 2. Resolve Sender
    let senderId = input.senderId;
    if (!senderId) {
      const existingSender = await prisma.sender.findFirst({ where: { userId } });
      if (existingSender) {
        senderId = existingSender.id;
      } else {
        // Auto-create default Ethereal sender for user
        const newSender = await prisma.sender.create({
          data: {
            userId,
            email: `${user.email.split('@')[0]}@ethereal.email`,
            etherealUsername: `ethereal_${user.id.slice(0, 8)}`,
            etherealPasswordEncrypted: 'default_ethereal_secret',
          },
        });
        senderId = newSender.id;
      }
    }

    // 3. Extract and normalize recipient emails
    let recipientList: string[] = [];
    if (typeof rawRecipients === 'string') {
      recipientList = parseEmailsFromCsv(rawRecipients);
    } else if (Array.isArray(rawRecipients)) {
      recipientList = Array.from(
        new Set(
          rawRecipients
            .flatMap((r) => parseEmailsFromCsv(r))
            .filter(Boolean)
        )
      );
    }

    if (recipientList.length === 0) {
      throw ApiError.badRequest('No valid recipient email addresses provided');
    }

    // 4. Calculate timing
    const parsedStartTime = new Date(rawStartTime);
    const nowMs = Date.now();
    const startMs = isNaN(parsedStartTime.getTime())
      ? nowMs
      : Math.max(nowMs, parsedStartTime.getTime());

    // 5. Create Campaign in PostgreSQL
    const campaign = await prisma.campaign.create({
      data: {
        userId,
        subject,
        body,
        startTime: new Date(startMs),
        delayMs,
        hourlyLimit,
      },
    });

    logger.info(
      {
        campaignId: campaign.id,
        recipientCount: recipientList.length,
        startMs: new Date(startMs).toISOString(),
        delayMs,
        hourlyLimit,
      },
      'Created Campaign, preparing BullMQ delayed email jobs'
    );

    // 6. Create Email Records and BullMQ Delayed Jobs
    const createdEmails = [];
    for (let i = 0; i < recipientList.length; i++) {
      const recipient = recipientList[i];
      const scheduledMs = startMs + i * delayMs;
      const scheduledAt = new Date(scheduledMs);
      const delayFromNow = Math.max(0, scheduledMs - Date.now());

      // Create Email row in PostgreSQL
      const email = await prisma.email.create({
        data: {
          campaignId: campaign.id,
          senderId,
          recipient,
          subject,
          body,
          scheduledAt,
          status: EmailStatus.scheduled,
          attempts: 0,
        },
      });

      const jobId = `job_${email.id}`;

      // Enqueue delayed job in BullMQ backed by Redis
      await addEmailJob(
        {
          emailId: email.id,
          campaignId: campaign.id,
          senderId,
          userId,
          recipient,
          subject,
          body,
          scheduledAt: scheduledAt.toISOString(),
          delayMs,
          hourlyLimit,
        },
        delayFromNow,
        jobId
      );

      // Update email record with BullMQ jobId
      const updatedEmail = await prisma.email.update({
        where: { id: email.id },
        data: { jobId },
      });

      // Index in Elasticsearch
      searchService.indexEmail({
        id: updatedEmail.id,
        campaignId: campaign.id,
        senderId,
        userId,
        recipient,
        subject,
        body,
        status: EmailStatus.scheduled,
        scheduledAt: scheduledAt.toISOString(),
        createdAt: updatedEmail.createdAt.toISOString(),
      }).catch((err) => logger.warn({ err }, 'Background ES indexing error'));

      createdEmails.push(updatedEmail);
    }

    return {
      success: true,
      campaign: {
        id: campaign.id,
        subject: campaign.subject,
        startTime: campaign.startTime,
        delayMs: campaign.delayMs,
        hourlyLimit: campaign.hourlyLimit,
        totalRecipients: recipientList.length,
        firstScheduledAt: createdEmails[0]?.scheduledAt,
        lastScheduledAt: createdEmails[createdEmails.length - 1]?.scheduledAt,
      },
      emails: createdEmails,
    };
  },
};
