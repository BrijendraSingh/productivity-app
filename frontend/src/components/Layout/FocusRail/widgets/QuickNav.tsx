import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import {
  CheckCircle as TodoIcon,
  GridView as MatrixIcon,
  Book as DiaryIcon,
  Article as BlogIcon,
  ChevronRight,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { railContent, railSectionTitle } from '../railStyles';

export function QuickNav() {
  const navigate = useNavigate();

  const items = [
    { label: 'Todos', path: '/todos', icon: <TodoIcon sx={{ fontSize: 18 }} /> },
    { label: 'Matrix', path: '/matrix', icon: <MatrixIcon sx={{ fontSize: 18 }} /> },
    { label: 'Diary', path: '/diary', icon: <DiaryIcon sx={{ fontSize: 18 }} /> },
    { label: 'Blog', path: '/blog', icon: <BlogIcon sx={{ fontSize: 18 }} /> },
  ];

  return (
    <Box sx={railContent}>
      <Typography component="span" sx={railSectionTitle}>
        Quick navigation
      </Typography>
      <Stack spacing={0} className="feed-divider" sx={{ width: '100%' }}>
        {items.map((item) => (
          <Box
            key={item.label}
            component="button"
            type="button"
            onClick={() => navigate(item.path)}
            sx={{
              py: 1,
              px: 0,
              display: 'grid',
              gridTemplateColumns: '20px 1fr 16px',
              alignItems: 'center',
              columnGap: 1,
              cursor: 'pointer',
              color: 'text.secondary',
              border: 'none',
              bgcolor: 'transparent',
              width: '100%',
              textAlign: 'left',
              transition: 'color 0.15s',
              '&:hover': { color: 'primary.main' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.icon}
            </Box>
            <Typography variant="body2" fontWeight={500} noWrap>
              {item.label}
            </Typography>
            <ChevronRight sx={{ fontSize: 16, opacity: 0.45, justifySelf: 'end' }} />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
