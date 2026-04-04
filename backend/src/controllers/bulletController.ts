import type { Request, Response, NextFunction } from 'express';
import type {
  BulletLog,
  CreateBulletLogRequest,
  CreateEventRequest,
} from '@productivity-app/shared';
import type { Event as AppEvent } from '@productivity-app/shared';
import { dbGet, dbAll, dbRun } from '../config/database';
import { AppError } from '../utils/AppError';

/**
 * GET /api/bullet/logs
 * Supports: ?date, ?type
 */
export async function getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { date, type } = req.query;

    const conditions: string[] = ['user_id = ?'];
    const params: unknown[] = [userId];

    if (date) {
      conditions.push('date = ?');
      params.push(date);
    }
    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    const whereClause = conditions.join(' AND ');

    const logs = await dbAll<BulletLog>(
      `SELECT * FROM bullet_logs
       WHERE ${whereClause}
       ORDER BY date DESC, created_at DESC`,
      params
    );

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Get bullet logs error:', error);
    next(error);
  }
}

/**
 * PUT /api/bullet/logs/:date/:type
 * Upsert — creates log if none exists for date+type, updates otherwise.
 */
export async function upsertLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { date, type } = req.params;
    const body = req.body as CreateBulletLogRequest;

    const existing = await dbGet<BulletLog>(
      'SELECT * FROM bullet_logs WHERE user_id = ? AND date = ? AND type = ?',
      [userId, date, type]
    );

    if (existing) {
      await dbRun(
        `UPDATE bullet_logs SET
          content = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND date = ? AND type = ?`,
        [body.content !== undefined ? body.content : existing.content, userId, date, type]
      );
    } else {
      await dbRun(
        `INSERT INTO bullet_logs (user_id, date, type, content)
         VALUES (?, ?, ?, ?)`,
        [userId, date, type, body.content ?? null]
      );
    }

    const log = await dbGet<BulletLog>(
      'SELECT * FROM bullet_logs WHERE user_id = ? AND date = ? AND type = ?',
      [userId, date, type]
    );

    const statusCode = existing ? 200 : 201;
    const verb = existing ? 'updated' : 'created';

    res.status(statusCode).json({
      success: true,
      data: log,
      message: `Bullet log ${verb} successfully.`,
    });
  } catch (error) {
    console.error('Upsert bullet log error:', error);
    next(error);
  }
}

/**
 * GET /api/bullet/events
 * Supports: ?date, ?date_from, ?date_to
 */
export async function getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { date, date_from, date_to } = req.query;

    const conditions: string[] = ['user_id = ?'];
    const params: unknown[] = [userId];

    if (date) {
      conditions.push('event_date = ?');
      params.push(date);
    }
    if (date_from) {
      conditions.push('event_date >= ?');
      params.push(date_from);
    }
    if (date_to) {
      conditions.push('event_date <= ?');
      params.push(date_to);
    }

    const whereClause = conditions.join(' AND ');

    const events = await dbAll<AppEvent>(
      `SELECT * FROM events
       WHERE ${whereClause}
       ORDER BY event_date ASC, event_time ASC`,
      params
    );

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Get bullet events error:', error);
    next(error);
  }
}

/**
 * POST /api/bullet/events
 */
export async function createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const body = req.body as CreateEventRequest;

    const result = await dbRun(
      `INSERT INTO events
       (user_id, title, description, event_date, event_time, duration, location, category_id, bullet_symbol)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        body.title,
        body.description ?? null,
        body.event_date,
        body.event_time ?? null,
        body.duration ?? null,
        body.location ?? null,
        body.category_id ?? null,
        body.bullet_symbol ?? '○',
      ]
    );

    const event = await dbGet<AppEvent>('SELECT * FROM events WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      data: event,
      message: 'Event created successfully.',
    });
  } catch (error) {
    console.error('Create bullet event error:', error);
    next(error);
  }
}

/**
 * PATCH /api/bullet/todos/:id/symbol
 * Updates the bullet_symbol on a todo.
 */
export async function updateTodoSymbol(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const todoId = parseInt(req.params.id as string, 10);
    const { bullet_symbol } = req.body as { bullet_symbol: string };

    const existing = await dbGet<{ id: number }>(
      'SELECT id FROM todos WHERE id = ? AND user_id = ?',
      [todoId, userId]
    );

    if (!existing) {
      return next(AppError.notFound('Todo not found.'));
    }

    await dbRun(
      `UPDATE todos SET bullet_symbol = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [bullet_symbol, todoId, userId]
    );

    const updated = await dbGet<Record<string, unknown>>('SELECT * FROM todos WHERE id = ?', [
      todoId,
    ]);

    res.json({
      success: true,
      data: updated,
      message: 'Todo bullet symbol updated successfully.',
    });
  } catch (error) {
    console.error('Update todo symbol error:', error);
    next(error);
  }
}
