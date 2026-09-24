import { api } from './api';

export interface SlackStatus {
  connected: boolean;
  teamId?: string | null;
  connectedAt?: string | null;
}

export const slackService = {
  getStatus: async (): Promise<SlackStatus> => {
    try {
      const response = await api.get('/api/slack/status');
      return {
        connected: !!response.data?.connected,
        teamId: response.data?.teamId,
        connectedAt: response.data?.connectedAt,
      };
    } catch {
      return { connected: false };
    }
  },

  getConnectUrl: (userId?: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return `${baseUrl}/api/slack/auth${userId ? `?userId=${userId}` : ''}`;
  },

  sendTestAlert: async () => {
    const response = await api.post('/api/slack/test-alert');
    return response.data;
  },

  disconnect: async () => {
    const response = await api.post('/api/slack/disconnect');
    return response.data;
  },
};
