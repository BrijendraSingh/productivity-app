import { Router } from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as blogController from '../controllers/blogController';

const router = Router();

router.use(authMiddleware);

// GET /api/blog — list with filtering + pagination
router.get('/', blogController.getAll);

// GET /api/blog/:id
router.get(
  '/:id',
  validate([param('id').isInt({ min: 1 }).withMessage('Blog post ID must be a positive integer.')]),
  blogController.getById
);

// POST /api/blog
router.post(
  '/',
  validate([
    body('title')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Title is required (1-500 characters).'),
    body('content').optional().isString(),
    body('content_type')
      .optional()
      .isIn(['markdown', 'html'])
      .withMessage('Content type must be markdown or html.'),
    body('status')
      .optional()
      .isIn(['draft', 'published', 'archived'])
      .withMessage('Status must be draft, published, or archived.'),
    body('excerpt').optional().isString(),
    body('featured_image_path').optional().isString(),
    body('category_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Category ID must be a positive integer.'),
    body('seo_title').optional().isString(),
    body('seo_description').optional().isString(),
    body('seo_keywords').optional().isString(),
    body('tag_ids').optional().isArray().withMessage('Tag IDs must be an array.'),
    body('tag_ids.*')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Each tag ID must be a positive integer.'),
  ]),
  blogController.create
);

// PUT /api/blog/:id
router.put(
  '/:id',
  validate([
    param('id').isInt({ min: 1 }).withMessage('Blog post ID must be a positive integer.'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Title must be 1-500 characters.'),
    body('content').optional(),
    body('content_type')
      .optional()
      .isIn(['markdown', 'html'])
      .withMessage('Content type must be markdown or html.'),
    body('status')
      .optional()
      .isIn(['draft', 'published', 'archived'])
      .withMessage('Status must be draft, published, or archived.'),
    body('excerpt').optional(),
    body('featured_image_path').optional({ values: 'null' }),
    body('category_id').optional({ values: 'null' }),
    body('seo_title').optional({ values: 'null' }),
    body('seo_description').optional({ values: 'null' }),
    body('seo_keywords').optional({ values: 'null' }),
    body('tag_ids').optional().isArray().withMessage('Tag IDs must be an array.'),
    body('tag_ids.*')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Each tag ID must be a positive integer.'),
  ]),
  blogController.update
);

// DELETE /api/blog/:id
router.delete(
  '/:id',
  validate([param('id').isInt({ min: 1 }).withMessage('Blog post ID must be a positive integer.')]),
  blogController.remove
);

// PATCH /api/blog/:id/publish
router.patch(
  '/:id/publish',
  validate([param('id').isInt({ min: 1 }).withMessage('Blog post ID must be a positive integer.')]),
  blogController.publish
);

export default router;
