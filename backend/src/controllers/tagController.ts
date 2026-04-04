import type { Request, Response, NextFunction } from 'express';
import { APP_CONFIG } from '@productivity-app/shared';
import type {
  CreateTagRequest,
  UpdateTagRequest,
  TagWithCount,
  TodoWithRelations,
  Tag,
} from '@productivity-app/shared';
import { dbGet, dbAll, dbRun } from '../config/database';
import { AppError } from '../utils/AppError';

/**
 * GET /api/tags
 * Returns all tags for the authenticated user, each with a usage_count.
 */
export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;

    const tags = await dbAll<TagWithCount>(
      `SELECT t.*,
              COUNT(tt.todo_id) as usage_count
       FROM tags t
       LEFT JOIN todo_tags tt ON tt.tag_id = t.id
       WHERE t.user_id = ?
       GROUP BY t.id
       ORDER BY t.name ASC`,
      [userId]
    );

    res.json({ success: true, data: tags });
  } catch (error) {
    console.error('Get tags error:', error);
    next(error);
  }
}

/**
 * GET /api/tags/:id
 */
export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const tagId = parseInt(req.params.id as string, 10);

    const tag = await dbGet<TagWithCount>(
      `SELECT t.*,
              COUNT(tt.todo_id) as usage_count
       FROM tags t
       LEFT JOIN todo_tags tt ON tt.tag_id = t.id
       WHERE t.id = ? AND t.user_id = ?
       GROUP BY t.id`,
      [tagId, userId]
    );

    if (!tag) {
      return next(AppError.notFound('Tag not found.'));
    }

    res.json({ success: true, data: tag });
  } catch (error) {
    console.error('Get tag error:', error);
    next(error);
  }
}

/**
 * POST /api/tags
 * Enforces UNIQUE(user_id, name).
 */
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const body = req.body as CreateTagRequest;

    const result = await dbRun('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)', [
      userId,
      body.name,
      body.color ?? '#757575',
    ]);

    const tag = await dbGet<TagWithCount>(
      `SELECT t.*, 0 as usage_count
       FROM tags t WHERE t.id = ?`,
      [result.lastID]
    );

    res.status(201).json({
      success: true,
      data: tag,
      message: 'Tag created successfully.',
    });
  } catch (error) {
    console.error('Create tag error:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return next(AppError.conflict('A tag with this name already exists.'));
    }
    next(error);
  }
}

/**
 * PUT /api/tags/:id
 */
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const tagId = parseInt(req.params.id as string, 10);
    const body = req.body as UpdateTagRequest;

    const existing = await dbGet<Record<string, unknown>>(
      'SELECT * FROM tags WHERE id = ? AND user_id = ?',
      [tagId, userId]
    );

    if (!existing) {
      return next(AppError.notFound('Tag not found.'));
    }

    await dbRun(
      `UPDATE tags SET
        name = ?,
        color = ?
       WHERE id = ? AND user_id = ?`,
      [body.name ?? existing.name, body.color ?? existing.color, tagId, userId]
    );

    const updated = await dbGet<TagWithCount>(
      `SELECT t.*,
              COUNT(tt.todo_id) as usage_count
       FROM tags t
       LEFT JOIN todo_tags tt ON tt.tag_id = t.id
       WHERE t.id = ?
       GROUP BY t.id`,
      [tagId]
    );

    res.json({
      success: true,
      data: updated,
      message: 'Tag updated successfully.',
    });
  } catch (error) {
    console.error('Update tag error:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return next(AppError.conflict('A tag with this name already exists.'));
    }
    next(error);
  }
}

/**
 * DELETE /api/tags/:id
 */
export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const tagId = parseInt(req.params.id as string, 10);

    const result = await dbRun('DELETE FROM tags WHERE id = ? AND user_id = ?', [tagId, userId]);

    if (result.changes === 0) {
      return next(AppError.notFound('Tag not found.'));
    }

    res.json({ success: true, message: 'Tag deleted successfully.' });
  } catch (error) {
    console.error('Delete tag error:', error);
    next(error);
  }
}

/**
 * GET /api/tags/:id/todos
 * Returns all todos associated with the given tag.
 */
export async function getTagTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const tagId = parseInt(req.params.id as string, 10);

    const tag = await dbGet<Tag>('SELECT * FROM tags WHERE id = ? AND user_id = ?', [
      tagId,
      userId,
    ]);

    if (!tag) {
      return next(AppError.notFound('Tag not found.'));
    }

    const { page: pageStr, limit: limitStr } = req.query;
    const page = Math.max(1, parseInt(pageStr as string, 10) || 1);
    const limit = Math.min(
      APP_CONFIG.MAX_PAGE_SIZE,
      Math.max(1, parseInt(limitStr as string, 10) || APP_CONFIG.DEFAULT_PAGE_SIZE)
    );
    const offset = (page - 1) * limit;

    const countRow = await dbGet<{ total: number }>(
      `SELECT COUNT(*) as total
       FROM todos t
       INNER JOIN todo_tags tt ON tt.todo_id = t.id
       WHERE tt.tag_id = ? AND t.user_id = ?`,
      [tagId, userId]
    );
    const total = countRow?.total ?? 0;

    const todos = await dbAll<TodoWithRelations>(
      `SELECT t.*, c.name as category_name, c.color as category_color
       FROM todos t
       INNER JOIN todo_tags tt ON tt.todo_id = t.id
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE tt.tag_id = ? AND t.user_id = ?
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [tagId, userId, limit, offset]
    );

    res.json({
      success: true,
      data: todos,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Get tag todos error:', error);
    next(error);
  }
}
