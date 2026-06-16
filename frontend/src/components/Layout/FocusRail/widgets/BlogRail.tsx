import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Edit as EditIcon, Article as BlogIcon } from '@mui/icons-material';
import type { DashboardStats } from '@productivity-app/shared';
import { designTokens } from '../../../../theme/theme';
import { railCard, railContent, railFullWidthButton, railGrid2 } from '../railStyles';

interface BlogRailProps {
  stats: DashboardStats | null;
  onNewPost?: () => void;
}

export function BlogRail({ stats, onNewPost }: BlogRailProps) {
  const published = stats?.blog.published ?? 0;
  const drafts = stats?.blog.draft ?? 0;

  return (
    <Box sx={railContent}>
      <Box sx={{ ...railGrid2, mb: 2 }}>
        <Box sx={{ ...railCard, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700} color="success.main">
            {published}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Published
          </Typography>
        </Box>
        <Box sx={{ ...railCard, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: designTokens.colors.warning }}>
            {drafts}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Drafts
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          mb: 2,
          width: '100%',
          minWidth: 0,
        }}
      >
        <BlogIcon sx={{ color: 'primary.main', flexShrink: 0, mt: 0.25 }} />
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, minWidth: 0 }}>
          Keep momentum — even 100 words counts.
        </Typography>
      </Box>
      <Button
        fullWidth
        variant="contained"
        startIcon={<EditIcon />}
        onClick={() => {
          if (onNewPost) {
            onNewPost();
          } else {
            window.dispatchEvent(new CustomEvent('open-add-blog-dialog'));
          }
        }}
        sx={railFullWidthButton}
      >
        New post
      </Button>
    </Box>
  );
}
