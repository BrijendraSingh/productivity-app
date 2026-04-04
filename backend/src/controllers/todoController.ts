import type { Request, Response, NextFunction } from 'express';
import { EisenhowerUtils, APP_CONFIG } from '@productivity-app/shared';
import type {
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoWithRelations,
  Tag,
} from '@productivity-app/shared';
import { dbGet, dbAll, dbRun } from '../config/database';
import { AppError } from '../utils/AppError';

/**
 * Attach tags to a todo result row.
 */
async function attachTags(todoId: number): Promise<Tag[]> {
  return dbAll<Tag>(
    `SELECT t.id, t.user_id, t.name, t.color, t.created_at
     FROM tags t
     INNER JOIN todo_tags tt ON tt.tag_id = t.id
     WHERE tt.todo_id = ?`,
    [todoId]
  );
}

/**
 * Sync the todo_tags junction table for a given todo.
 */
async function syncTodoTags(todoId: number, tagIds: number[]): Promise<void> {
  await dbRun('DELETE FROM todo_tags WHERE todo_id = ?', [todoId]);
  for (const tagId of tagIds) {
    await dbRun('INSERT OR IGNORE INTO todo_tags (todo_id, tag_id) VALUES (?, ?)', [todoId, tagId]);
  }
}

/**
 * GET /api/todos
 * Supports: ?search, ?status, ?priority, ?quadrant, ?category_id, ?page, ?limit
 */
export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const {
      search,
      status,
      priority,
      quadrant,
      category_id,
      page: pageStr,
      limit: limitStr,
    } = req.query;

    const page = Math.max(1, parseInt(pageStr as string, 10) || 1);
    const limit = Math.min(
      APP_CONFIG.MAX_PAGE_SIZE,
      Math.max(1, parseInt(limitStr as string, 10) || APP_CONFIG.DEFAULT_PAGE_SIZE)
    );
    const offset = (page - 1) * limit;

    const conditions: string[] = ['t.user_id = ?'];
    const params: unknown[] = [userId];

    if (search) {
      conditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term);
    }
    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }
    if (priority) {
      conditions.push('t.priority = ?');
      params.push(priority);
    }
    if (quadrant) {
      conditions.push('t.eisenhower_quadrant = ?');
      params.push(quadrant);
    }
    if (category_id) {
      conditions.push('t.category_id = ?');
      params.push(parseInt(category_id as string, 10));
    }

    const whereClause = conditions.join(' AND ');

    const countRow = await dbGet<{ total: number }>(
      `SELECT COUNT(*) as total FROM todos t WHERE ${whereClause}`,
      params
    );
    const total = countRow?.total ?? 0;

    const rows = await dbAll<TodoWithRelations>(
      `SELECT t.*, c.name as category_name, c.color as category_color
       FROM todos t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const todos: TodoWithRelations[] = [];
    for (const row of rows) {
      const tags = await attachTags(row.id);
      todos.push({ ...row, tags });
    }

    res.json({
      success: true,
      data: todos,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Get todos error:', error);
    next(error);
  }
}

/**
 * GET /api/todos/:id
 */
export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const todoId = parseInt(req.params.id as string, 10);

    const todo = await dbGet<TodoWithRelations>(
      `SELECT t.*, c.name as category_name, c.color as category_color
       FROM todos t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = ? AND t.user_id = ?`,
      [todoId, userId]
    );

    if (!todo) {
      return next(AppError.notFound('Todo not found.'));
    }

    const tags = await attachTags(todo.id);

    res.json({ success: true, data: { ...todo, tags } });
  } catch (error) {
    console.error('Get todo error:', error);
    next(error);
  }
}

/**
 * POST /api/todos
 * Auto-computes eisenhower_quadrant from urgency + importance.
 */
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const body = req.body as CreateTodoRequest;

    const urgency = EisenhowerUtils.clampLevel(body.urgency_level ?? 5);
    const importance = EisenhowerUtils.clampLevel(body.importance_level ?? 5);
    const quadrant = EisenhowerUtils.calculateQuadrant(urgency, importance);

    const result = await dbRun(
      `INSERT INTO todos
       (user_id, title, description, priority, due_date, category_id,
        urgency_level, importance_level, eisenhower_quadrant, quadrant_auto_assigned,
        bullet_symbol, time_estimate, energy_required)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [
        userId,
        body.title,
        body.description ?? null,
        body.priority ?? 'medium',
        body.due_date ?? null,
        body.category_id ?? null,
        urgency,
        importance,
        quadrant,
        body.bullet_symbol ?? '•',
        body.time_estimate ?? null,
        body.energy_required ?? null,
      ]
    );

    if (body.tag_ids && body.tag_ids.length > 0) {
      await syncTodoTags(result.lastID, body.tag_ids);
    }

    const todo = await dbGet<TodoWithRelations>(
      `SELECT t.*, c.name as category_name, c.color as category_color
       FROM todos t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = ?`,
      [result.lastID]
    );

    const tags = await attachTags(result.lastID);

    res.status(201).json({
      success: true,
      data: { ...todo, tags },
      message: 'Todo created successfully.',
    });
  } catch (error) {
    console.error('Create todo error:', error);
    next(error);
  }
}

