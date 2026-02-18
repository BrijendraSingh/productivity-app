import type { Request, Response } from 'express';
import { APP_CONFIG } from '@productivity-app/shared';
import type { CreateDiaryEntryRequest, DiaryEntry } from '@productivity-app/shared';
import { dbGet, dbAll, dbRun } from '../config/database';

/**
 * GET /api/diary
 * Supports: ?mood, ?date_from, ?date_to, ?page, ?limit
 */
export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { mood, date_from, date_to, page: pageStr, limit: limitStr } = req.query;

    const page = Math.max(1, parseInt(pageStr as string, 10) || 1);
    const limit = Math.min(
      APP_CONFIG.MAX_PAGE_SIZE,
      Math.max(1, parseInt(limitStr as string, 10) || APP_CONFIG.DEFAULT_PAGE_SIZE),
    );
    const offset = (page - 1) * limit;

    const conditions: string[] = ['user_id = ?'];
    const params: unknown[] = [userId];

    if (mood) {
      conditions.push('mood = ?');
      params.push(mood);
    }
    if (date_from) {
      conditions.push('date >= ?');
      params.push(date_from);
    }
    if (date_to) {
      conditions.push('date <= ?');
      params.push(date_to);
    }

    const whereClause = conditions.join(' AND ');

    const countRow = await dbGet<{ total: number }>(
      `SELECT COUNT(*) as total FROM diary_entries WHERE ${whereClause}`,
      params,
    );
    const total = countRow?.total ?? 0;

    const entries = await dbAll<DiaryEntry>(
      `SELECT * FROM diary_entries
       WHERE ${whereClause}
       ORDER BY date DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    res.json({
      success: true,
      data: entries,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Get diary entries error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

/**
 * GET /api/diary/:date
 */
export async function getByDate(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { date } = req.params;

    const entry = await dbGet<DiaryEntry>(
      'SELECT * FROM diary_entries WHERE user_id = ? AND date = ?',
      [userId, date],
    );

    if (!entry) {
      res.status(404).json({ success: false, message: 'Diary entry not found for this date.' });
      return;
    }

    res.json({ success: true, data: entry });
  } catch (error) {
    console.error('Get diary entry error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

/**
 * PUT /api/diary/:date
 * Upsert — creates entry if none exists for the date, updates otherwise.
 */
export async function upsert(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { date } = req.params;
    const body = req.body as CreateDiaryEntryRequest;

    const existing = await dbGet<DiaryEntry>(
      'SELECT * FROM diary_entries WHERE user_id = ? AND date = ?',
      [userId, date],
    );

    if (existing) {
      await dbRun(
        `UPDATE diary_entries SET
          content = ?,
          mood = ?,
          weather = ?,
          energy_level = ?,
          gratitude = ?,
          highlights = ?,
          challenges = ?,
          tomorrow_focus = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND date = ?`,
        [
          body.content !== undefined ? body.content : existing.content,
          body.mood !== undefined ? body.mood : existing.mood,
          body.weather !== undefined ? body.weather : existing.weather,
          body.energy_level !== undefined ? body.energy_level : existing.energy_level,
          body.gratitude !== undefined ? body.gratitude : existing.gratitude,
          body.highlights !== undefined ? body.highlights : existing.highlights,
          body.challenges !== undefined ? body.challenges : existing.challenges,
          body.tomorrow_focus !== undefined ? body.tomorrow_focus : existing.tomorrow_focus,
          userId,
          date,
        ],
      );
    } else {
      await dbRun(
        `INSERT INTO diary_entries
         (user_id, date, content, mood, weather, energy_level, gratitude, highlights, challenges, tomorrow_focus)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          date,
          body.content ?? null,
          body.mood ?? null,
          body.weather ?? null,
          body.energy_level ?? null,
          body.gratitude ?? null,
          body.highlights ?? null,
          body.challenges ?? null,
          body.tomorrow_focus ?? null,
        ],
      );
    }

    const entry = await dbGet<DiaryEntry>(
      'SELECT * FROM diary_entries WHERE user_id = ? AND date = ?',
      [userId, date],
    );

    const statusCode = existing ? 200 : 201;
    const verb = existing ? 'updated' : 'created';

    res.status(statusCode).json({
      success: true,
      data: entry,
      message: `Diary entry ${verb} successfully.`,
    });
  } catch (error) {
    console.error('Upsert diary entry error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

/**
 * DELETE /api/diary/:date
 */
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { date } = req.params;

    const result = await dbRun(
      'DELETE FROM diary_entries WHERE user_id = ? AND date = ?',
      [userId, date],
    );

    if (result.changes === 0) {
      res.status(404).json({ success: false, message: 'Diary entry not found for this date.' });
      return;
    }

    res.json({ success: true, message: 'Diary entry deleted successfully.' });
  } catch (error) {
    console.error('Delete diary entry error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
