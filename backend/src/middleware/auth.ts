import type { Request, Response, NextFunction } from 'express';
import type { SafeUser } from '@productivity-app/shared';
import { dbGet } from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}

/**
 * Authentication middleware.
 * Extracts Bearer token from Authorization header, looks up the user,
 * and attaches `req.user` (SafeUser) for downstream handlers.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Provide a Bearer token.',
      });
      return;
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
      return;
    }

    const user = await dbGet<SafeUser & { password_hash?: string }>(
      `SELECT id, username, email, is_active, profile_data, preferences, created_at, updated_at
       FROM users
       WHERE api_token = ? AND is_active = 1`,
      [token]
    );

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_active: user.is_active,
      profile_data: user.profile_data,
      preferences: user.preferences,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
}