/**
 * PUT /api/todos/:id
 * Re-computes eisenhower_quadrant when urgency/importance change.
 * Sets completed_at when status transitions to 'completed'.
 */
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const todoId = parseInt(req.params.id as string, 10);
    const body = req.body as UpdateTodoRequest;

    const existing = await dbGet<Record<string, unknown>>(
      'SELECT * FROM todos WHERE id = ? AND user_id = ?',
      [todoId, userId]
    );

    if (!existing) {
      return next(AppError.notFound('Todo not found.'));
    }

    const urgency =
      body.urgency_level !== undefined
        ? EisenhowerUtils.clampLevel(body.urgency_level)
        : (existing.urgency_level as number);
    const importance =
      body.importance_level !== undefined
        ? EisenhowerUtils.clampLevel(body.importance_level)
        : (existing.importance_level as number);

    const quadrant = EisenhowerUtils.calculateQuadrant(urgency, importance);

    let completedAt = existing.completed_at as string | null;
    if (body.status === 'completed' && existing.status !== 'completed') {
      completedAt = new Date().toISOString();
    } else if (body.status && body.status !== 'completed') {
      completedAt = null;
    }

    await dbRun(
      `UPDATE todos SET
        title = ?,
        description = ?,
        status = ?,
        priority = ?,
        due_date = ?,
        category_id = ?,
        urgency_level = ?,
        importance_level = ?,
        eisenhower_quadrant = ?,
        quadrant_auto_assigned = 1,
        bullet_symbol = ?,
        time_estimate = ?,
        energy_required = ?,
        completed_at = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        body.title ?? existing.title,
        body.description !== undefined ? body.description : existing.description,
        body.status ?? existing.status,
        body.priority ?? existing.priority,
        body.due_date !== undefined ? body.due_date : existing.due_date,
        body.category_id !== undefined ? body.category_id : existing.category_id,
        urgency,
        importance,
        quadrant,
        body.bullet_symbol ?? existing.bullet_symbol,
        body.time_estimate !== undefined ? body.time_estimate : existing.time_estimate,
        body.energy_required !== undefined ? body.energy_required : existing.energy_required,
        completedAt,
        todoId,
        userId,
      ]
    );

    if (body.tag_ids !== undefined) {
      await syncTodoTags(todoId, body.tag_ids);
    }

    // Upsert quadrant_analytics when a todo is newly completed
    if (body.status === 'completed' && existing.status !== 'completed' && quadrant) {
      const today = new Date().toISOString().split('T')[0];
      const timeSpent =
        (body.time_estimate !== undefined
          ? body.time_estimate
          : (existing.time_estimate as number | null)) ?? 0;

      const analyticsRow = await dbGet<{ id: number; tasks_completed: number; time_spent: number }>(
        `SELECT id, tasks_completed, time_spent FROM quadrant_analytics
         WHERE user_id = ? AND date = ? AND quadrant = ?`,
        [userId, today, quadrant]
      );

      if (analyticsRow) {
        const newCompleted = analyticsRow.tasks_completed + 1;
        const newTime = analyticsRow.time_spent + timeSpent;
        await dbRun(
          `UPDATE quadrant_analytics SET tasks_completed = ?, time_spent = ?, productivity_score = ?
           WHERE id = ?`,
          [newCompleted, newTime, newCompleted, analyticsRow.id]
        );
      } else {
        await dbRun(
          `INSERT INTO quadrant_analytics (user_id, date, quadrant, tasks_completed, time_spent, productivity_score)
           VALUES (?, ?, ?, 1, ?, 1)`,
          [userId, today, quadrant, timeSpent]
        );
      }
    }

    const updated = await dbGet<TodoWithRelations>(
      `SELECT t.*, c.name as category_name, c.color as category_color
       FROM todos t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = ?`,
      [todoId]
    );

    const tags = await attachTags(todoId);

    res.json({
      success: true,
      data: { ...updated, tags },
      message: 'Todo updated successfully.',
    });
  } catch (error) {
    console.error('Update todo error:', error);
    next(error);
  }
}

/**
 * DELETE /api/todos/:id
 */
export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const todoId = parseInt(req.params.id as string, 10);

    const result = await dbRun('DELETE FROM todos WHERE id = ? AND user_id = ?', [todoId, userId]);

    if (result.changes === 0) {
      return next(AppError.notFound('Todo not found.'));
    }

    res.json({ success: true, message: 'Todo deleted successfully.' });
  } catch (error) {
    console.error('Delete todo error:', error);
    next(error);
  }
}
