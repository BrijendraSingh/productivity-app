import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Skeleton,
  Alert,
  Paper,
  Tooltip,
  IconButton,
  Divider,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  ArrowUpward as UrgentIcon,
  Star as ImportantIcon,
} from '@mui/icons-material';
import type { TodoWithRelations, EisenhowerQuadrant } from '@productivity-app/shared';
import {
  EISENHOWER_QUADRANTS,
  PRIORITY_LEVELS,
  TODO_STATUS_CONFIG,
} from '@productivity-app/shared';
import { EisenhowerUtils } from '@productivity-app/shared';
import { todosApi } from '../../services/api';
import { quadrantColors } from '../../theme/theme';

// ─── Grid position mapping ────────────────────────────────────────────────────

const QUADRANT_GRID: { quadrant: EisenhowerQuadrant; row: number; col: number }[] = [
  { quadrant: 'Q1', row: 0, col: 0 }, // top-left:  Urgent + Important
  { quadrant: 'Q2', row: 0, col: 1 }, // top-right: Not Urgent + Important
  { quadrant: 'Q3', row: 1, col: 0 }, // bottom-left:  Urgent + Not Important
  { quadrant: 'Q4', row: 1, col: 1 }, // bottom-right: Not Urgent + Not Important
];

// ─── Component ────────────────────────────────────────────────────────────────

export function EisenhowerMatrixView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [todos, setTodos] = useState<TodoWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchAllTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await todosApi.list({ limit: '500' });
      if (!mountedRef.current) return;

      if (response.success && response.data) {
        setTodos(response.data);
      } else {
        setError(response.message || 'Failed to fetch todos');
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch todos');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTodos();
  }, [fetchAllTodos]);

  const grouped = EisenhowerUtils.groupByQuadrant(todos);
  const counts = EisenhowerUtils.getQuadrantCounts(todos);
  const totalTasks = todos.length;

  if (loading) {
    return <MatrixSkeleton isMobile={isMobile} />;
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Eisenhower Matrix
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Prioritize by urgency and importance — {totalTasks} task{totalTasks !== 1 ? 's' : ''}{' '}
            total
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchAllTodos} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Axis labels */}
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center', gap: 1, alignItems: 'center' }}>
        <UrgentIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing={1}>
          URGENCY &rarr;
        </Typography>
        <Box sx={{ width: 16 }} />
        <ImportantIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing={1}>
          IMPORTANCE &uarr;
        </Typography>
      </Box>

      {/* 2x2 Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gridTemplateRows: isMobile ? 'auto' : 'minmax(300px, 1fr) minmax(300px, 1fr)',
          gap: 2,
        }}
      >
        {QUADRANT_GRID.map(({ quadrant }) => {
          const info = EISENHOWER_QUADRANTS[quadrant];
          const quadrantTodos = grouped[quadrant];
          const count = counts[quadrant];

          return (
            <QuadrantCell
              key={quadrant}
              quadrant={quadrant}
              info={info}
              todos={quadrantTodos as TodoWithRelations[]}
              count={count}
            />
          );
        })}
      </Box>

      {/* Legend */}
      <MatrixLegend />
    </Box>
  );
}

// ─── Quadrant Cell ──────────────────────────────────────────────────────────

interface QuadrantCellProps {
  quadrant: EisenhowerQuadrant;
  info: { id: string; label: string; description: string; color: string; actionVerb: string };
  todos: TodoWithRelations[];
  count: number;
}

