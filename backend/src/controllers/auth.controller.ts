import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const authController = {
  /**
   * GET /auth/google - Initiate Google OAuth 2.0 flow
   */
  googleAuth: asyncHandler(async (req: Request, res: Response) => {
    if (!env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID.includes('your-google-client-id')) {
      // In development when credentials aren't set yet, redirect with demo token to maintain functionality
      const defaultUser = await prisma.user.findFirst();
      if (defaultUser) {
        const token = authService.generateJwt({
          id: defaultUser.id,
          name: defaultUser.name,
          email: defaultUser.email,
          avatar: defaultUser.avatar,
        });
        res.redirect(`${env.FRONTEND_URL}/dashboard?token=${token}`);
        return;
      }
    }

    const authUrl = authService.getGoogleAuthUrl();
    res.redirect(authUrl);
  }),

  /**
   * GET /auth/google/callback - Handle Google OAuth callback
   */
  googleCallback: asyncHandler(async (req: Request, res: Response) => {
    const code = req.query.code as string;

    if (!code) {
      res.redirect(`${env.FRONTEND_URL}/login?error=no_code_provided`);
      return;
    }

    try {
      // 1. Exchange authorization code for Google access token
      const tokens = await authService.exchangeCodeForTokens(code);

      // 2. Fetch Google profile
      const profile = await authService.getGoogleUserInfo(tokens.access_token);

      // 3. Find or create User in PostgreSQL
      const user = await authService.findOrCreateGoogleUser(profile);

      // 4. Issue JWT
      const token = authService.generateJwt({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      });

      // 5. Redirect back to frontend dashboard with token
      res.redirect(`${env.FRONTEND_URL}/dashboard?token=${token}`);
    } catch (error) {
      res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }),

  /**
   * GET /auth/me - Retrieve current authenticated user profile
   */
  getMe: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        slackConnections: {
          select: { id: true, teamId: true, createdAt: true },
        },
        _count: {
          select: { campaigns: true, senders: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found' } });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        googleId: user.googleId,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        slackConnected: user.slackConnections.length > 0,
        createdAt: user.createdAt,
        stats: {
          campaignsCount: user._count.campaigns,
          sendersCount: user._count.senders,
        },
      },
    });
  }),

  /**
   * POST /auth/logout - Clear session
   */
  logout: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }),

  /**
   * POST /auth/dev-login - Development helper to issue JWT token for test user
   */
  devLogin: asyncHandler(async (req: Request, res: Response) => {
    const inputEmail = req.body?.email || req.query?.email;
    let user;

    if (inputEmail && typeof inputEmail === 'string' && inputEmail.trim()) {
      const cleanEmail = inputEmail.trim().toLowerCase();
      user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (!user) {
        const namePart = cleanEmail.split('@')[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        user = await prisma.user.create({
          data: {
            googleId: `custom_${Date.now()}`,
            name: formattedName,
            email: cleanEmail,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=009A49&color=fff`,
          },
        });
      }
    } else {
      user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: {
            googleId: 'dev_user_001',
            name: 'Oliver Brown',
            email: 'oliver.brown@domain.io',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
          },
        });
      }
    }

    const token = authService.generateJwt({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  }),
};
