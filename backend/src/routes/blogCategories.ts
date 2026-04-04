import { Router } from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as blogCategoryController from '../controllers/blogCategoryController';

const router = Router();

router.use(authMiddleware);

router.get('/', blogCategoryController.getAll);

router.get(
  '/:id',
  validate([
    param('id').isInt({ min: 1 }).withMessage('Blog category ID must be a positive integer.'),
  ]),
  blogCategoryController.getById,
);

router.post(
  '/',
  validate([
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Category name is required (1-100 characters).'),
    body('slug')
      .optional()
      .trim()
      .isLength({ min: 1, max: 150 })
      .withMessage('Slug must be 1-150 characters.'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Description must be at most 500 characters.'),
    body('color')
      .optional()
      .matches(/^#[0-9a-fA-F]{6}$/)
      .withMessage('Color must be a valid hex color (e.g. #1976d2).'),
    body('icon')
      .optional()
      .isString()
      .isLength({ max: 50 })
      .withMessage('Icon name must be at most 50 characters.'),
    body('parent_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Parent ID must be a positive integer.'),
  ]),
  blogCategoryController.create,
);

router.put(
  '/:id',
  validate([
    param('id').isInt({ min: 1 }).withMessage('Blog category ID must be a positive integer.'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Category name must be 1-100 characters.'),
    body('slug')
      .optional()
      .trim()
      .isLength({ min: 1, max: 150 })
      .withMessage('Slug must be 1-150 characters.'),
    body('description')
      .optional({ values: 'null' }),
    body('color')
      .optional({ values: 'null' }),
    body('icon')
      .optional({ values: 'null' }),
    body('parent_id')
      .optional({ values: 'null' }),
  ]),
  blogCategoryController.update,
);

router.delete(
  '/:id',
  validate([
    param('id').isInt({ min: 1 }).withMessage('Blog category ID must be a positive integer.'),
  ]),
  blogCategoryController.remove,
);

export default router;