function QuadrantCell({ quadrant, info, todos, count }: QuadrantCellProps) {
  const color = quadrantColors[quadrant];
  const isEmpty = count === 0;

  return (
    <Paper
      elevation={0}
      sx={{
        border: `2px solid ${alpha(color, 0.35)}`,
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 260,
        transition: 'border-color 0.2s ease',
        '&:hover': {
          borderColor: alpha(color, 0.6),
        },
      }}
    >
      {/* Quadrant header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: alpha(color, 0.08),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${alpha(color, 0.15)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: alpha(color, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" fontWeight={800} sx={{ color, fontSize: '0.7rem' }}>
              {quadrant}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color, lineHeight: 1.2 }}>
              {info.label}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
              {info.description}
            </Typography>
          </Box>
        </Box>
        <Chip
          label={count}
          size="small"
          sx={{
            bgcolor: alpha(color, 0.15),
            color,
            fontWeight: 700,
            fontSize: '0.85rem',
            minWidth: 36,
            height: 28,
          }}
        />
      </Box>

      {/* Todo list */}
      <Box
        sx={{
          flex: 1,
          p: 1.5,
          overflowY: 'auto',
          maxHeight: 350,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha(color, 0.3),
            borderRadius: 2,
          },
        }}
      >
        {isEmpty ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 120,
            }}
          >
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              No tasks in this quadrant
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {todos.map((todo) => (
              <MatrixTodoCard key={todo.id} todo={todo} quadrantColor={color} />
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}

// ─── Compact Todo Card for Matrix ───────────────────────────────────────────

interface MatrixTodoCardProps {
  todo: TodoWithRelations;
  quadrantColor: string;
}

function MatrixTodoCard({ todo, quadrantColor }: MatrixTodoCardProps) {
  const isCompleted = todo.status === 'completed';
  const statusConfig = TODO_STATUS_CONFIG[todo.status];
  const priorityConfig = PRIORITY_LEVELS[todo.priority];
  const dueDate = todo.due_date ? new Date(todo.due_date) : null;
  const isOverdue = dueDate ? dueDate < new Date() && !isCompleted : false;

  return (
    <Card
      variant="outlined"
      sx={{
        borderLeft: `3px solid ${quadrantColor}`,
        opacity: isCompleted ? 0.6 : 1,
        transition: 'all 0.15s ease',
        '&:hover': {
          bgcolor: (theme) => alpha(quadrantColor, 0.04),
        },
      }}
    >
      <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
        {/* Title */}
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{
            textDecoration: isCompleted ? 'line-through' : 'none',
            color: isCompleted ? 'text.secondary' : 'text.primary',
            lineHeight: 1.4,
          }}
        >
          {todo.bullet_symbol} {todo.title}
        </Typography>

        {/* Metadata chips */}
        <Stack direction="row" spacing={0.5} sx={{ mt: 0.75, flexWrap: 'wrap', gap: 0.5 }}>
          {/* Status */}
          <Chip
            label={statusConfig.label}
            size="small"
            sx={{
              bgcolor: (theme) => alpha(statusConfig.color, 0.12),
              color: statusConfig.color,
              fontWeight: 600,
              fontSize: '0.65rem',
              height: 20,
            }}
          />

          {/* Priority */}
          <Chip
            icon={<FlagIcon sx={{ fontSize: 12, color: `${priorityConfig.color} !important` }} />}
            label={priorityConfig.label}
            size="small"
            sx={{
              bgcolor: (theme) => alpha(priorityConfig.color, 0.12),
              color: priorityConfig.color,
              fontWeight: 600,
              fontSize: '0.65rem',
              height: 20,
            }}
          />

          {/* Due date */}
          {dueDate && (
            <Chip
              icon={
                <ScheduleIcon
                  sx={{ fontSize: 12, color: isOverdue ? '#f44336 !important' : undefined }}
                />
              }
              label={dueDate.toLocaleDateString()}
              size="small"
              sx={{
                fontWeight: 500,
                fontSize: '0.65rem',
                height: 20,
                ...(isOverdue && {
                  bgcolor: alpha('#f44336', 0.12),
                  color: '#f44336',
                }),
              }}
            />
          )}

          {/* Category */}
          {todo.category_name && (
            <Chip
              label={todo.category_name}
              size="small"
              sx={{
                bgcolor: alpha(todo.category_color || '#757575', 0.12),
                color: todo.category_color || '#757575',
                fontWeight: 500,
                fontSize: '0.65rem',
                height: 20,
              }}
            />
          )}
        </Stack>

        {/* Urgency / Importance bar */}
        <Box sx={{ display: 'flex', gap: 1.5, mt: 0.75, alignItems: 'center' }}>
          <Tooltip title={`Urgency: ${todo.urgency_level}/10`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <UrgentIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                {todo.urgency_level}
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title={`Importance: ${todo.importance_level}/10`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <ImportantIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" fontSize="0.65rem">
                {todo.importance_level}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Legend ──────────────────────────────────────────────────────────────────

function MatrixLegend() {
  const allQuadrants = EisenhowerUtils.getAllQuadrants();

  return (
    <Paper variant="outlined" sx={{ mt: 3, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <InfoIcon fontSize="small" color="action" />
        <Typography variant="subtitle2" fontWeight={600}>
          How the Eisenhower Matrix Works
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Tasks are automatically assigned to quadrants based on their urgency and importance levels.
        Urgency and importance are rated 1–10; a threshold of 7 determines the split.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 1.5,
        }}
      >
        {allQuadrants.map((info) => (
          <Box
            key={info.id}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: info.color,
                mt: 0.5,
                flexShrink: 0,
              }}
            />
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {info.id}: {info.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {info.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <UrgentIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            = Urgency level (1–10)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ImportantIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            = Importance level (1–10)
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Threshold: &ge;7 = high
        </Typography>
      </Box>
    </Paper>
  );
}

// ─── Loading skeleton ───────────────────────────────────────────────────────

function MatrixSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width={260} height={40} />
        <Skeleton variant="text" width={180} height={20} />
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 2,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={300} />
        ))}
      </Box>
    </Box>
  );
}
