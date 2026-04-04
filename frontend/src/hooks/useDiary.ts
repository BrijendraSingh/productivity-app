import { useState, useEffect, useCallback, useRef } from 'react';
import type { DiaryEntry, CreateDiaryEntryRequest, Mood } from '@productivity-app/shared';
import { diaryApi } from '../services/api';
import { format } from 'date-fns';

// ─── Filter state ─────────────────────────────────────────────────────────────

export interface DiaryFilters {
  mood: Mood | '';
  date_from: string;
  date_to: string;
}

const INITIAL_FILTERS: DiaryFilters = {
  mood: '',
  date_from: '',
  date_to: '',
};

// ─── Hook return type ─────────────────────────────────────────────────────────

export interface UseDiaryReturn {
  entries: DiaryEntry[];
  currentEntry: DiaryEntry | null;
  selectedDate: Date;
  loading: boolean;
  saving: boolean;
  error: string | null;
  filters: DiaryFilters;

  setSelectedDate: (date: Date) => void;
  setFilters: (filters: Partial<DiaryFilters>) => void;
  resetFilters: () => void;
  refresh: () => Promise<void>;
  refreshEntry: () => Promise<void>;

  upsertEntry: (data: CreateDiaryEntryRequest) => Promise<boolean>;
  deleteEntry: (date: string) => Promise<boolean>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDiary(): UseDiaryReturn {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<DiaryEntry | null>(null);
  const [selectedDate, setSelectedDateState] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<DiaryFilters>(INITIAL_FILTERS);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // ─── Fetch entries list ──────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filters.mood) params.mood = filters.mood;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const response = await diaryApi.list(params);
      if (!mountedRef.current) return;

      if (response.success && response.data) {
        setEntries(response.data);
      } else {
        setError(response.message || 'Failed to fetch diary entries');
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch diary entries');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [filters]);

  // ─── Fetch single entry by date ──────────────────────────────────────────

  const fetchEntry = useCallback(async () => {
    setError(null);
    try {
      const response = await diaryApi.get(dateString);
      if (!mountedRef.current) return;

      if (response.success && response.data) {
        setCurrentEntry(response.data);
      } else {
        setCurrentEntry(null);
      }
    } catch {
      if (mountedRef.current) setCurrentEntry(null);
    }
  }, [dateString]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);
  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  // ─── Date navigation ─────────────────────────────────────────────────────

  const setSelectedDate = useCallback((date: Date) => {
    setSelectedDateState(date);
  }, []);

  // ─── Filter helpers ───────────────────────────────────────────────────────

  const setFilters = useCallback((partial: Partial<DiaryFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(INITIAL_FILTERS);
  }, []);

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  const upsertEntry = useCallback(
    async (data: CreateDiaryEntryRequest): Promise<boolean> => {
      setSaving(true);
      try {
        const response = await diaryApi.upsert(dateString, data);
        if (response.success) {
          if (mountedRef.current) {
            setCurrentEntry(response.data ?? null);
            await fetchEntries();
          }
          return true;
        }
        setError(response.message || 'Failed to save diary entry');
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save diary entry');
        return false;
      } finally {
        if (mountedRef.current) setSaving(false);
      }
    },
    [dateString, fetchEntries]
  );

  const deleteEntry = useCallback(
    async (date: string): Promise<boolean> => {
      try {
        const response = await diaryApi.delete(date);
        if (response.success) {
          if (mountedRef.current) {
            setCurrentEntry(null);
            await fetchEntries();
          }
          return true;
        }
        setError(response.message || 'Failed to delete diary entry');
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete diary entry');
        return false;
      }
    },
    [fetchEntries]
  );

  return {
    entries,
    currentEntry,
    selectedDate,
    loading,
    saving,
    error,
    filters,
    setSelectedDate,
    setFilters,
    resetFilters,
    refresh: fetchEntries,
    refreshEntry: fetchEntry,
    upsertEntry,
    deleteEntry,
  };
}
