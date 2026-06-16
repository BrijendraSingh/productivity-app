import React from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useFocusRail, type AnalyticsTimeRange } from '../../../../contexts/FocusRailContext';
import { railContent, railFullWidthButton, railSectionTitle } from '../railStyles';

const RANGES: { value: AnalyticsTimeRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

export function AnalyticsRail() {
  const { analyticsRange, setAnalyticsRange } = useFocusRail();

  return (
    <Box sx={railContent}>
      <Typography component="span" sx={railSectionTitle}>
        Date range
      </Typography>
      <ToggleButtonGroup
        value={analyticsRange}
        exclusive
        onChange={(_, v: AnalyticsTimeRange | null) => {
          if (v) setAnalyticsRange(v);
        }}
        orientation="vertical"
        fullWidth
        size="small"
        sx={{
          ...railFullWidthButton,
          '& .MuiToggleButtonGroup-grouped': {
            width: '100%',
            boxSizing: 'border-box',
          },
          '& .MuiToggleButton-root': {
            textTransform: 'none',
            fontWeight: 500,
            justifyContent: 'flex-start',
            px: 2,
            width: '100%',
            boxSizing: 'border-box',
          },
        }}
      >
        {RANGES.map((r) => (
          <ToggleButton key={r.value} value={r.value}>
            {r.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
