import { api } from './api';
import { Email } from '../types/email';
import { ScheduleCampaignPayload } from '../types/campaign';

export interface EmailListResponse {
  emails: Email[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const emailService = {
  schedule: async (data: ScheduleCampaignPayload) => {
    const response = await api.post('/api/emails/schedule', data);
    return response.data;
  },

  getScheduled: async (page = 1, limit = 50): Promise<EmailListResponse> => {
    const response = await api.get('/api/emails/scheduled', {
      params: { page, limit },
    });
    return {
      emails: response.data?.data || [],
      pagination: response.data?.pagination,
    };
  },

  getSent: async (page = 1, limit = 50): Promise<EmailListResponse> => {
    const response = await api.get('/api/emails/sent', {
      params: { page, limit },
    });
    return {
      emails: response.data?.data || [],
      pagination: response.data?.pagination,
    };
  },

  search: async (query: string): Promise<Email[]> => {
    const response = await api.get('/api/emails/search', {
      params: { q: query },
    });
    return response.data?.data || [];
  },

  cancelEmail: async (id: string) => {
    const response = await api.post(`/api/emails/${id}/cancel`);
    return response.data;
  },

  getCampaigns: async () => {
    const response = await api.get('/api/campaigns');
    return response.data?.data || [];
  },
};
