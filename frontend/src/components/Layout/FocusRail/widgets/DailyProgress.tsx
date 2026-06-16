import React from 'react';
import { Box, Typography, Skeleton, CircularProgress } from '@mui/material';
import type { DashboardStats } from '@productivity-app/shared';
import { designTokens } from '../../../../theme/theme';
import { railContent, railSectionTitle } from '../railStyles';

interface DailyProgressProps {
  stats: DashboardStats | null;
  loading?: boolean;
}

const RING_SIZE = 64;

export function DailyProgress({ stats, loading }: DailyProgressProps) {
  if (loading || !stats) {
    return <Skeleton variant="rounded" height={88} sx={{ width: '100%' }} />;
  }

  const total = stats.todos.total;
  const completed = stats.todos.completed;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Box sx={railContent}>
      <Typography component="span" sx={railSectionTitle}>
        Completion rate
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
        <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={RING_SIZE}
            thickness={4}
            sx={{ color: designTokens.colors.borderLight }}
          />
          <CircularProgress
            variant="determinate"
            value={rate}
            size={RING_SIZE}
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
              sx={{ fontFamily: '"Source Serif 4", serif', fontSize: '0.8125rem' }}
            >
              {rate}%
            </Typography>
          </Box>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
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
    </Box>
  );
}
