import { useCallback, useEffect, useState } from 'react';
import type { DashboardStats, TodoWithRelations } from '@productivity-app/shared';
import { analyticsApi, todosApi } from '../services/api';
import { TODOS_CHANGED_EVENT } from '../utils/events';

interface FocusRailData {
  stats: DashboardStats | null;
  upcomingTodos: TodoWithRelations[];
  urgentTodos: TodoWithRelations[];
  loading: boolean;
  refresh: () => Promise<void>;
}

function isWithinDays(dueDate: string, days: number): boolean {
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const limit = new Date(now);
  limit.setDate(limit.getDate() + days);
  return due >= now && due <= limit;
}

function isOverdue(dueDate: string): boolean {
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return due < now;
}

export function useFocusRailData(enabled = true): FocusRailData {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingTodos, setUpcomingTodos] = useState<TodoWithRelations[]>([]);
  const [urgentTodos, setUrgentTodos] = useState<TodoWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const [statsRes, todosRes] = await Promise.all([
        analyticsApi.dashboard(),
        todosApi.list({ limit: '200', status: 'pending' }),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      if (todosRes.success && todosRes.data) {
        const pending = todosRes.data.filter((t) => t.status !== 'completed');
        const upcoming = pending
          .filter((t) => t.due_date && isWithinDays(t.due_date, 7))
          .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
          .slice(0, 8);

        const urgent = pending
          .filter((t) => t.eisenhower_quadrant === 'Q1' || (t.due_date && isOverdue(t.due_date)))
          .slice(0, 8);

        setUpcomingTodos(upcoming);
        setUrgentTodos(urgent);
      }
    } catch {
      // Rail widgets degrade gracefully
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener(TODOS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(TODOS_CHANGED_EVENT, handler);
  }, [refresh]);

  return { stats, upcomingTodos, urgentTodos, loading, refresh };
}
