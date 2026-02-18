import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  BulletLog,
  BulletLogType,
  CreateBulletLogRequest,
  CreateEventRequest,
} from '@productivity-app/shared';
import type { Event as AppEvent } from '@productivity-app/shared';
import { bulletApi } from '../services/api';
import { format } from 'date-fns';

// ─── Hook return type ─────────────────────────────────────────────────────────

export interface UseBulletJournalReturn {
  logs: BulletLog[];
  currentLog: BulletLog | null;
  events: AppEvent[];
  selectedDate: Date;
  activeTab: BulletLogType;
  loading: boolean;
  saving: boolean;
  error: string | null;

  setSelectedDate: (date: Date) => void;
  setActiveTab: (tab: BulletLogType) => void;
  refresh: () => Promise<void>;

  upsertLog: (content: string) => Promise<boolean>;
  createEvent: (data: CreateEventRequest) => Promise<boolean>;
  updateTodoSymbol: (id: number, symbol: string) => Promise<boolean>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBulletJournal(): UseBulletJournalReturn {
  const [logs, setLogs] = useState<BulletLog[]>([]);
  const [currentLog, setCurrentLog] = useState<BulletLog | null>(null);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [selectedDate, setSelectedDateState] = useState<Date>(new Date());
  const [activeTab, setActiveTabState] = useState<BulletLogType>('daily');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // ─── Fetch logs ──────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        date: dateString,
        type: activeTab,
      };

      const response = await bulletApi.getLogs(params);
      if (!mountedRef.current) return;

      if (response.success && response.data) {
        setLogs(response.data);
        const match = response.data.find(
          (log) => log.date === dateString && log.type === activeTab,
        );
        setCurrentLog(match ?? null);
      } else {
        setError(response.message || 'Failed to fetch bullet logs');
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bullet logs');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [dateString, activeTab]);

  // ─── Fetch events ────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    try {
      const response = await bulletApi.getEvents({ date: dateString });
      if (!mountedRef.current) return;

      if (response.success && response.data) {
        setEvents(response.data);
      }
    } catch {
      // non-critical
    }
  }, [dateString]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // ─── Navigation ───────────────────────────────────────────────────────────

  const setSelectedDate = useCallback((date: Date) => {
    setSelectedDateState(date);
  }, []);

  const setActiveTab = useCallback((tab: BulletLogType) => {
    setActiveTabState(tab);
  }, []);

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  const upsertLog = useCallback(async (content: string): Promise<boolean> => {
    setSaving(true);
    try {
      const body: CreateBulletLogRequest = { content };
      const response = await bulletApi.upsertLog(dateString, activeTab, body);
      if (response.success) {
        if (mountedRef.current) {
          setCurrentLog(response.data ?? null);
          await fetchLogs();
        }
        return true;
      }
      setError(response.message || 'Failed to save bullet log');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save bullet log');
      return false;
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [dateString, activeTab, fetchLogs]);

  const createEvent = useCallback(async (data: CreateEventRequest): Promise<boolean> => {
    setSaving(true);
    try {
      const response = await bulletApi.createEvent(data);
      if (response.success) {
        if (mountedRef.current) {
          await fetchEvents();
        }
        return true;
      }
      setError(response.message || 'Failed to create event');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      return false;
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [fetchEvents]);

  const updateTodoSymbol = useCallback(async (id: number, symbol: string): Promise<boolean> => {
    try {
      const response = await bulletApi.updateTodoSymbol(id, symbol);
      return response.success;
    } catch {
      return false;
    }
  }, []);

  // ─── Refresh all ─────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    await Promise.all([fetchLogs(), fetchEvents()]);
  }, [fetchLogs, fetchEvents]);

  return {
    logs,
    currentLog,
    events,
    selectedDate,
    activeTab,
    loading,
    saving,
    error,
    setSelectedDate,
    setActiveTab,
    refresh,
    upsertLog,
    createEvent,
    updateTodoSymbol,
  };
}
