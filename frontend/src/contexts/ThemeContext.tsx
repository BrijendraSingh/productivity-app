import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { APP_CONFIG } from '@productivity-app/shared';
import { lightTheme, darkTheme } from '../theme/theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialMode(): ThemeMode {
  const stored = localStorage.getItem(APP_CONFIG.THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

  useEffect(() => {
    localStorage.setItem(APP_CONFIG.THEME_STORAGE_KEY, mode);
  }, [mode]);

  const toggleTheme = () =>
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, toggleTheme, isDark: mode === 'dark' }),
    [mode],
  );

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
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
