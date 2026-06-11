import { createTheme, type ThemeOptions, type Theme, alpha } from '@mui/material/styles';
import {
  EISENHOWER_QUADRANTS,
  TODO_STATUS_CONFIG,
  PRIORITY_LEVELS,
} from '@productivity-app/shared';

// ─── Design tokens: Google clarity + Apple polish + Celigo SaaS ───────────────

export const designTokens = {
  fontSans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSerif: '"Source Serif 4", Georgia, "Times New Roman", serif',
  radius: { sm: 8, md: 12, lg: 16, pill: 999 },
  colors: {
    // Google-style primary blue
    primary: '#1a73e8',
    primaryHover: '#1557b0',
    primarySoft: '#e8f0fe',
    // Surfaces — Apple-inspired layered grays
    canvas: '#f0f2f5',
    sidebar: '#ffffff',
    surface: '#ffffff',
    surfaceHover: '#f8f9fb',
    border: '#e1e4e8',
    borderLight: '#eef0f3',
    // Text
    textPrimary: '#1a1d21',
    textSecondary: '#5f6368',
    textMuted: '#80868b',
    // Accents
    success: '#1e8e3e',
    warning: '#f9ab00',
    error: '#d93025',
  },
  shadow: {
    card: '0 1px 2px rgba(60,64,67,0.06), 0 1px 3px rgba(60,64,67,0.1)',
    cardHover: '0 2px 6px rgba(60,64,67,0.08), 0 4px 12px rgba(60,64,67,0.1)',
    header: '0 1px 0 rgba(60,64,67,0.08)',
  },
} as const;

const { colors: c, fontSans, fontSerif, radius, shadow } = designTokens;

/** Reusable surface styles for cards and panels */
export const surface = {
  card: {
    bgcolor: c.surface,
    borderRadius: `${radius.md}px`,
    border: `1px solid ${c.borderLight}`,
    boxShadow: shadow.card,
    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
    '&:hover': {
      boxShadow: shadow.cardHover,
    },
  },
  panel: {
    bgcolor: c.surface,
    borderRadius: `${radius.md}px`,
    border: `1px solid ${c.borderLight}`,
    boxShadow: 'none',
  },
  inset: {
    bgcolor: c.canvas,
    borderRadius: `${radius.sm}px`,
    border: `1px solid ${c.borderLight}`,
  },
} as const;

// ─── Shared MUI options ───────────────────────────────────────────────────────

const commonOptions: ThemeOptions = {
  typography: {
    fontFamily: fontSans,
    fontSize: 14,
    h1: { fontFamily: fontSerif, fontWeight: 700, letterSpacing: '-0.025em', fontSize: '2rem' },
    h2: { fontFamily: fontSerif, fontWeight: 700, letterSpacing: '-0.02em', fontSize: '1.625rem' },
    h3: { fontWeight: 600, letterSpacing: '-0.015em', fontSize: '1.375rem' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1.125rem' },
    h5: { fontWeight: 600, fontSize: '1rem' },
    h6: { fontWeight: 600, fontSize: '0.9375rem' },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 500 },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 500 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.55 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
    overline: {
      fontSize: '0.6875rem',
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: c.primary,
    },
    button: { fontWeight: 500, fontSize: '0.875rem' },
  },
  shape: { borderRadius: radius.sm },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          backgroundColor: c.canvas,
        },
        '#root': { minHeight: '100dvh' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          ...surface.card,
          '&:hover': surface.card['&:hover'],
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: radius.sm,
          fontWeight: 500,
          padding: '8px 16px',
        },
        containedPrimary: {
          backgroundColor: c.primary,
          '&:hover': { backgroundColor: c.primaryHover },
        },
        outlined: {
          borderColor: c.border,
          color: c.textPrimary,
          '&:hover': {
            borderColor: c.primary,
            backgroundColor: c.primarySoft,
          },
        },
        text: {
          color: c.textSecondary,
          '&:hover': { backgroundColor: c.primarySoft, color: c.primary },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: c.textSecondary,
          borderRadius: radius.sm,
          '&:hover': { backgroundColor: c.primarySoft, color: c.primary },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 500, fontSize: '0.75rem' },
        outlined: { borderColor: c.border },
        filled: { backgroundColor: c.primarySoft, color: c.primary },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: radius.md,
          width: 52,
          height: 52,
          backgroundColor: c.primary,
          boxShadow: '0 4px 12px rgba(26,115,232,0.35)',
          '&:hover': {
            backgroundColor: c.primaryHover,
            boxShadow: '0 6px 16px rgba(26,115,232,0.4)',
          },
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none', boxShadow: shadow.header } },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: `1px solid ${c.borderLight}`, boxShadow: 'none' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          margin: '1px 10px',
          padding: '8px 12px',
          color: c.textSecondary,
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: c.surfaceHover,
            color: c.textPrimary,
          },
          '&.Mui-selected': {
            backgroundColor: c.primarySoft,
            color: c.primary,
            fontWeight: 600,
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '20%',
              bottom: '20%',
              width: 3,
              borderRadius: '0 3px 3px 0',
              backgroundColor: c.primary,
            },
            '& .MuiListItemIcon-root': { color: c.primary },
            '&:hover': { backgroundColor: alpha(c.primary, 0.14) },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { color: c.textMuted, minWidth: 36 },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: c.borderLight } },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: radius.sm,
            backgroundColor: c.surface,
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: c.border },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: c.primary },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radius.lg,
          border: `1px solid ${c.borderLight}`,
          boxShadow: '0 8px 32px rgba(60,64,67,0.18)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: c.primary, height: 3, borderRadius: '3px 3px 0 0' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 44,
          color: c.textSecondary,
          '&.Mui-selected': { color: c.primary, fontWeight: 600 },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.75rem',
          borderColor: c.border,
          color: c.textSecondary,
          '&.Mui-selected': {
            backgroundColor: c.primarySoft,
            color: c.primary,
            borderColor: alpha(c.primary, 0.3),
            '&:hover': { backgroundColor: alpha(c.primary, 0.14) },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: radius.sm } },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, backgroundColor: c.primarySoft, height: 6 },
        bar: { borderRadius: 4, backgroundColor: c.primary },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontSize: '0.75rem',
          backgroundColor: c.textPrimary,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: radius.md,
          border: `1px solid ${c.borderLight}`,
          boxShadow: shadow.cardHover,
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: c.primary },
        thumb: { width: 18, height: 18 },
      },
    },
  },
};

// ─── Light theme (only theme — dark mode removed per UX feedback) ─────────────

export const lightTheme: Theme = createTheme({
  ...commonOptions,
  palette: {
    mode: 'light',
    primary: { main: c.primary, dark: c.primaryHover, light: c.primarySoft, contrastText: '#fff' },
    secondary: { main: c.textSecondary, contrastText: '#fff' },
    success: { main: c.success },
    warning: { main: c.warning },
    error: { main: c.error },
    text: { primary: c.textPrimary, secondary: c.textSecondary, disabled: c.textMuted },
    divider: c.borderLight,
    background: { default: c.canvas, paper: c.surface },
    action: {
      hover: c.surfaceHover,
      selected: c.primarySoft,
      disabled: c.textMuted,
    },
  },
});

// Kept for type compatibility — identical to light
export const darkTheme: Theme = lightTheme;

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
  '\u2022': c.primary,
  '\u00d7': c.success,
  '\u2192': '#e37400',
  '\u25cb': '#9334e6',
  '\u2013': c.textMuted,
  '!': c.error,
};
