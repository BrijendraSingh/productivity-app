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

export function QuickNav() {
  const navigate = useNavigate();

  const items = [
    { label: 'Todos', path: '/todos', icon: <TodoIcon fontSize="small" /> },
    { label: 'Matrix', path: '/matrix', icon: <MatrixIcon fontSize="small" /> },
    { label: 'Diary', path: '/diary', icon: <DiaryIcon fontSize="small" /> },
    { label: 'Blog', path: '/blog', icon: <BlogIcon fontSize="small" /> },
  ];

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
        Quick navigation
      </Typography>
      <Stack spacing={0} className="feed-divider">
        {items.map((item) => (
          <Box
            key={item.label}
            component="button"
            type="button"
            onClick={() => navigate(item.path)}
            sx={{
              py: 1.25,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
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
            {item.icon}
            <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
              {item.label}
            </Typography>
            <ChevronRight sx={{ fontSize: 16, opacity: 0.5 }} />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
