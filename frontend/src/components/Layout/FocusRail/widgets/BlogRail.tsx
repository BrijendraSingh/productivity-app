import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { Edit as EditIcon, Article as BlogIcon } from '@mui/icons-material';
import type { DashboardStats } from '@productivity-app/shared';
import { designTokens, surface } from '../../../../theme/theme';

interface BlogRailProps {
  stats: DashboardStats | null;
  onNewPost?: () => void;
}

export function BlogRail({ stats, onNewPost }: BlogRailProps) {
  const published = stats?.blog.published ?? 0;
  const drafts = stats?.blog.draft ?? 0;

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Box sx={{ ...surface.inset, flex: 1, p: 1.5, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700} color="success.main">
            {published}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Published
          </Typography>
        </Box>
        <Box sx={{ ...surface.inset, flex: 1, p: 1.5, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: designTokens.colors.warning }}>
            {drafts}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Drafts
          </Typography>
        </Box>
      </Stack>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <BlogIcon sx={{ color: 'primary.main' }} />
        <Typography variant="body2" color="text.secondary">
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
      >
        New post
      </Button>
    </Box>
  );
}
