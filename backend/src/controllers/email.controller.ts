import { Request, Response } from 'express';
import { schedulerService } from '../services/scheduler.service';
import { emailService } from '../services/email.service';
import { searchService } from '../services/search.service';
import { asyncHandler } from '../utils/asyncHandler';
import { prisma } from '../config/database';

export const emailController = {
  /**
   * Schedule campaign and enqueue BullMQ delayed jobs
   */
  schedule: asyncHandler(async (req: Request, res: Response) => {
    let userId = (req as unknown as { user?: { id: string } }).user?.id;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      userId = defaultUser?.id;
    }

    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    const {
      subject,
      body,
      recipients,
      startTime,
      delayMs,
      hourlyLimit,
      senderId,
    } = req.body;

    const result = await schedulerService.scheduleCampaign({
      userId,
      senderId,
      subject,
      body,
      recipients,
      startTime: startTime || new Date().toISOString(),
      delayMs: delayMs ? Number(delayMs) : undefined,
      hourlyLimit: hourlyLimit ? Number(hourlyLimit) : undefined,
    });

    res.status(201).json(result);
  }),

  /**
   * Get scheduled / pending emails
   */
  getScheduled: asyncHandler(async (req: Request, res: Response) => {
    let userId = (req as unknown as { user?: { id: string } }).user?.id;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      userId = defaultUser?.id;
    }

    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const campaignId = req.query.campaignId as string | undefined;

    const result = await emailService.getScheduledEmails({
      userId,
      campaignId,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result.emails,
      pagination: result.pagination,
    });
  }),

  /**
   * Get sent / completed emails
   */
  getSent: asyncHandler(async (req: Request, res: Response) => {
    let userId = (req as unknown as { user?: { id: string } }).user?.id;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      userId = defaultUser?.id;
    }

    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const campaignId = req.query.campaignId as string | undefined;

    const result = await emailService.getSentEmails({
      userId,
      campaignId,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result.emails,
      pagination: result.pagination,
    });
  }),

  /**
   * Search emails (Elasticsearch primary with PostgreSQL fallback)
   */
  search: asyncHandler(async (req: Request, res: Response) => {
    const query = (req.query.q as string) || '';
    let userId = (req as unknown as { user?: { id: string } }).user?.id;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      userId = defaultUser?.id;
    }

    // 1. Attempt Elasticsearch full-text query
    const esResult = await searchService.searchEmails(query, {
      userId,
      limit: req.query.limit ? Number(req.query.limit) : 50,
    });

    if (esResult) {
      res.status(200).json({
        success: true,
        source: 'elasticsearch',
        total: esResult.total,
        data: esResult.emails,
        query,
      });
      return;
    }

    // 2. Fallback to PostgreSQL relational search
    const emails = await prisma.email.findMany({
      where: {
        ...(userId && { campaign: { userId } }),
        ...(query && {
          OR: [
            { recipient: { contains: query, mode: 'insensitive' } },
            { subject: { contains: query, mode: 'insensitive' } },
            { body: { contains: query, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        campaign: { select: { id: true, subject: true } },
        sender: { select: { id: true, email: true } },
      },
      orderBy: { scheduledAt: 'desc' },
      take: 50,
    });

    res.status(200).json({
      success: true,
      source: 'postgresql_fallback',
      total: emails.length,
      data: emails,
      query,
    });
  }),

  /**
   * Get single email by ID
   */
  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const email = await emailService.getEmailById(id);
    res.status(200).json({ success: true, data: email });
  }),

  /**
   * Cancel scheduled email
   */
  cancel: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await emailService.cancelEmail(id);
    res.status(200).json({ success: true, data: result });
  }),
};
