import { Request, Response } from 'express';
import { slackService } from '../services/slack.service';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const slackController = {
  /**
   * GET /api/slack/connect - Redirect to Slack OAuth authorization page
   */
  connect: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    let userId = req.user?.id;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      userId = defaultUser?.id;
    }

    if (!userId) {
      res.redirect(`${env.FRONTEND_URL}/login?error=unauthorized`);
      return;
    }

    // In dev mode when credentials aren't set yet, connect mock Slack workspace for testing
    if (!env.SLACK_CLIENT_ID || env.SLACK_CLIENT_ID.includes('your-slack-client-id')) {
      await slackService.saveSlackConnection(userId, 'T_DEV_WORKSPACE', 'xoxb-mock-dev-token');
      res.redirect(`${env.FRONTEND_URL}/dashboard?slack=connected`);
      return;
    }

    const authUrl = slackService.getSlackAuthUrl(userId);
    res.redirect(authUrl);
  }),

  /**
   * GET /api/slack/callback - Handle Slack OAuth redirect callback
   */
  callback: asyncHandler(async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const stateUserId = req.query.state as string;

    if (!code) {
      res.redirect(`${env.FRONTEND_URL}/dashboard?slack=failed`);
      return;
    }

    try {
      const tokenData = await slackService.exchangeCodeForToken(code);
      const teamId = tokenData.team?.id || tokenData.incoming_webhook?.channel_id || 'DEFAULT_TEAM';
      const accessToken = tokenData.access_token || 'ACCESS_TOKEN';

      let targetUserId = stateUserId;
      if (!targetUserId) {
        const defaultUser = await prisma.user.findFirst();
        targetUserId = defaultUser?.id || '';
      }

      if (targetUserId) {
        await slackService.saveSlackConnection(targetUserId, teamId, accessToken);
      }

      res.redirect(`${env.FRONTEND_URL}/dashboard?slack=connected`);
    } catch {
      res.redirect(`${env.FRONTEND_URL}/dashboard?slack=error`);
    }
  }),

  /**
   * POST /api/slack/disconnect - Remove Slack connection
   */
  disconnect: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    let userId = req.user?.id;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      userId = defaultUser?.id;
    }

    if (!userId) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    await slackService.disconnectSlack(userId);

    res.status(200).json({
      success: true,
      message: 'Slack connection removed successfully',
    });
  }),

  /**
   * GET /api/slack/status - Retrieve current Slack connection status
   */
  status: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    let userId = req.user?.id;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      userId = defaultUser?.id;
    }

    if (!userId) {
      res.status(200).json({ success: true, connected: false });
      return;
    }

    const status = await slackService.getConnectionStatus(userId);

    res.status(200).json({
      success: true,
      ...status,
    });
  }),
};
