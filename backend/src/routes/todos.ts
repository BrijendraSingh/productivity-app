import { Router } from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as todoController from '../controllers/todoController';

const router = Router();

// All todo routes require authentication
router.use(authMiddleware);

// GET /api/todos — list with filtering + pagination
router.get('/', todoController.getAll);

// GET /api/todos/:id
router.get(
  '/:id',
  validate([
    param('id').isInt({ min: 1 }).withMessage('Todo ID must be a positive integer.'),
  ]),
  todoController.getById,
);

// POST /api/todos
router.post(
  '/',
  validate([
    body('title')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Title is required (1-500 characters).'),
    body('description')
      .optional()
      .isString(),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Priority must be low, medium, or high.'),
    body('due_date')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid ISO 8601 date.'),
    body('category_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Category ID must be a positive integer.'),
    body('urgency_level')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Urgency level must be between 1 and 10.'),
    body('importance_level')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Importance level must be between 1 and 10.'),
    body('bullet_symbol')
      .optional()
      .isIn(['•', '×', '→', '○', '–', '!'])
      .withMessage('Invalid bullet symbol.'),
    body('time_estimate')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Time estimate must be a positive integer (minutes).'),
    body('energy_required')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Energy required must be low, medium, or high.'),
    body('tag_ids')
      .optional()
      .isArray()
      .withMessage('Tag IDs must be an array.'),
    body('tag_ids.*')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Each tag ID must be a positive integer.'),
  ]),
  todoController.create,
);

// PUT /api/todos/:id
router.put(
  '/:id',
  validate([
    param('id').isInt({ min: 1 }).withMessage('Todo ID must be a positive integer.'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Title must be 1-500 characters.'),
    body('description')
      .optional(),
    body('status')
      .optional()
      .isIn(['pending', 'in_progress', 'completed', 'cancelled', 'deferred'])
      .withMessage('Invalid status.'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Priority must be low, medium, or high.'),
    body('due_date')
      .optional({ values: 'null' }),
    body('category_id')
      .optional({ values: 'null' }),
    body('urgency_level')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Urgency level must be between 1 and 10.'),
    body('importance_level')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Importance level must be between 1 and 10.'),
    body('bullet_symbol')
      .optional()
      .isIn(['•', '×', '→', '○', '–', '!'])
      .withMessage('Invalid bullet symbol.'),
    body('time_estimate')
      .optional({ values: 'null' }),
    body('energy_required')
      .optional({ values: 'null' }),
    body('tag_ids')
      .optional()
      .isArray()
      .withMessage('Tag IDs must be an array.'),
    body('tag_ids.*')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Each tag ID must be a positive integer.'),
  ]),
  todoController.update,
);

// DELETE /api/todos/:id
router.delete(
  '/:id',
  validate([
    param('id').isInt({ min: 1 }).withMessage('Todo ID must be a positive integer.'),
  ]),
  todoController.remove,
);

export default router;
