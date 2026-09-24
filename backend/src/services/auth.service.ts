import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/apiError';
import {
  UserJwtPayload,
  GoogleUserInfo,
  GoogleTokenResponse,
  AuthUser,
} from '../types/auth.types';

export const authService = {
  /**
   * Generates the official Google OAuth 2.0 authorization URL
   */
  getGoogleAuthUrl(): string {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID || '',
      redirect_uri: env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      access_type: 'offline',
      prompt: 'consent',
    });

    return `${rootUrl}?${params.toString()}`;
  },

  /**
   * Exchanges Google OAuth authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID || '',
      client_secret: env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
      grant_type: 'authorization_code',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errBody = await response.text();
      logger.error({ errBody }, 'Google OAuth token exchange failed');
      throw ApiError.badRequest('Failed to exchange authorization code with Google');
    }

    return (await response.json()) as GoogleTokenResponse;
  },

  /**
   * Fetches Google user profile using access token
   */
  async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
    const response = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw ApiError.badRequest('Failed to fetch Google user profile');
    }

    return (await response.json()) as GoogleUserInfo;
  },

  /**
   * Find existing user or create a new user record in PostgreSQL
   */
  async findOrCreateGoogleUser(profile: GoogleUserInfo) {
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: profile.id }, { email: profile.email.toLowerCase().trim() }],
      },
    });

    if (user) {
      // Update profile info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.id,
          name: profile.name || user.name,
          avatar: profile.picture || user.avatar,
        },
      });
    } else {
      // Create new User
      user = await prisma.user.create({
        data: {
          googleId: profile.id,
          email: profile.email.toLowerCase().trim(),
          name: profile.name || 'User',
          avatar: profile.picture,
        },
      });

      // Auto-provision a default Ethereal sender for user
      await prisma.sender.create({
        data: {
          userId: user.id,
          email: `${user.email.split('@')[0]}@ethereal.email`,
          etherealUsername: `ethereal_${user.id.slice(0, 8)}`,
          etherealPasswordEncrypted: 'default_ethereal_secret',
        },
      });

      logger.info({ userId: user.id, email: user.email }, 'Created new user from Google OAuth');
    }

    return user;
  },

  /**
   * Signs a secure JWT authentication token (7-day validity)
   */
  generateJwt(user: AuthUser): string {
    const payload: UserJwtPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '7d',
    });
  },

  /**
   * Verifies and decodes a JWT token
   */
  verifyJwt(token: string): UserJwtPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as UserJwtPayload;
    } catch {
      throw ApiError.unauthorized('Invalid or expired authentication token');
    }
  },
};
