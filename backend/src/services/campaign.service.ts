import { prisma } from '../config/database';
import { ApiError } from '../utils/apiError';

export interface CreateCampaignParams {
  userId: string;
  subject: string;
  body: string;
  startTime: Date;
  delayMs?: number;
  hourlyLimit?: number;
}

export const campaignService = {
  /**
   * Create a new campaign record in PostgreSQL
   */
  async createCampaign(params: CreateCampaignParams) {
    const { userId, subject, body, startTime, delayMs = 2000, hourlyLimit = 100 } = params;

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiError.notFound(`User with id ${userId} not found`);
    }

    const campaign = await prisma.campaign.create({
      data: {
        userId,
        subject,
        body,
        startTime,
        delayMs,
        hourlyLimit,
      },
    });

    return campaign;
  },

  /**
   * Retrieve all campaigns for a specific user with aggregated status metrics
   */
  async getUserCampaigns(userId: string) {
    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      include: {
        _count: {
          select: { emails: true },
        },
        emails: {
          select: {
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns.map((camp) => {
      const stats = {
        total: camp._count.emails,
        scheduled: camp.emails.filter((e) => e.status === 'scheduled').length,
        processing: camp.emails.filter((e) => e.status === 'processing').length,
        sent: camp.emails.filter((e) => e.status === 'sent').length,
        failed: camp.emails.filter((e) => e.status === 'failed').length,
        rate_limited: camp.emails.filter((e) => e.status === 'rate_limited').length,
      };

      return {
        id: camp.id,
        userId: camp.userId,
        subject: camp.subject,
        body: camp.body,
        startTime: camp.startTime,
        delayMs: camp.delayMs,
        hourlyLimit: camp.hourlyLimit,
        createdAt: camp.createdAt,
        updatedAt: camp.updatedAt,
        stats,
      };
    });
  },

  /**
   * Get single campaign by ID
   */
  async getCampaignById(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { emails: true } },
      },
    });

    if (!campaign) {
      throw ApiError.notFound(`Campaign ${campaignId} not found`);
    }

    return campaign;
  },

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      throw ApiError.notFound(`Campaign ${campaignId} not found`);
    }

    await prisma.campaign.delete({ where: { id: campaignId } });
    return { success: true, message: `Campaign ${campaignId} deleted` };
  },
};
