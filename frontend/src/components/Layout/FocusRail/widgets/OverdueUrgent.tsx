import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { TodoWithRelations } from '@productivity-app/shared';
import { designTokens, surface, quadrantColors } from '../../../../theme/theme';

interface OverdueUrgentProps {
  todos: TodoWithRelations[];
}

export function OverdueUrgent({ todos }: OverdueUrgentProps) {
  const navigate = useNavigate();

  if (todos.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No overdue or urgent tasks. You&apos;re on track.
      </Typography>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
        <WarningIcon sx={{ fontSize: 18, color: designTokens.colors.error }} />
        <Typography variant="subtitle2" fontWeight={600}>
          Overdue &amp; urgent
        </Typography>
      </Box>
      <Stack spacing={0.75}>
        {todos.map((todo) => (
          <Box
            key={todo.id}
            component="button"
            type="button"
            onClick={() => navigate(`/todos/${todo.id}`)}
            sx={{
              ...surface.inset,
              display: 'block',
              width: '100%',
              textAlign: 'left',
              p: 1.25,
              cursor: 'pointer',
              border: `1px solid ${designTokens.colors.borderLight}`,
              borderLeft: `3px solid ${todo.eisenhower_quadrant === 'Q1' ? quadrantColors.Q1 : designTokens.colors.error}`,
              '&:hover': { borderColor: designTokens.colors.primary },
            }}
          >
            <Typography variant="body2" fontWeight={500} noWrap>
              {todo.title}
            </Typography>
            {todo.due_date && (
              <Typography variant="caption" color="error">
                Due {new Date(todo.due_date).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
