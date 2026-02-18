import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  MatrixAnalyticsResponse,
  TrendsAnalyticsResponse,
  WritingAnalyticsResponse,
  DiaryAnalyticsResponse,
} from '@productivity-app/shared';
import { analyticsApi } from '../services/api';

export type TimeRange = '7' | '14' | '30' | '60' | '90' | '365';

export const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '1 year' },
];

export interface UseAnalyticsReturn {
  matrix: MatrixAnalyticsResponse | null;
  trends: TrendsAnalyticsResponse | null;
  writing: WritingAnalyticsResponse | null;
  diary: DiaryAnalyticsResponse | null;
  loading: boolean;
  error: string | null;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  refresh: () => Promise<void>;
}

export function useAnalytics(): UseAnalyticsReturn {
  const [matrix, setMatrix] = useState<MatrixAnalyticsResponse | null>(null);
  const [trends, setTrends] = useState<TrendsAnalyticsResponse | null>(null);
  const [writing, setWriting] = useState<WritingAnalyticsResponse | null>(null);
  const [diary, setDiary] = useState<DiaryAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30');

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = { days: timeRange };

    try {
      const [matrixRes, trendsRes, writingRes, diaryRes] = await Promise.all([
        analyticsApi.matrix(params),
        analyticsApi.trends(params),
        analyticsApi.writing(params),
        analyticsApi.diary(params),
      ]);

      if (!mountedRef.current) return;

      if (matrixRes.success) setMatrix(matrixRes.data ?? null);
      if (trendsRes.success) setTrends(trendsRes.data ?? null);
      if (writingRes.success) setWriting(writingRes.data ?? null);
      if (diaryRes.success) setDiary(diaryRes.data ?? null);

      const failed = [matrixRes, trendsRes, writingRes, diaryRes]
        .filter((r) => !r.success);
      if (failed.length === 4) {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return {
    matrix,
    trends,
    writing,
    diary,
    loading,
    error,
    timeRange,
    setTimeRange,
    refresh: fetchAll,
  };
}
