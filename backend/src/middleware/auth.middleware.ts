import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { UserJwtPayload } from '../types/auth.types';
import { prisma } from '../config/database';

export interface AuthenticatedRequest extends Request {
  user?: UserJwtPayload;
}

/**
 * Middleware that validates the JWT Bearer token and attaches authenticated user
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      // In development, if no token provided, fallback to first user in DB for convenience
      if (process.env.NODE_ENV === 'development') {
        const defaultUser = await prisma.user.findFirst();
        if (defaultUser) {
          req.user = {
            id: defaultUser.id,
            email: defaultUser.email,
            name: defaultUser.name,
            avatar: defaultUser.avatar,
          };
          next();
          return;
        }
      }

      res.status(401).json({
        success: false,
        error: { message: 'Authentication token is required' },
      });
      return;
    }

    const decoded = authService.verifyJwt(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired session token. Please log in again.' },
    });
  }
};
