import type { Request, Response, NextFunction } from 'express';
import { isRegistrationEnabled } from '../config/security';

/**
 * Blocks POST /api/auth/register when ALLOW_REGISTRATION is not "true".
 */
export function registrationGate(req: Request, res: Response, next: NextFunction): void {
  if (!isRegistrationEnabled()) {
    res.status(403).json({
      success: false,
      message: 'Registration is disabled.',
    });
    return;
  }
  next();
}
