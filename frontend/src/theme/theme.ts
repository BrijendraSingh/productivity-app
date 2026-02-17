import { createTheme, type ThemeOptions, type Theme } from '@mui/material/styles';
import {
  EISENHOWER_QUADRANTS,
  TODO_STATUS_CONFIG,
  PRIORITY_LEVELS,
} from '@productivity-app/shared';

// ─── Shared options applied to both light and dark themes ─────────────────────

const commonOptions: ThemeOptions = {
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
};

// ─── Light theme ──────────────────────────────────────────────────────────────

export const lightTheme: Theme = createTheme({
  ...commonOptions,
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
});

// ─── Dark theme ───────────────────────────────────────────────────────────────

export const darkTheme: Theme = createTheme({
  ...commonOptions,
  palette: {
    mode: 'dark',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

// ─── Custom color palettes ────────────────────────────────────────────────────

export const quadrantColors = {
  Q1: EISENHOWER_QUADRANTS.Q1.color,
  Q2: EISENHOWER_QUADRANTS.Q2.color,
  Q3: EISENHOWER_QUADRANTS.Q3.color,
  Q4: EISENHOWER_QUADRANTS.Q4.color,
} as const;

export const statusColors = {
  pending: TODO_STATUS_CONFIG.pending.color,
  in_progress: TODO_STATUS_CONFIG.in_progress.color,
  completed: TODO_STATUS_CONFIG.completed.color,
  cancelled: TODO_STATUS_CONFIG.cancelled.color,
  deferred: TODO_STATUS_CONFIG.deferred.color,
} as const;

export const priorityColors = {
  low: PRIORITY_LEVELS.low.color,
  medium: PRIORITY_LEVELS.medium.color,
  high: PRIORITY_LEVELS.high.color,
} as const;

export const bulletSymbolColors: Record<string, string> = {
  '\u2022': '#1976d2',  // •
  '\u00d7': '#4caf50',  // ×
  '\u2192': '#ff9800',  // →
  '\u25cb': '#9c27b0',  // ○
  '\u2013': '#607d8b',  // –
  '!': '#f44336',
};
