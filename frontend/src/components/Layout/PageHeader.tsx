import React from 'react';
import { Box, Typography, Stack } from '@mui/material';

interface PageHeaderProps {
  label?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ label, title, description, action }: PageHeaderProps) {
  return (
    <Box
      sx={{
        mb: 3,
        pb: 2.5,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {label && (
          <Typography className="section-label" component="p" sx={{ mb: 0.5 }}>
            {label}
          </Typography>
        )}
        <Typography
          component="h1"
          sx={{
            fontFamily: '"Source Serif 4", Georgia, serif',
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '1.75rem' },
            letterSpacing: '-0.02em',
            color: 'text.primary',
            lineHeight: 1.25,
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75, maxWidth: 560 }}>
            {description}
          </Typography>
        )}
      </Box>
      {action && (
        <Stack direction="row" spacing={1} alignItems="center">
          {action}
        </Stack>
      )}
    </Box>
  );
}
