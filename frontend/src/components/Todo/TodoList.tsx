import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Checkbox,
  Stack,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Pagination,
  Skeleton,
  alpha,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  AccessTime as TimeIcon,
  BatteryChargingFull as EnergyIcon,
} from '@mui/icons-material';
import type {
  TodoWithRelations,
  UpdateTodoRequest,
  TodoStatus,
  PaginationMeta,
} from '@productivity-app/shared';
import {
  EISENHOWER_QUADRANTS,
  PRIORITY_LEVELS,
  TODO_STATUS_CONFIG,
} from '@productivity-app/shared';
import { quadrantColors, statusColors, priorityColors } from '../../theme/theme';

interface TodoListProps {
  todos: TodoWithRelations[];
  loading: boolean;
  meta: PaginationMeta | null;
  page: number;
  highlightId?: number | null;
  onPageChange: (page: number) => void;
  onToggleComplete: (todo: TodoWithRelations) => Promise<boolean>;
  onUpdateStatus: (id: number, data: UpdateTodoRequest) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

const STATUS_OPTIONS: TodoStatus[] = [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
  'deferred',
];

export function TodoList({
  todos,
  loading,
  meta,
  page,
  highlightId,
  onPageChange,
  onToggleComplete,
  onUpdateStatus,
  onDelete,
}: TodoListProps) {
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; todoId: number } | null>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightId, todos]);

  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  if (loading) {
    return (
      <Stack spacing={2}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={120} />
        ))}
      </Stack>
    );
  }

  if (todos.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No todos found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create your first todo or adjust your filters.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Stack spacing={1.5}>
        {todos.map((todo) => {
          const isHighlighted = highlightId != null && todo.id === highlightId;
          return (
            <div key={todo.id} ref={isHighlighted ? highlightRef : undefined}>
              <TodoCard
                todo={todo}
                highlighted={isHighlighted}
                onToggleComplete={onToggleComplete}
                onOpenMenu={(el) => setMenuAnchor({ el, todoId: todo.id })}
                onDelete={onDelete}
              />
            </div>
          );
        })}
      </Stack>

      {/* Status context menu */}
      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <Typography
          variant="caption"
          sx={{ px: 2, py: 0.5, color: 'text.secondary', display: 'block' }}
        >
          Set Status
        </Typography>
        {STATUS_OPTIONS.map((status) => {
          const config = TODO_STATUS_CONFIG[status];
          return (
            <MenuItem
              key={status}
              onClick={async () => {
                if (menuAnchor) {
                  await onUpdateStatus(menuAnchor.todoId, { status });
                }
                setMenuAnchor(null);
              }}
            >
              <ListItemIcon>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: config.color,
                  }}
                />
              </ListItemIcon>
              <ListItemText>{config.label}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => onPageChange(p)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </>
  );
}

// ─── Single Todo Card ──────────────────────────────────────────────────────────

interface TodoCardProps {
  todo: TodoWithRelations;
  highlighted?: boolean;
  onToggleComplete: (todo: TodoWithRelations) => Promise<boolean>;
  onOpenMenu: (el: HTMLElement) => void;
  onDelete: (id: number) => Promise<boolean>;
}

function TodoCard({ todo, highlighted, onToggleComplete, onOpenMenu, onDelete }: TodoCardProps) {
  const isCompleted = todo.status === 'completed';
  const statusConfig = TODO_STATUS_CONFIG[todo.status];
  const priorityConfig = PRIORITY_LEVELS[todo.priority];
  const quadrant = todo.eisenhower_quadrant;
  const quadrantInfo = quadrant ? EISENHOWER_QUADRANTS[quadrant] : null;
  const qColor = quadrant ? quadrantColors[quadrant] : undefined;

  const dueDate = todo.due_date ? new Date(todo.due_date) : null;
  const isOverdue = dueDate ? dueDate < new Date() && !isCompleted : false;

  return (
    <Card
      sx={{
        opacity: isCompleted ? 0.7 : 1,
        borderLeft: `4px solid ${qColor || '#e0e0e0'}`,
        transition: 'all 0.2s ease',
        ...(highlighted && {
          boxShadow: `0 0 0 2px ${qColor || '#1976d2'}`,
          bgcolor: (theme) => alpha(qColor || '#1976d2', 0.04),
        }),
      }}
    >
      <CardContent sx={{ pb: 1, '&:last-child': { pb: 1 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          {/* Checkbox */}
          <Checkbox
            checked={isCompleted}
            onChange={() => onToggleComplete(todo)}
            size="small"
            sx={{
              mt: -0.5,
              color: statusConfig.color,
              '&.Mui-checked': { color: statusColors.completed },
            }}
          />

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Title row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                sx={{
                  textDecoration: isCompleted ? 'line-through' : 'none',
                  color: isCompleted ? 'text.secondary' : 'text.primary',
                }}
              >
                {todo.bullet_symbol} {todo.title}
              </Typography>
            </Box>

            {/* Description */}
            {todo.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {todo.description}
              </Typography>
            )}

            {/* Chip row */}
            <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.75 }}>
              {/* Status */}
              <Chip
                label={statusConfig.label}
                size="small"
                sx={{
                  bgcolor: alpha(statusConfig.color, 0.12),
                  color: statusConfig.color,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 22,
                }}
              />

              {/* Priority */}
              <Chip
                icon={
                  <FlagIcon sx={{ fontSize: 14, color: `${priorityConfig.color} !important` }} />
                }
                label={priorityConfig.label}
                size="small"
                sx={{
                  bgcolor: alpha(priorityConfig.color, 0.12),
                  color: priorityConfig.color,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 22,
                }}
              />

              {/* Quadrant */}
              {quadrantInfo && (
                <Chip
                  label={`${quadrant} ${quadrantInfo.label}`}
                  size="small"
                  sx={{
                    bgcolor: alpha(qColor!, 0.12),
                    color: qColor,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 22,
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
                    fontSize: '0.7rem',
                    height: 22,
                  }}
                />
              )}

              {/* Due date */}
              {dueDate && (
                <Chip
                  icon={
                    <ScheduleIcon
                      sx={{ fontSize: 14, color: isOverdue ? '#f44336 !important' : undefined }}
                    />
                  }
                  label={dueDate.toLocaleDateString()}
                  size="small"
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    height: 22,
                    ...(isOverdue && {
                      bgcolor: alpha('#f44336', 0.12),
                      color: '#f44336',
                    }),
                  }}
                />
              )}

              {/* Time estimate */}
              {todo.time_estimate && (
                <Chip
                  icon={<TimeIcon sx={{ fontSize: 14 }} />}
                  label={`${todo.time_estimate}m`}
                  size="small"
                  sx={{ fontWeight: 500, fontSize: '0.7rem', height: 22 }}
                />
              )}

              {/* Energy */}
              {todo.energy_required && (
                <Chip
                  icon={<EnergyIcon sx={{ fontSize: 14 }} />}
                  label={todo.energy_required}
                  size="small"
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    height: 22,
                    textTransform: 'capitalize',
                  }}
                />
              )}

              {/* Tags */}
              {todo.tags?.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  sx={{
                    bgcolor: alpha(tag.color, 0.15),
                    color: tag.color,
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    height: 22,
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <Tooltip title="Change status">
              <IconButton size="small" onClick={(e) => onOpenMenu(e.currentTarget)}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => onDelete(todo.id)}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
