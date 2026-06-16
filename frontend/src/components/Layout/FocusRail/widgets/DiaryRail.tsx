import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Skeleton } from '@mui/material';
import { LocalFireDepartment as StreakIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { DashboardStats, DiaryEntry } from '@productivity-app/shared';
import { diaryApi } from '../../../../services/api';
import { designTokens } from '../../../../theme/theme';
import { railCard, railContent, railFullWidthButton } from '../railStyles';

interface DiaryRailProps {
  stats: DashboardStats | null;
  loading?: boolean;
}

export function DiaryRail({ stats, loading }: DiaryRailProps) {
  const navigate = useNavigate();
  const [lastEntry, setLastEntry] = useState<DiaryEntry | null>(null);
  const [entryLoading, setEntryLoading] = useState(true);

  useEffect(() => {
    diaryApi
      .list({ limit: '1' })
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setLastEntry(res.data[0]);
        }
      })
      .finally(() => setEntryLoading(false));
  }, []);

  if (loading) {
    return <Skeleton variant="rounded" height={120} sx={{ width: '100%' }} />;
  }

  const streak = stats?.diary.streak ?? 0;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Box sx={railContent}>
      <Box
        sx={{
          ...railCard,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          bgcolor: designTokens.colors.primarySoft,
          border: `1px solid ${designTokens.colors.borderLight}`,
        }}
      >
        <StreakIcon sx={{ color: '#7c3aed', flexShrink: 0 }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1 }}>
            {streak}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            day streak
          </Typography>
        </Box>
      </Box>
      <Button
        fullWidth
        variant="contained"
        startIcon={<EditIcon />}
        onClick={() => navigate(`/diary/${today}`)}
        sx={{ ...railFullWidthButton, mb: 2 }}
      >
        Write today
      </Button>
      {entryLoading ? (
        <Skeleton variant="text" width="80%" />
      ) : lastEntry ? (
        <Box sx={railContent}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Last entry
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.5 }}>
            {lastEntry.mood && `Mood: ${lastEntry.mood}`}
            {lastEntry.mood && lastEntry.weather && ' · '}
            {lastEntry.weather && `Weather: ${lastEntry.weather}`}
          </Typography>
          {lastEntry.content && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.75,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {lastEntry.content.replace(/<[^>]+>/g, '').slice(0, 120)}
            </Typography>
          )}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          Start your diary to build a streak.
        </Typography>
      )}
    </Box>
  );
}
