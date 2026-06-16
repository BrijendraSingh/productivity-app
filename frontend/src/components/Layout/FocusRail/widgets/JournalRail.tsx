import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { BULLET_SYMBOLS } from '@productivity-app/shared';
import type { DashboardStats } from '@productivity-app/shared';
import { designTokens, surface } from '../../../../theme/theme';

interface JournalRailProps {
  stats: DashboardStats | null;
}

export function JournalRail({ stats }: JournalRailProps) {
  const openTasks = stats ? stats.todos.pending + stats.todos.in_progress : 0;

  return (
    <Box>
      <Box
        sx={{
          ...surface.inset,
          p: 1.5,
          mb: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" fontWeight={700} sx={{ fontFamily: '"Source Serif 4", serif' }}>
          {openTasks}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          open tasks today
        </Typography>
      </Box>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
        Bullet symbols
      </Typography>
      <Stack spacing={1}>
        {BULLET_SYMBOLS.map((item) => (
          <Box
            key={item.symbol}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.25,
              py: 0.5,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                width: 20,
                textAlign: 'center',
                fontWeight: 700,
                color: designTokens.colors.primary,
              }}
            >
              {item.symbol}
            </Typography>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {item.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
