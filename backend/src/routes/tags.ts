import { Router } from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as tagController from '../controllers/tagController';

const router = Router();

// All tag routes require authentication
router.use(authMiddleware);

// GET /api/tags
router.get('/', tagController.getAll);

// GET /api/tags/:id
router.get(
  '/:id',
  validate([
    param('id').isInt({ min: 1 }).withMessage('Tag ID must be a positive integer.'),
  ]),
  tagController.getById,
);

// GET /api/tags/:id/todos
router.get(
  '/:id/todos',
  validate([
    param('id').isInt({ min: 1 }).withMessage('Tag ID must be a positive integer.'),
  ]),
  tagController.getTagTodos,
);

// POST /api/tags
router.post(
  '/',
  validate([
    body('name')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Tag name is required (1-50 characters).'),
    body('color')
      .optional()
      .matches(/^#[0-9a-fA-F]{6}$/)
      .withMessage('Color must be a valid hex color (e.g. #757575).'),
  ]),
  tagController.create,
);

// PUT /api/tags/:id
router.put(
  '/:id',
  validate([
    param('id').isInt({ min: 1 }).withMessage('Tag ID must be a positive integer.'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Tag name must be 1-50 characters.'),
    body('color')
      .optional()
      .matches(/^#[0-9a-fA-F]{6}$/)
      .withMessage('Color must be a valid hex color (e.g. #757575).'),
  ]),
  tagController.update,
);

// DELETE /api/tags/:id
router.delete(
  '/:id',
  validate([
    param('id').isInt({ min: 1 }).withMessage('Tag ID must be a positive integer.'),
  ]),
  tagController.remove,
);

export default router;
