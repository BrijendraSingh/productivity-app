import { Router } from 'express';
import { param, body } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as diaryController from '../controllers/diaryController';

const router = Router();

router.use(authMiddleware);

// GET /api/diary — list with filtering + pagination
router.get('/', diaryController.getAll);

// GET /api/diary/:date
router.get(
  '/:date',
  validate([
    param('date')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Date must be in YYYY-MM-DD format.'),
  ]),
  diaryController.getByDate,
);

// PUT /api/diary/:date — upsert (one entry per day)
router.put(
  '/:date',
  validate([
    param('date')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Date must be in YYYY-MM-DD format.'),
    body('content')
      .optional()
      .isString(),
    body('mood')
      .optional()
      .isIn(['great', 'good', 'neutral', 'bad', 'terrible'])
      .withMessage('Mood must be great, good, neutral, bad, or terrible.'),
    body('weather')
      .optional()
      .isIn(['sunny', 'cloudy', 'rainy', 'snowy', 'stormy'])
      .withMessage('Weather must be sunny, cloudy, rainy, snowy, or stormy.'),
    body('energy_level')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Energy level must be between 1 and 10.'),
    body('gratitude')
      .optional()
      .isString(),
    body('highlights')
      .optional()
      .isString(),
    body('challenges')
      .optional()
      .isString(),
    body('tomorrow_focus')
      .optional()
      .isString(),
  ]),
  diaryController.upsert,
);

// DELETE /api/diary/:date
router.delete(
  '/:date',
  validate([
    param('date')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Date must be in YYYY-MM-DD format.'),
  ]),
  diaryController.remove,
);

export default router;
