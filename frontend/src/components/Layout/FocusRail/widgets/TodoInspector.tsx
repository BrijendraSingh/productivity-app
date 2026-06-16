import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip, Stack, Button, Skeleton, Divider } from '@mui/material';
import { CheckCircle as CompleteIcon, OpenInNew as OpenIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { TodoWithRelations } from '@productivity-app/shared';
import {
  EISENHOWER_QUADRANTS,
  TODO_STATUS_CONFIG,
  PRIORITY_LEVELS,
} from '@productivity-app/shared';
import { todosApi } from '../../../../services/api';
import { quadrantColors, statusColors } from '../../../../theme/theme';
import { dispatchTodosChanged } from '../../../../utils/events';
import { railContent, railSectionTitle } from '../railStyles';

interface TodoInspectorProps {
  todoId: number | null;
}

export function TodoInspector({ todoId }: TodoInspectorProps) {
  const navigate = useNavigate();
  const [todo, setTodo] = useState<TodoWithRelations | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!todoId) {
      setTodo(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    todosApi
      .get(todoId)
      .then((res) => {
        if (!cancelled && res.success && res.data) {
          setTodo(res.data);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [todoId]);

  if (!todoId) return null;

  if (loading) {
    return <Skeleton variant="rounded" height={160} />;
  }

  if (!todo) {
    return (
      <Typography variant="body2" color="text.secondary">
        Task not found.
      </Typography>
    );
  }

  const quadrant = todo.eisenhower_quadrant;
  const qColor = quadrant ? quadrantColors[quadrant] : undefined;
  const isCompleted = todo.status === 'completed';

  const handleComplete = async () => {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    const res = await todosApi.update(todo.id, { status: newStatus });
    if (res.success) {
      dispatchTodosChanged();
      const refreshed = await todosApi.get(todo.id);
      if (refreshed.success && refreshed.data) setTodo(refreshed.data);
    }
  };

  return (
    <Box sx={railContent}>
      <Typography component="span" sx={railSectionTitle}>
        Task inspector
      </Typography>
      <Typography variant="body1" fontWeight={600} sx={{ mb: 1, lineHeight: 1.4 }}>
        {todo.title}
      </Typography>
      {todo.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
          {todo.description}
        </Typography>
      )}
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
        <Chip
          label={TODO_STATUS_CONFIG[todo.status].label}
          size="small"
          sx={{
            height: 22,
            fontSize: '0.7rem',
            bgcolor: statusColors[todo.status],
            color: '#fff',
          }}
        />
        <Chip
          label={PRIORITY_LEVELS[todo.priority].label}
          size="small"
          variant="outlined"
          sx={{ height: 22, fontSize: '0.7rem' }}
        />
        {quadrant && (
          <Chip
            label={`${quadrant} ${EISENHOWER_QUADRANTS[quadrant].label}`}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              bgcolor: qColor,
              color: '#fff',
            }}
          />
        )}
      </Stack>
      {todo.due_date && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Due {new Date(todo.due_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
        </Typography>
      )}
      <Divider sx={{ my: 1.5 }} />
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ width: '100%' }}>
        {!isCompleted && (
          <Button
            size="small"
            variant="contained"
            startIcon={<CompleteIcon sx={{ fontSize: 16 }} />}
            onClick={handleComplete}
          >
            Complete
          </Button>
        )}
        <Button
          size="small"
          variant="outlined"
          startIcon={<OpenIcon sx={{ fontSize: 16 }} />}
          onClick={() => navigate(`/todos/${todo.id}`)}
        >
          Open
        </Button>
      </Stack>
    </Box>
  );
}
