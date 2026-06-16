import React from 'react';
import { Box, Typography } from '@mui/material';
import { useAuth } from '../../../../contexts/AuthContext';
import { railContent } from '../railStyles';

export function RailHeader() {
  const { user } = useAuth();
  const now = new Date();

  const greeting = (() => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const dateStr = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Box sx={railContent}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
        {dateStr}
      </Typography>
      <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.3 }}>
        {greeting}
        {user ? `, ${user.username.split('@')[0]}` : ''}
      </Typography>
    </Box>
  );
}
