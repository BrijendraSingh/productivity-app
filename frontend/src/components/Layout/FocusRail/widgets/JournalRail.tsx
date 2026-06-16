import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { BULLET_SYMBOLS } from '@productivity-app/shared';
import type { DashboardStats } from '@productivity-app/shared';
import { designTokens } from '../../../../theme/theme';
import { railCard, railContent, railSectionTitle } from '../railStyles';

interface JournalRailProps {
  stats: DashboardStats | null;
}

export function JournalRail({ stats }: JournalRailProps) {
  const openTasks = stats ? stats.todos.pending + stats.todos.in_progress : 0;

  return (
    <Box sx={railContent}>
      <Box sx={{ ...railCard, mb: 2, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700} sx={{ fontFamily: '"Source Serif 4", serif' }}>
          {openTasks}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          open tasks today
        </Typography>
      </Box>
      <Typography component="span" sx={railSectionTitle}>
        Bullet symbols
      </Typography>
      <Stack spacing={1} sx={railContent}>
        {BULLET_SYMBOLS.map((item) => (
          <Box
            key={item.symbol}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.25,
              py: 0.5,
              width: '100%',
            }}
          >
            <Typography
              variant="body1"
              sx={{
                width: 20,
                flexShrink: 0,
                textAlign: 'center',
                fontWeight: 700,
                color: designTokens.colors.primary,
              }}
            >
              {item.symbol}
            </Typography>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                {item.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                {item.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
