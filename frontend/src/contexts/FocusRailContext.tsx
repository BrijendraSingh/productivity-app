import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type AnalyticsTimeRange = '7d' | '30d' | '90d';

interface FocusRailContextValue {
  pageWidgets: React.ReactNode | null;
  setPageWidgets: (widgets: React.ReactNode | null) => void;
  selectedTodoId: number | null;
  setSelectedTodoId: (id: number | null) => void;
  analyticsRange: AnalyticsTimeRange;
  setAnalyticsRange: (range: AnalyticsTimeRange) => void;
}

const FocusRailContext = createContext<FocusRailContextValue | null>(null);

export function FocusRailProvider({ children }: { children: React.ReactNode }) {
  const [pageWidgets, setPageWidgetsState] = useState<React.ReactNode | null>(null);
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);
  const [analyticsRange, setAnalyticsRange] = useState<AnalyticsTimeRange>('30d');

  const setPageWidgets = useCallback((widgets: React.ReactNode | null) => {
    setPageWidgetsState(widgets);
  }, []);

  const value = useMemo(
    () => ({
      pageWidgets,
      setPageWidgets,
      selectedTodoId,
      setSelectedTodoId,
      analyticsRange,
      setAnalyticsRange,
    }),
    [pageWidgets, setPageWidgets, selectedTodoId, analyticsRange]
  );

  return <FocusRailContext.Provider value={value}>{children}</FocusRailContext.Provider>;
}

export function useFocusRail(): FocusRailContextValue {
  const ctx = useContext(FocusRailContext);
  if (!ctx) {
    throw new Error('useFocusRail must be used within FocusRailProvider');
  }
  return ctx;
}
