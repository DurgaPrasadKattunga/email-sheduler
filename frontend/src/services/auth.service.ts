import { api } from './api';
import { User } from '../types/auth';

export const authService = {
  getMe: async (): Promise<User | null> => {
    try {
      const response = await api.get('/auth/me');
      return response.data?.data || null;
    } catch {
      return null;
    }
  },

  devLogin: async (email?: string): Promise<{ token: string; user: User }> => {
    const response = await api.post('/auth/dev-login', { email });
    const { token, user } = response.data;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    return { token, user };
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
  },
};
