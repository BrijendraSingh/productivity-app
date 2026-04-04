import { Router } from 'express';
import { param, body } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as bulletController from '../controllers/bulletController';

const router = Router();

router.use(authMiddleware);

// GET /api/bullet/logs — filter by ?date, ?type
router.get('/logs', bulletController.getLogs);

// PUT /api/bullet/logs/:date/:type — upsert log for date+type
router.put(
  '/logs/:date/:type',
  validate([
    param('date')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Date must be in YYYY-MM-DD format.'),
    param('type')
      .isIn(['daily', 'weekly', 'monthly', 'yearly', 'future'])
      .withMessage('Type must be daily, weekly, monthly, yearly, or future.'),
    body('content').optional().isString(),
  ]),
  bulletController.upsertLog
);

// GET /api/bullet/events — filter by ?date, ?date_from, ?date_to
router.get('/events', bulletController.getEvents);

// POST /api/bullet/events
router.post(
  '/events',
  validate([
    body('title')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Title is required (1-500 characters).'),
    body('event_date')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Event date must be in YYYY-MM-DD format.'),
    body('description').optional().isString(),
    body('event_time')
      .optional()
      .matches(/^\d{2}:\d{2}(:\d{2})?$/)
      .withMessage('Event time must be in HH:MM or HH:MM:SS format.'),
    body('duration')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Duration must be a positive integer (minutes).'),
    body('location').optional().isString(),
    body('category_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Category ID must be a positive integer.'),
    body('bullet_symbol')
      .optional()
      .isIn(['•', '×', '→', '○', '–', '!'])
      .withMessage('Invalid bullet symbol.'),
  ]),
  bulletController.createEvent
);

// PATCH /api/bullet/todos/:id/symbol — update a todo's bullet symbol
router.patch(
  '/todos/:id/symbol',
  validate([
    param('id').isInt({ min: 1 }).withMessage('Todo ID must be a positive integer.'),
    body('bullet_symbol')
      .isIn(['•', '×', '→', '○', '–', '!'])
      .withMessage('Invalid bullet symbol.'),
  ]),
  bulletController.updateTodoSymbol
);

export default router;
