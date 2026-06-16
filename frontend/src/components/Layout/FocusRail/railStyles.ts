import type { SxProps, Theme } from '@mui/material';
import { surface } from '../../../theme/theme';

/** Constrains rail children to the panel width (prevents flex/grid overflow). */
export const railContent: SxProps<Theme> = {
  width: '100%',
  minWidth: 0,
  maxWidth: '100%',
  boxSizing: 'border-box',
};

export const railSectionTitle: SxProps<Theme> = {
  mb: 1.25,
  display: 'block',
  fontWeight: 600,
  fontSize: '0.8125rem',
  color: 'text.secondary',
  letterSpacing: '0.01em',
};

export const railCard: SxProps<Theme> = {
  ...railContent,
  ...surface.inset,
  p: 1.5,
};

export const railGrid2: SxProps<Theme> = {
  ...railContent,
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 1,
};

export const railGrid4: SxProps<Theme> = {
  ...railContent,
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 0.75,
};

export const railFullWidthButton: SxProps<Theme> = {
  width: '100%',
  minWidth: 0,
  maxWidth: '100%',
  boxSizing: 'border-box',
};

/** Matches main content vertical rhythm in AppLayout. */
export const railPanelPadding: SxProps<Theme> = {
  px: { xs: 2, sm: 2.5 },
  py: { xs: 2.5, sm: 3 },
};

export const railToolbarHeight = { xs: 56, sm: 60 } as const;
