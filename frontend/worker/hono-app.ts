import { Hono } from 'hono';
import { body, param } from 'express-validator';
import { APP_CONFIG, API_ENDPOINTS } from '@productivity-app/shared';
import { authMiddleware } from '../../backend/src/middleware/auth';
import { registrationGate } from '../../backend/src/middleware/registrationGate';
import { validate } from '../../backend/src/middleware/validation';
import * as authController from '../../backend/src/controllers/authController';
import * as todoController from '../../backend/src/controllers/todoController';
import * as categoryController from '../../backend/src/controllers/categoryController';
import * as tagController from '../../backend/src/controllers/tagController';
import * as diaryController from '../../backend/src/controllers/diaryController';
import * as bulletController from '../../backend/src/controllers/bulletController';
import * as blogController from '../../backend/src/controllers/blogController';
import * as blogCategoryController from '../../backend/src/controllers/blogCategoryController';
import * as writingSessionController from '../../backend/src/controllers/writingSessionController';
import * as analyticsController from '../../backend/src/controllers/analyticsController';
import { fromExpress } from './express-adapter';

const auth = fromExpress(authMiddleware);

export function createHonoApp(nodeEnv = 'production'): Hono {
  const app = new Hono();

  app.get(API_ENDPOINTS.HEALTH, (c) =>
    c.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 0,
        environment: nodeEnv,
        runtime: 'worker',
      },
    })
  );

  app.get(API_ENDPOINTS.API_ROOT, (c) =>
    c.json({
      success: true,
      data: {
        message: `Welcome to the ${APP_CONFIG.APP_NAME} API`,
        version: APP_CONFIG.APP_VERSION,
        runtime: 'worker',
      },
    })
  );

  // ─── Auth (public + protected) ─────────────────────────────────────────────
  app.post(
    '/api/auth/register',
    fromExpress(
      registrationGate,
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
      authController.register
    )
  );

  app.post(
    '/api/auth/login',
    fromExpress(
      validate([
        body('username').trim().notEmpty().withMessage('Username is required.'),
        body('password').notEmpty().withMessage('Password is required.'),
      ]),
      authController.login
    )
  );

  app.post('/api/auth/logout', auth, fromExpress(authController.logout));
  app.get('/api/auth/verify', auth, fromExpress(authController.verify));
  app.get('/api/auth/profile', auth, fromExpress(authController.profile));

  // ─── Todos ─────────────────────────────────────────────────────────────────
  const todos = new Hono();
  todos.use('*', auth);
  todos.get('/', fromExpress(todoController.getAll));
  todos.get(
    '/:id',
    fromExpress(
      validate([param('id').isInt({ min: 1 }).withMessage('Todo ID must be a positive integer.')]),
      todoController.getById
    )
  );
  todos.post(
    '/',
    fromExpress(
      validate([
        body('title')
          .trim()
          .isLength({ min: 1, max: 500 })
          .withMessage('Title is required (1-500 characters).'),
        body('description').optional().isString(),
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
        body('tag_ids').optional().isArray().withMessage('Tag IDs must be an array.'),
        body('tag_ids.*')
          .optional()
          .isInt({ min: 1 })
          .withMessage('Each tag ID must be a positive integer.'),
      ]),
      todoController.create
    )
  );
  todos.put(
    '/:id',
    fromExpress(
      validate([
        param('id').isInt({ min: 1 }).withMessage('Todo ID must be a positive integer.'),
        body('title')
          .optional()
          .trim()
          .isLength({ min: 1, max: 500 })
          .withMessage('Title must be 1-500 characters.'),
        body('description').optional(),
        body('status')
          .optional()
          .isIn(['pending', 'in_progress', 'completed', 'cancelled', 'deferred'])
          .withMessage('Invalid status.'),
        body('priority')
          .optional()
          .isIn(['low', 'medium', 'high'])
          .withMessage('Priority must be low, medium, or high.'),
        body('due_date').optional({ values: 'null' }),
        body('category_id').optional({ values: 'null' }),
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
        body('time_estimate').optional({ values: 'null' }),
        body('energy_required').optional({ values: 'null' }),
        body('tag_ids').optional().isArray().withMessage('Tag IDs must be an array.'),
        body('tag_ids.*')
          .optional()
          .isInt({ min: 1 })
          .withMessage('Each tag ID must be a positive integer.'),
      ]),
      todoController.update
    )
  );
  todos.delete(
    '/:id',
    fromExpress(
      validate([param('id').isInt({ min: 1 }).withMessage('Todo ID must be a positive integer.')]),
      todoController.remove
    )
  );
  app.route('/api/todos', todos);

  // ─── Categories ────────────────────────────────────────────────────────────
  const categories = new Hono();
  categories.use('*', auth);
  categories.get('/', fromExpress(categoryController.getAll));
  categories.get(
    '/:id',
    fromExpress(
      validate([
        param('id').isInt({ min: 1 }).withMessage('Category ID must be a positive integer.'),
      ]),
      categoryController.getById
    )
  );
  categories.post(
    '/',
    fromExpress(
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
      categoryController.create
    )
  );
  categories.put(
    '/:id',
    fromExpress(
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
        body('icon').optional({ values: 'null' }),
        body('description').optional({ values: 'null' }),
      ]),
      categoryController.update
    )
  );
  categories.delete(
    '/:id',
    fromExpress(
      validate([
        param('id').isInt({ min: 1 }).withMessage('Category ID must be a positive integer.'),
      ]),
      categoryController.remove
    )
  );
  app.route('/api/categories', categories);

  // ─── Tags ──────────────────────────────────────────────────────────────────
  const tags = new Hono();
  tags.use('*', auth);
  tags.get('/', fromExpress(tagController.getAll));
  tags.get(
    '/:id',
    fromExpress(
      validate([param('id').isInt({ min: 1 }).withMessage('Tag ID must be a positive integer.')]),
      tagController.getById
    )
  );
  tags.get(
    '/:id/todos',
    fromExpress(
      validate([param('id').isInt({ min: 1 }).withMessage('Tag ID must be a positive integer.')]),
      tagController.getTagTodos
    )
  );
  tags.post(
    '/',
    fromExpress(
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
      tagController.create
    )
  );
  tags.put(
    '/:id',
    fromExpress(
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
      tagController.update
    )
  );
  tags.delete(
    '/:id',
    fromExpress(
      validate([param('id').isInt({ min: 1 }).withMessage('Tag ID must be a positive integer.')]),
      tagController.remove
    )
  );
  app.route('/api/tags', tags);

  // ─── Diary ─────────────────────────────────────────────────────────────────
  const diary = new Hono();
  diary.use('*', auth);
  diary.get('/', fromExpress(diaryController.getAll));
  diary.get(
    '/:date',
    fromExpress(
      validate([
        param('date')
          .matches(/^\d{4}-\d{2}-\d{2}$/)
          .withMessage('Date must be in YYYY-MM-DD format.'),
      ]),
      diaryController.getByDate
    )
  );
  diary.put(
    '/:date',
    fromExpress(
      validate([
        param('date')
          .matches(/^\d{4}-\d{2}-\d{2}$/)
          .withMessage('Date must be in YYYY-MM-DD format.'),
        body('content').optional().isString(),
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
        body('gratitude').optional().isString(),
        body('highlights').optional().isString(),
        body('challenges').optional().isString(),
        body('tomorrow_focus').optional().isString(),
      ]),
      diaryController.upsert
    )
  );
  diary.delete(
    '/:date',
    fromExpress(
      validate([
        param('date')
          .matches(/^\d{4}-\d{2}-\d{2}$/)
          .withMessage('Date must be in YYYY-MM-DD format.'),
      ]),
      diaryController.remove
    )
  );
  app.route('/api/diary', diary);

  // ─── Bullet journal ────────────────────────────────────────────────────────
  const bullet = new Hono();
  bullet.use('*', auth);
  bullet.get('/logs', fromExpress(bulletController.getLogs));
  bullet.put(
    '/logs/:date/:type',
    fromExpress(
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
    )
  );
  bullet.get('/events', fromExpress(bulletController.getEvents));
  bullet.post(
    '/events',
    fromExpress(
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
    )
  );
  bullet.patch(
    '/todos/:id/symbol',
    fromExpress(
      validate([
        param('id').isInt({ min: 1 }).withMessage('Todo ID must be a positive integer.'),
        body('bullet_symbol')
          .isIn(['•', '×', '→', '○', '–', '!'])
          .withMessage('Invalid bullet symbol.'),
      ]),
      bulletController.updateTodoSymbol
    )
  );
  app.route('/api/bullet', bullet);

  // ─── Blog ──────────────────────────────────────────────────────────────────
  const blog = new Hono();
  blog.use('*', auth);
  blog.get('/', fromExpress(blogController.getAll));
  blog.get(
    '/:id',
    fromExpress(
      validate([
        param('id').isInt({ min: 1 }).withMessage('Blog post ID must be a positive integer.'),
      ]),
      blogController.getById
    )
  );
  blog.post(
    '/',
    fromExpress(
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
    )
  );
  blog.put(
    '/:id',
    fromExpress(
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
    )
  );
  blog.delete(
    '/:id',
    fromExpress(
      validate([
        param('id').isInt({ min: 1 }).withMessage('Blog post ID must be a positive integer.'),
      ]),
      blogController.remove
    )
  );
  blog.patch(
    '/:id/publish',
    fromExpress(
      validate([
        param('id').isInt({ min: 1 }).withMessage('Blog post ID must be a positive integer.'),
      ]),
      blogController.publish
    )
  );
  app.route('/api/blog', blog);

  // ─── Blog categories ───────────────────────────────────────────────────────
  const blogCategories = new Hono();
  blogCategories.use('*', auth);
  blogCategories.get('/', fromExpress(blogCategoryController.getAll));
  blogCategories.get(
    '/:id',
    fromExpress(
      validate([
        param('id').isInt({ min: 1 }).withMessage('Blog category ID must be a positive integer.'),
      ]),
      blogCategoryController.getById
    )
  );
  blogCategories.post(
    '/',
    fromExpress(
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
      blogCategoryController.create
    )
  );
  blogCategories.put(
    '/:id',
    fromExpress(
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
        body('description').optional({ values: 'null' }),
        body('color').optional({ values: 'null' }),
        body('icon').optional({ values: 'null' }),
        body('parent_id').optional({ values: 'null' }),
      ]),
      blogCategoryController.update
    )
  );
  blogCategories.delete(
    '/:id',
    fromExpress(
      validate([
        param('id').isInt({ min: 1 }).withMessage('Blog category ID must be a positive integer.'),
      ]),
      blogCategoryController.remove
    )
  );
  app.route('/api/blog-categories', blogCategories);

  // ─── Writing sessions ──────────────────────────────────────────────────────
  const writingSessions = new Hono();
  writingSessions.use('*', auth);
  writingSessions.post(
    '/',
    fromExpress(
      validate([
        body('blog_post_id')
          .isInt({ min: 1 })
          .withMessage('blog_post_id must be a positive integer.'),
      ]),
      writingSessionController.startSession
    )
  );
  writingSessions.patch(
    '/:id',
    fromExpress(
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
    )
  );
  app.route('/api/writing-sessions', writingSessions);

  // ─── Analytics ─────────────────────────────────────────────────────────────
  const analytics = new Hono();
  analytics.use('*', auth);
  analytics.get('/dashboard', fromExpress(analyticsController.getDashboard));
  analytics.get('/matrix', fromExpress(analyticsController.getMatrixAnalytics));
  analytics.get('/trends', fromExpress(analyticsController.getTrendsAnalytics));
  analytics.get('/writing', fromExpress(analyticsController.getWritingAnalytics));
  analytics.get('/diary', fromExpress(analyticsController.getDiaryAnalytics));
  app.route('/api/analytics', analytics);

  app.notFound((c) => c.json({ success: false, message: 'Route not found.' }, 404));

  app.onError((err, c) => {
    const message = err instanceof Error ? err.message : 'Internal server error.';
    if (message.includes('UNIQUE constraint failed')) {
      return c.json({ success: false, message: 'Resource already exists.', code: 'CONFLICT' }, 409);
    }
    console.error('Unhandled error:', err);
    return c.json({ success: false, message: 'Internal server error.' }, 500);
  });

  return app;
}
