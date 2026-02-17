import { Router } from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as categoryController from '../controllers/categoryController';

const router = Router();

// All category routes require authentication
router.use(authMiddleware);

// GET /api/categories
router.get('/', categoryController.getAll);

// GET /api/categories/:id
router.get(
  '/:id',
  validate([
    param('id').isInt({ min: 1 }).withMessage('Category ID must be a positive integer.'),
  ]),
  categoryController.getById,
);

// POST /api/categories
router.post(
  '/',
  validate([
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Category name is required (1-100 characters).'),
    body('color')
      .optional()
      .matches(/^#[0-9a-fA-F]{6}$/)
      .withMessage('Color must be a valid hex color (e.g. #1976d2).'),
    body('icon')
      .optional()
      .isString()
      .isLength({ max: 50 })
      .withMessage('Icon name must be at most 50 characters.'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Description must be at most 500 characters.'),
  ]),
  categoryController.create,
);

// PUT /api/categories/:id
router.put(
  '/:id',
  validate([
    param('id').isInt({ min: 1 }).withMessage('Category ID must be a positive integer.'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Category name must be 1-100 characters.'),
    body('color')
      .optional()
      .matches(/^#[0-9a-fA-F]{6}$/)
      .withMessage('Color must be a valid hex color (e.g. #1976d2).'),
    body('icon')
      .optional({ values: 'null' }),
    body('description')
      .optional({ values: 'null' }),
  ]),
  categoryController.update,
);

// DELETE /api/categories/:id
router.delete(
  '/:id',
  validate([
    param('id').isInt({ min: 1 }).withMessage('Category ID must be a positive integer.'),
  ]),
  categoryController.remove,
);

export default router;
