import type { Request, Response, NextFunction } from 'express';
import type {
  CreateWritingSessionRequest,
  UpdateWritingSessionRequest,
  WritingSession,
} from '@productivity-app/shared';
import { dbGet, dbRun } from '../config/database';
import { AppError } from '../utils/AppError';

/**
 * POST /api/writing-sessions
 * Start a new writing session. Auto-sets start_time and user_id.
 */
export async function startSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const body = req.body as CreateWritingSessionRequest;

    const post = await dbGet<{ id: number }>(
      'SELECT id FROM blog_posts WHERE id = ? AND user_id = ?',
      [body.blog_post_id, userId]
    );

    if (!post) {
      return next(AppError.notFound('Blog post not found.'));
    }

    const result = await dbRun(
      `INSERT INTO writing_sessions (user_id, blog_post_id, start_time, session_type)
       VALUES (?, ?, datetime('now'), 'writing')`,
      [userId, body.blog_post_id]
    );

    const session = await dbGet<WritingSession>('SELECT * FROM writing_sessions WHERE id = ?', [
      result.lastID,
    ]);

    res.status(201).json({
      success: true,
      data: session,
      message: 'Writing session started.',
    });
  } catch (error) {
    console.error('Start writing session error:', error);
    next(error);
  }
}

/**
 * PATCH /api/writing-sessions/:id
 * End a writing session. Auto-sets end_time, computes productivity_score.
 */
export async function endSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const sessionId = parseInt(req.params.id as string, 10);
    const body = req.body as UpdateWritingSessionRequest;

    const existing = await dbGet<WritingSession>(
      'SELECT * FROM writing_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (!existing) {
      return next(AppError.notFound('Writing session not found.'));
    }

    if (existing.end_time) {
      return next(AppError.badRequest('Session already ended.'));
    }

    const startTime = existing.start_time ? new Date(existing.start_time).getTime() : Date.now();
    const endTime = Date.now();
    const durationMinutes = Math.max(1, (endTime - startTime) / 60000);
    const wordsWritten = body.words_written ?? 0;
    const productivityScore = Math.round((wordsWritten / durationMinutes) * 100) / 100;

    await dbRun(
      `UPDATE writing_sessions SET
        end_time = datetime('now'),
        words_written = ?,
        productivity_score = ?,
        notes = ?
       WHERE id = ? AND user_id = ?`,
      [wordsWritten, productivityScore, body.notes ?? existing.notes, sessionId, userId]
    );

    const updated = await dbGet<WritingSession>('SELECT * FROM writing_sessions WHERE id = ?', [
      sessionId,
    ]);

    res.json({
      success: true,
      data: updated,
      message: 'Writing session ended.',
    });
  } catch (error) {
    console.error('End writing session error:', error);
    next(error);
  }
}
