import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { APP_CONFIG } from '@productivity-app/shared';
import { lightTheme } from '../theme/theme';

// One-time: clear legacy dark-mode preference (dark theme removed)
try {
  localStorage.removeItem(APP_CONFIG.THEME_STORAGE_KEY);
} catch {
  /* ignore */
}

interface ThemeContextValue {
  mode: 'light';
  isDark: false;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const value = useMemo<ThemeContextValue>(() => ({ mode: 'light', isDark: false }), []);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={lightTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used within AppThemeProvider');
  return ctx;
}
