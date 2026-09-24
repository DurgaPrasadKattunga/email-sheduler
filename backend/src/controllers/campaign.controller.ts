import { Request, Response } from 'express';
import { campaignService } from '../services/campaign.service';
import { asyncHandler } from '../utils/asyncHandler';
import { prisma } from '../config/database';

export const campaignController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    let userId = (req as unknown as { user?: { id: string } }).user?.id;
    if (!userId) {
      // Dev / testing fallback: pick first user
      const defaultUser = await prisma.user.findFirst();
      userId = defaultUser?.id;
    }

    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Authentication required' } });
      return;
    }

    const { subject, body, startTime, delayMs, hourlyLimit } = req.body;

    const campaign = await campaignService.createCampaign({
      userId,
      subject,
      body,
      startTime: new Date(startTime || Date.now()),
      delayMs: delayMs ? Number(delayMs) : undefined,
      hourlyLimit: hourlyLimit ? Number(hourlyLimit) : undefined,
    });

    res.status(201).json({
      success: true,
      data: campaign,
    });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    let userId = (req as unknown as { user?: { id: string } }).user?.id;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      userId = defaultUser?.id;
    }

    if (!userId) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const campaigns = await campaignService.getUserCampaigns(userId);
    res.status(200).json({
      success: true,
      data: campaigns,
    });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const campaign = await campaignService.getCampaignById(id);
    res.status(200).json({
      success: true,
      data: campaign,
    });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await campaignService.deleteCampaign(id);
    res.status(200).json(result);
  }),
};
