import React from 'react';
import { Box, Typography, Stack, Checkbox } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { TodoWithRelations } from '@productivity-app/shared';
import { designTokens, surface, quadrantColors } from '../../../../theme/theme';

interface Q1ActionQueueProps {
  todos: TodoWithRelations[];
  onToggleComplete?: (todo: TodoWithRelations) => void;
}

export function Q1ActionQueue({ todos, onToggleComplete }: Q1ActionQueueProps) {
  const navigate = useNavigate();
  const q1Todos = todos.filter((t) => t.eisenhower_quadrant === 'Q1' && t.status !== 'completed');

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, color: quadrantColors.Q1 }}>
        Q1 — Do first
      </Typography>
      {q1Todos.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No urgent-important tasks right now.
        </Typography>
      ) : (
        <Stack spacing={0.75} sx={{ maxHeight: 220, overflowY: 'auto' }}>
          {q1Todos.slice(0, 10).map((todo) => (
            <Box
              key={todo.id}
              sx={{
                ...surface.inset,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0.75,
                p: 1,
                border: `1px solid ${designTokens.colors.borderLight}`,
              }}
            >
              <Checkbox
                size="small"
                checked={false}
                onChange={() => onToggleComplete?.(todo)}
                sx={{ p: 0.25, mt: -0.25 }}
              />
              <Box
                component="button"
                type="button"
                onClick={() => navigate(`/todos/${todo.id}`)}
                sx={{
                  border: 'none',
                  bgcolor: 'transparent',
                  p: 0,
                  m: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Typography variant="body2" fontWeight={500} sx={{ lineHeight: 1.35 }}>
                  {todo.title}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
