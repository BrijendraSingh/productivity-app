import { Router } from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as writingSessionController from '../controllers/writingSessionController';

const router = Router();

router.use(authMiddleware);

// POST /api/writing-sessions — start a new session
router.post(
  '/',
  validate([
    body('blog_post_id').isInt({ min: 1 }).withMessage('blog_post_id must be a positive integer.'),
  ]),
  writingSessionController.startSession
);

// PATCH /api/writing-sessions/:id — end a session
router.patch(
  '/:id',
  validate([
    param('id').isInt({ min: 1 }).withMessage('Session ID must be a positive integer.'),
    body('words_written')
      .optional()
      .isInt({ min: 0 })
      .withMessage('words_written must be a non-negative integer.'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 2000 })
      .withMessage('Notes must be at most 2000 characters.'),
  ]),
  writingSessionController.endSession
);

export default router;
