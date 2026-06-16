import React from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useFocusRail, type AnalyticsTimeRange } from '../../../../contexts/FocusRailContext';

const RANGES: { value: AnalyticsTimeRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

export function AnalyticsRail() {
  const { analyticsRange, setAnalyticsRange } = useFocusRail();

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
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
          '& .MuiToggleButton-root': {
            textTransform: 'none',
            fontWeight: 500,
            justifyContent: 'flex-start',
            px: 2,
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
