import React from 'react';
import { Box, Typography, Stack, Skeleton } from '@mui/material';
import { Schedule as ScheduleIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { TodoWithRelations } from '@productivity-app/shared';
import { designTokens } from '../../../../theme/theme';
import { railCard, railContent, railSectionTitle } from '../railStyles';

interface UpcomingDeadlinesProps {
  todos: TodoWithRelations[];
  loading?: boolean;
}

export function UpcomingDeadlines({ todos, loading }: UpcomingDeadlinesProps) {
  const navigate = useNavigate();

  if (loading) {
    return <Skeleton variant="rounded" height={120} sx={{ width: '100%' }} />;
  }

  return (
    <Box sx={railContent}>
      <Typography component="span" sx={railSectionTitle}>
        Upcoming deadlines
      </Typography>
      {todos.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5, m: 0 }}>
          No due dates in the next 7 days.
        </Typography>
      ) : (
        <Stack spacing={0.75} sx={railContent}>
          {todos.map((todo) => {
            const due = todo.due_date
              ? new Date(todo.due_date).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })
              : '';
            return (
              <Box
                key={todo.id}
                component="button"
                type="button"
                onClick={() => navigate(`/todos/${todo.id}`)}
                sx={{
                  ...railCard,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  p: 1.25,
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: `1px solid ${designTokens.colors.borderLight}`,
                  transition: 'border-color 0.15s',
                  '&:hover': { borderColor: designTokens.colors.primary },
                }}
              >
                <ScheduleIcon
                  sx={{ fontSize: 16, color: 'primary.main', mt: 0.25, flexShrink: 0 }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" fontWeight={500} noWrap>
                    {todo.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {due}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
