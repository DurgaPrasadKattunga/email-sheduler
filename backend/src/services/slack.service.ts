import { prisma } from '../config/database';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/apiError';

export interface SlackOAuthResponse {
  ok: boolean;
  access_token?: string;
  token_type?: string;
  scope?: string;
  bot_user_id?: string;
  app_id?: string;
  team?: {
    name: string;
    id: string;
  };
  incoming_webhook?: {
    channel: string;
    channel_id: string;
    configuration_url: string;
    url: string;
  };
  error?: string;
}

export const slackService = {
  /**
   * Builds the official Slack OAuth 2.0 authorization URL
   */
  getSlackAuthUrl(userId: string): string {
    const rootUrl = 'https://slack.com/oauth/v2/authorize';
    const params = new URLSearchParams({
      client_id: env.SLACK_CLIENT_ID || '',
      scope: 'chat:write,chat:write.public,incoming-webhook',
      redirect_uri: env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/slack/callback',
      state: userId,
    });

    return `${rootUrl}?${params.toString()}`;
  },

  /**
   * Exchanges authorization code for Slack OAuth tokens
   */
  async exchangeCodeForToken(code: string): Promise<SlackOAuthResponse> {
    const tokenUrl = 'https://slack.com/api/oauth.v2.access';
    const params = new URLSearchParams({
      code,
      client_id: env.SLACK_CLIENT_ID || '',
      client_secret: env.SLACK_CLIENT_SECRET || '',
      redirect_uri: env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/slack/callback',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = (await response.json()) as SlackOAuthResponse;
    if (!data.ok) {
      logger.error({ error: data.error }, 'Slack OAuth token exchange error');
      throw ApiError.badRequest(data.error || 'Slack OAuth exchange failed');
    }

    return data;
  },

  /**
   * Store or update Slack connection securely in PostgreSQL
   */
  async saveSlackConnection(userId: string, teamId: string, accessToken: string) {
    const connection = await prisma.slackConnection.upsert({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
      update: {
        accessToken,
      },
      create: {
        userId,
        teamId,
        accessToken,
      },
    });

    logger.info({ userId, teamId }, '✅ Saved Slack Connection in PostgreSQL');
    return connection;
  },

  /**
   * Disconnect Slack for a user
   */
  async disconnectSlack(userId: string): Promise<boolean> {
    const deleted = await prisma.slackConnection.deleteMany({
      where: { userId },
    });

    logger.info({ userId, count: deleted.count }, 'Disconnected Slack connection');
    return deleted.count > 0;
  },

  /**
   * Get current Slack connection status
   */
  async getConnectionStatus(userId: string) {
    const connection = await prisma.slackConnection.findFirst({
      where: { userId },
    });

    return {
      connected: !!connection,
      teamId: connection?.teamId || null,
      connectedAt: connection?.createdAt || null,
    };
  },

  /**
   * Dispatches real-time incident notification to connected Slack workspace
   */
  async sendRateLimitAlert(params: {
    userId?: string;
    senderEmail: string;
    hourlyLimit: number;
    rescheduledCount?: number;
    nextWindow: Date;
  }): Promise<boolean> {
    const { userId, senderEmail, hourlyLimit, nextWindow } = params;

    if (!userId) {
      logger.info('No userId on job, skipping Slack alert');
      return false;
    }

    const connection = await prisma.slackConnection.findFirst({
      where: { userId },
    });

    if (!connection || !connection.accessToken) {
      logger.info({ userId }, 'Slack is not connected for this user; skipped alert');
      return false;
    }

    try {
      const messageText = `🚨 *AutoMail Rate Limit Alert*\nEmail rate limit reached for sender \`${senderEmail}\`.\n*Hourly Limit:* ${hourlyLimit} emails/hr\n*Status:* Remaining emails have been gracefully rescheduled to \`${nextWindow.toISOString()}\`.`;

      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: connection.teamId,
          text: messageText,
        }),
      });

      const resJson = (await response.json()) as { ok: boolean; error?: string };
      if (resJson.ok) {
        logger.info({ userId, senderEmail }, '📢 Real Slack incident alert posted successfully');
        return true;
      }

      logger.warn({ error: resJson.error }, 'Slack API returned warning during message post');
      return false;
    } catch (error) {
      logger.warn({ error }, 'Failed to dispatch Slack alert');
      return false;
    }
  },
};
