import type { Request, Response } from 'express';
import type { DashboardStats } from '@productivity-app/shared';
import { dbGet } from '../config/database';

/**
 * GET /api/analytics/dashboard
 * Returns aggregated dashboard statistics for the authenticated user.
 */
export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    // Todo stats
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
      [userId],
    );

    // Matrix (quadrant) stats
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
      [userId],
    );

    // Diary stats
    const diaryStats = await dbGet<{
      total_entries: number;
    }>(
      'SELECT COUNT(*) as total_entries FROM diary_entries WHERE user_id = ?',
      [userId],
    );

    // Calculate streak (consecutive days with diary entries ending today or yesterday)
    let streak = 0;
    const today = new Date();
    const checkDate = new Date(today);

    // Check from today backwards
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const entry = await dbGet<{ id: number }>(
        'SELECT id FROM diary_entries WHERE user_id = ? AND date = ?',
        [userId, dateStr],
      );

      if (entry) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // No entry today; try starting from yesterday
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      } else {
        break;
      }
    }

    // Blog stats
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
      [userId],
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
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
