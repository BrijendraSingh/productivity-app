import type { Request, Response, NextFunction } from 'express';
import type {
  DashboardStats,
  MatrixAnalyticsResponse,
  TrendsAnalyticsResponse,
  WritingAnalyticsResponse,
  DiaryAnalyticsResponse,
  EisenhowerQuadrant,
  Priority,
  TodoStatus,
  Mood,
  Weather,
  BlogPostStatus,
} from '@productivity-app/shared';
import { EISENHOWER_QUADRANTS, PRIORITY_LEVELS, MOOD_LEVELS } from '@productivity-app/shared';
import { dbGet, dbAll } from '../config/database';

function parseDays(req: Request): number {
  const raw = parseInt(req.query.days as string, 10);
  if (Number.isNaN(raw) || raw < 1) return 30;
  return Math.min(raw, 365);
}

/**
 * GET /api/analytics/dashboard
 */
export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;

    const todoStats = await dbGet<{
      total: number;
      completed: number;
      pending: number;
      in_progress: number;
      overdue: number;
    }>(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN due_date < date('now') AND status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) as overdue
       FROM todos
       WHERE user_id = ?`,
      [userId]
    );

    const matrixStats = await dbGet<{
      q1: number;
      q2: number;
      q3: number;
      q4: number;
    }>(
      `SELECT
        SUM(CASE WHEN eisenhower_quadrant = 'Q1' THEN 1 ELSE 0 END) as q1,
        SUM(CASE WHEN eisenhower_quadrant = 'Q2' THEN 1 ELSE 0 END) as q2,
        SUM(CASE WHEN eisenhower_quadrant = 'Q3' THEN 1 ELSE 0 END) as q3,
        SUM(CASE WHEN eisenhower_quadrant = 'Q4' THEN 1 ELSE 0 END) as q4
       FROM todos
       WHERE user_id = ? AND status NOT IN ('completed', 'cancelled')`,
      [userId]
    );

    const diaryStats = await dbGet<{ total_entries: number }>(
      'SELECT COUNT(*) as total_entries FROM diary_entries WHERE user_id = ?',
      [userId]
    );

    let streak = 0;
    const checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const entry = await dbGet<{ id: number }>(
        'SELECT id FROM diary_entries WHERE user_id = ? AND date = ?',
        [userId, dateStr]
      );
      if (entry) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      } else {
        break;
      }
    }

    const blogStats = await dbGet<{
      total_posts: number;
      published: number;
      draft: number;
    }>(
      `SELECT
        COUNT(*) as total_posts,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft
       FROM blog_posts
       WHERE user_id = ?`,
      [userId]
    );

    const stats: DashboardStats = {
      todos: {
        total: todoStats?.total ?? 0,
        completed: todoStats?.completed ?? 0,
        pending: todoStats?.pending ?? 0,
        in_progress: todoStats?.in_progress ?? 0,
        overdue: todoStats?.overdue ?? 0,
      },
      matrix: {
        q1: matrixStats?.q1 ?? 0,
        q2: matrixStats?.q2 ?? 0,
        q3: matrixStats?.q3 ?? 0,
        q4: matrixStats?.q4 ?? 0,
      },
      diary: {
        total_entries: diaryStats?.total_entries ?? 0,
        streak,
      },
      blog: {
        total_posts: blogStats?.total_posts ?? 0,
        published: blogStats?.published ?? 0,
        draft: blogStats?.draft ?? 0,
      },
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get dashboard error:', error);
    next(error);
  }
}

/**
 * GET /api/analytics/matrix?days=30
 * Quadrant distribution, completed/time per quadrant, daily completions from
 * the quadrant_analytics table + live todo aggregates.
 */
export async function getMatrixAnalytics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const days = parseDays(req);
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const since = sinceDate.toISOString().split('T')[0];

    const quadrantRows = await dbAll<{
      quadrant: EisenhowerQuadrant;
      total: number;
      completed: number;
      pending: number;
      avg_urgency: number;
      avg_importance: number;
    }>(
      `SELECT
        eisenhower_quadrant as quadrant,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) as pending,
        ROUND(AVG(urgency_level), 1) as avg_urgency,
        ROUND(AVG(importance_level), 1) as avg_importance
       FROM todos
       WHERE user_id = ? AND eisenhower_quadrant IS NOT NULL AND created_at >= ?
       GROUP BY eisenhower_quadrant`,
      [userId, since]
    );

    const quadrantMap = new Map(quadrantRows.map((r) => [r.quadrant, r]));

    const timeSpentRows = await dbAll<{
      quadrant: EisenhowerQuadrant;
      total_time: number;
    }>(
      `SELECT quadrant, SUM(time_spent) as total_time
       FROM quadrant_analytics
       WHERE user_id = ? AND date >= ?
       GROUP BY quadrant`,
      [userId, since]
    );
    const timeMap = new Map(timeSpentRows.map((r) => [r.quadrant, r.total_time]));

    const allQuadrants: EisenhowerQuadrant[] = ['Q1', 'Q2', 'Q3', 'Q4'];
    const distribution = allQuadrants.map((q) => {
      const info = EISENHOWER_QUADRANTS[q];
      const row = quadrantMap.get(q);
      return {
        quadrant: q,
        label: info.label,
        color: info.color,
        total: row?.total ?? 0,
        completed: row?.completed ?? 0,
        pending: row?.pending ?? 0,
        avg_urgency: row?.avg_urgency ?? 0,
        avg_importance: row?.avg_importance ?? 0,
        time_spent: timeMap.get(q) ?? 0,
      };
    });

    const totalTasks = distribution.reduce((s, d) => s + d.total, 0);
    const totalCompleted = distribution.reduce((s, d) => s + d.completed, 0);
    const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

    const dailyCompletions = await dbAll<{
      date: string;
      quadrant: EisenhowerQuadrant;
      tasks_completed: number;
      time_spent: number;
      productivity_score: number | null;
    }>(
      `SELECT date, quadrant, tasks_completed, time_spent, productivity_score
       FROM quadrant_analytics
       WHERE user_id = ? AND date >= ?
       ORDER BY date ASC`,
      [userId, since]
    );

    const productivityRows = await dbAll<{ productivity_score: number }>(
      `SELECT productivity_score FROM quadrant_analytics
       WHERE user_id = ? AND date >= ? AND productivity_score IS NOT NULL`,
      [userId, since]
    );
    const productivityScore =
      productivityRows.length > 0
        ? Math.round(
            (productivityRows.reduce((s, r) => s + r.productivity_score, 0) /
              productivityRows.length) *
              10
          ) / 10
        : completionRate;

    const data: MatrixAnalyticsResponse = {
      distribution,
      total_tasks: totalTasks,
      total_completed: totalCompleted,
      completion_rate: completionRate,
      daily_completions: dailyCompletions,
      productivity_score: productivityScore,
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get matrix analytics error:', error);
    next(error);
  }
}

/**
 * GET /api/analytics/trends?days=30
 * Priority distribution, completion trends over time, status breakdown.
 */
export async function getTrendsAnalytics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const days = parseDays(req);
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const since = sinceDate.toISOString().split('T')[0];

    const priorityRows = await dbAll<{
      priority: Priority;
      total: number;
      completed: number;
      pending: number;
    }>(
      `SELECT
        priority,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) as pending
       FROM todos
       WHERE user_id = ? AND created_at >= ?
       GROUP BY priority`,
      [userId, since]
    );

    const priorityMap = new Map(priorityRows.map((r) => [r.priority, r]));
    const allPriorities: Priority[] = ['low', 'medium', 'high'];
    const priority_distribution = allPriorities.map((p) => {
      const info = PRIORITY_LEVELS[p];
      const row = priorityMap.get(p);
      return {
        priority: p,
        label: info.label,
        color: info.color,
        total: row?.total ?? 0,
        completed: row?.completed ?? 0,
        pending: row?.pending ?? 0,
      };
    });

    const createdByDay = await dbAll<{ date: string; count: number }>(
      `SELECT date(created_at) as date, COUNT(*) as count
       FROM todos
       WHERE user_id = ? AND created_at >= ?
       GROUP BY date(created_at)
       ORDER BY date ASC`,
      [userId, since]
    );

    const completedByDay = await dbAll<{ date: string; count: number }>(
      `SELECT date(completed_at) as date, COUNT(*) as count
       FROM todos
       WHERE user_id = ? AND completed_at IS NOT NULL AND completed_at >= ?
       GROUP BY date(completed_at)
       ORDER BY date ASC`,
      [userId, since]
    );

    const createdMap = new Map(createdByDay.map((r) => [r.date, r.count]));
    const completedMap = new Map(completedByDay.map((r) => [r.date, r.count]));

    const completion_trends: TrendsAnalyticsResponse['completion_trends'] = [];
    const cursor = new Date(sinceDate);
    const today = new Date();
    while (cursor <= today) {
      const dateStr = cursor.toISOString().split('T')[0];
      const created = createdMap.get(dateStr) ?? 0;
      const completed = completedMap.get(dateStr) ?? 0;
      completion_trends.push({ date: dateStr, created, completed, net: created - completed });
      cursor.setDate(cursor.getDate() + 1);
    }

    const statusRows = await dbAll<{ status: TodoStatus; count: number }>(
      `SELECT status, COUNT(*) as count
       FROM todos
       WHERE user_id = ? AND created_at >= ?
       GROUP BY status`,
      [userId, since]
    );

    const avgRow = await dbGet<{ avg_hours: number | null }>(
      `SELECT ROUND(
        AVG((julianday(completed_at) - julianday(created_at)) * 24), 1
       ) as avg_hours
       FROM todos
       WHERE user_id = ? AND completed_at IS NOT NULL AND created_at >= ?`,
      [userId, since]
    );

    const overdueRow = await dbGet<{ count: number }>(
      `SELECT COUNT(*) as count FROM todos
       WHERE user_id = ? AND due_date < date('now')
         AND status NOT IN ('completed', 'cancelled') AND created_at >= ?`,
      [userId, since]
    );

    const onTrackRow = await dbGet<{ count: number }>(
      `SELECT COUNT(*) as count FROM todos
       WHERE user_id = ? AND (due_date IS NULL OR due_date >= date('now'))
         AND status NOT IN ('completed', 'cancelled') AND created_at >= ?`,
      [userId, since]
    );

    const data: TrendsAnalyticsResponse = {
      priority_distribution,
      completion_trends,
      status_breakdown: statusRows,
      avg_completion_time_hours: avgRow?.avg_hours ?? null,
      overdue_count: overdueRow?.count ?? 0,
      on_track_count: onTrackRow?.count ?? 0,
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get trends analytics error:', error);
    next(error);
  }
}

/**
 * GET /api/analytics/writing?days=30
 * Writing productivity, words over time, session tracking, blog stats.
 */
export async function getWritingAnalytics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const days = parseDays(req);
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const since = sinceDate.toISOString().split('T')[0];

    const postStats = await dbGet<{
      total_posts: number;
      published_posts: number;
      draft_posts: number;
      total_words: number;
      total_reading_time: number;
      total_views: number;
    }>(
      `SELECT
        COUNT(*) as total_posts,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_posts,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_posts,
        COALESCE(SUM(word_count), 0) as total_words,
        COALESCE(SUM(reading_time), 0) as total_reading_time,
        COALESCE(SUM(view_count), 0) as total_views
       FROM blog_posts
       WHERE user_id = ? AND created_at >= ?`,
      [userId, since]
    );

    const sessionStats = await dbGet<{
      total_sessions: number;
      total_time_minutes: number;
      total_words_written: number;
      avg_productivity_score: number | null;
    }>(
      `SELECT
        COUNT(*) as total_sessions,
        COALESCE(SUM(
          ROUND((julianday(end_time) - julianday(start_time)) * 1440)
        ), 0) as total_time_minutes,
        COALESCE(SUM(words_written), 0) as total_words_written,
        ROUND(AVG(productivity_score), 1) as avg_productivity_score
       FROM writing_sessions
       WHERE user_id = ? AND created_at >= ?`,
      [userId, since]
    );

    const wordsOverTime = await dbAll<{
      date: string;
      words_written: number;
      sessions: number;
    }>(
      `SELECT
        date(start_time) as date,
        COALESCE(SUM(words_written), 0) as words_written,
        COUNT(*) as sessions
       FROM writing_sessions
       WHERE user_id = ? AND start_time >= ?
       GROUP BY date(start_time)
       ORDER BY date ASC`,
      [userId, since]
    );

    const postsByStatus = await dbAll<{ status: BlogPostStatus; count: number }>(
      `SELECT status, COUNT(*) as count
       FROM blog_posts
       WHERE user_id = ? AND created_at >= ?
       GROUP BY status`,
      [userId, since]
    );

    const totalPosts = postStats?.total_posts ?? 0;

    const data: WritingAnalyticsResponse = {
      total_posts: totalPosts,
      published_posts: postStats?.published_posts ?? 0,
      draft_posts: postStats?.draft_posts ?? 0,
      total_words: postStats?.total_words ?? 0,
      total_reading_time: postStats?.total_reading_time ?? 0,
      avg_words_per_post:
        totalPosts > 0 ? Math.round((postStats?.total_words ?? 0) / totalPosts) : 0,
      total_views: postStats?.total_views ?? 0,
      sessions: {
        total_sessions: sessionStats?.total_sessions ?? 0,
        total_time_minutes: sessionStats?.total_time_minutes ?? 0,
        total_words_written: sessionStats?.total_words_written ?? 0,
        avg_productivity_score: sessionStats?.avg_productivity_score ?? null,
      },
      words_over_time: wordsOverTime,
      posts_by_status: postsByStatus,
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get writing analytics error:', error);
    next(error);
  }
}

/**
 * GET /api/analytics/diary?days=30
 * Mood patterns, energy trends, entry frequency, weather distribution.
 */
export async function getDiaryAnalytics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const days = parseDays(req);
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const since = sinceDate.toISOString().split('T')[0];

    const totalRow = await dbGet<{ total: number }>(
      'SELECT COUNT(*) as total FROM diary_entries WHERE user_id = ? AND date >= ?',
      [userId, since]
    );

    let streak = 0;
    const checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const entry = await dbGet<{ id: number }>(
        'SELECT id FROM diary_entries WHERE user_id = ? AND date = ?',
        [userId, dateStr]
      );
      if (entry) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      } else {
        break;
      }
    }

    const moodRows = await dbAll<{ mood: Mood; count: number }>(
      `SELECT mood, COUNT(*) as count
       FROM diary_entries
       WHERE user_id = ? AND date >= ? AND mood IS NOT NULL
       GROUP BY mood
       ORDER BY count DESC`,
      [userId, since]
    );

    const mood_distribution = moodRows.map((r) => {
      const info = MOOD_LEVELS[r.mood];
      return {
        mood: r.mood,
        label: info.label,
        emoji: info.emoji,
        color: info.color,
        count: r.count,
      };
    });

    const most_common_mood: Mood | null = moodRows.length > 0 ? moodRows[0].mood : null;

    const energyRows = await dbAll<{ date: string; energy_level: number }>(
      `SELECT date, energy_level
       FROM diary_entries
       WHERE user_id = ? AND date >= ? AND energy_level IS NOT NULL
       ORDER BY date ASC`,
      [userId, since]
    );

    const avgEnergyRow = await dbGet<{ avg_energy: number | null }>(
      `SELECT ROUND(AVG(energy_level), 1) as avg_energy
       FROM diary_entries
       WHERE user_id = ? AND date >= ? AND energy_level IS NOT NULL`,
      [userId, since]
    );

    const entryDates = new Set(
      (
        await dbAll<{ date: string }>(
          'SELECT date FROM diary_entries WHERE user_id = ? AND date >= ?',
          [userId, since]
        )
      ).map((r) => r.date)
    );

    const entry_frequency: DiaryAnalyticsResponse['entry_frequency'] = [];
    const cursor = new Date(sinceDate);
    const today = new Date();
    while (cursor <= today) {
      const dateStr = cursor.toISOString().split('T')[0];
      entry_frequency.push({ date: dateStr, has_entry: entryDates.has(dateStr) });
      cursor.setDate(cursor.getDate() + 1);
    }

    const gratitudeRow = await dbGet<{ count: number }>(
      `SELECT COUNT(*) as count FROM diary_entries
       WHERE user_id = ? AND date >= ? AND gratitude IS NOT NULL AND gratitude != ''`,
      [userId, since]
    );

    const weatherRows = await dbAll<{ weather: Weather; count: number }>(
      `SELECT weather, COUNT(*) as count
       FROM diary_entries
       WHERE user_id = ? AND date >= ? AND weather IS NOT NULL
       GROUP BY weather
       ORDER BY count DESC`,
      [userId, since]
    );

    const data: DiaryAnalyticsResponse = {
      total_entries: totalRow?.total ?? 0,
      streak,
      mood_distribution,
      energy_trends: energyRows,
      entry_frequency,
      avg_energy: avgEnergyRow?.avg_energy ?? null,
      most_common_mood,
      entries_with_gratitude: gratitudeRow?.count ?? 0,
      weather_distribution: weatherRows,
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get diary analytics error:', error);
    next(error);
  }
}
