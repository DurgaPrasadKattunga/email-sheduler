import { prisma } from '../config/database';
import { ApiError } from '../utils/apiError';
import { emailQueue } from '../queue/email.queue';
import { EmailStatus } from '@prisma/client';

export interface EmailQueryFilter {
  userId?: string;
  campaignId?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export const emailService = {
  /**
   * Fetch scheduled/pending emails
   */
  async getScheduledEmails(filter: EmailQueryFilter = {}) {
    const { userId, campaignId, page = 1, limit = 50 } = filter;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status: { in: [EmailStatus.scheduled, EmailStatus.processing, EmailStatus.rate_limited] },
    };

    if (campaignId) where.campaignId = campaignId;
    if (userId) {
      where.campaign = { userId };
    }

    const [total, emails] = await Promise.all([
      prisma.email.count({ where }),
      prisma.email.findMany({
        where,
        include: {
          campaign: { select: { id: true, subject: true, delayMs: true, hourlyLimit: true } },
          sender: { select: { id: true, email: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      emails,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Fetch sent or completed emails
   */
  async getSentEmails(filter: EmailQueryFilter = {}) {
    const { userId, campaignId, page = 1, limit = 50 } = filter;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status: { in: [EmailStatus.sent, EmailStatus.failed] },
    };

    if (campaignId) where.campaignId = campaignId;
    if (userId) {
      where.campaign = { userId };
    }

    const [total, emails] = await Promise.all([
      prisma.email.count({ where }),
      prisma.email.findMany({
        where,
        include: {
          campaign: { select: { id: true, subject: true } },
          sender: { select: { id: true, email: true } },
        },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      emails,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get single email by ID
   */
  async getEmailById(emailId: string) {
    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: {
        campaign: true,
        sender: true,
      },
    });

    if (!email) {
      throw ApiError.notFound(`Email ${emailId} not found`);
    }

    return email;
  },

  /**
   * Cancel a scheduled email before it is sent
   */
  async cancelEmail(emailId: string) {
    const email = await prisma.email.findUnique({ where: { id: emailId } });
    if (!email) {
      throw ApiError.notFound(`Email ${emailId} not found`);
    }

    if (email.status === EmailStatus.sent) {
      throw ApiError.badRequest('Cannot cancel an email that has already been sent');
    }

    // Remove BullMQ job if present
    if (email.jobId) {
      try {
        const job = await emailQueue.getJob(email.jobId);
        if (job) {
          await job.remove();
        }
      } catch {
        // Job may have already executed or been cleaned up
      }
    }

    const updated = await prisma.email.update({
      where: { id: emailId },
      data: {
        status: EmailStatus.failed,
        errorMessage: 'Cancelled by user',
      },
    });

    return updated;
  },
};
