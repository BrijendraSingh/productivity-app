import React from 'react';
import { Box, Typography, Skeleton, CircularProgress } from '@mui/material';
import type { DashboardStats } from '@productivity-app/shared';
import { designTokens } from '../../../../theme/theme';
import { railContent } from '../railStyles';

interface DailyProgressProps {
  stats: DashboardStats | null;
  loading?: boolean;
}

export function DailyProgress({ stats, loading }: DailyProgressProps) {
  if (loading || !stats) {
    return <Skeleton variant="rounded" height={100} sx={{ width: '100%' }} />;
  }

  const total = stats.todos.total;
  const completed = stats.todos.completed;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Box sx={{ ...railContent, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={72}
          thickness={4}
          sx={{ color: designTokens.colors.borderLight }}
        />
        <CircularProgress
          variant="determinate"
          value={rate}
          size={72}
          thickness={4}
          sx={{
            color: designTokens.colors.success,
            position: 'absolute',
            left: 0,
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{ fontFamily: '"Source Serif 4", serif' }}
          >
            {rate}%
          </Typography>
        </Box>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Completion rate
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', lineHeight: 1.5 }}
        >
          {completed} of {total} todos done
          {stats.todos.overdue > 0 && ` · ${stats.todos.overdue} overdue`}
        </Typography>
      </Box>
    </Box>
  );
}
