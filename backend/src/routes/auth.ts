import { Router } from 'express';
import { body } from 'express-validator';
import { APP_CONFIG } from '@productivity-app/shared';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as authController from '../controllers/authController';

const router = Router();

// POST /api/auth/register (public)
router.post(
  '/register',
  validate([
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters.'),
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('A valid email address is required.'),
    body('password')
      .isLength({ min: APP_CONFIG.PASSWORD_MIN_LENGTH })
      .withMessage(`Password must be at least ${APP_CONFIG.PASSWORD_MIN_LENGTH} characters.`),
  ]),
  authController.register,
);

// POST /api/auth/login (public)
router.post(
  '/login',
  validate([
    body('username').trim().notEmpty().withMessage('Username is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ]),
  authController.login,
);

// POST /api/auth/logout [auth]
router.post('/logout', authMiddleware, authController.logout);

// GET /api/auth/verify [auth]
router.get('/verify', authMiddleware, authController.verify);

// GET /api/auth/profile [auth]
router.get('/profile', authMiddleware, authController.profile);

export default router;
