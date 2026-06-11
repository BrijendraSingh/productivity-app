import React, { useState, useEffect, useRef } from 'react';
import {
  Typography,
  Box,
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
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import {
  DeleteOutline as DeleteIcon,
  MoreHoriz as MoreIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  AccessTime as TimeIcon,
  BatteryChargingFull as EnergyIcon,
  Add as AddIcon,
  CheckCircleOutline as EmptyIcon,
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
import { quadrantColors, statusColors, priorityColors, designTokens } from '../../theme/theme';

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
  onAddTodo?: () => void;
  embedded?: boolean;
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
  onAddTodo,
  embedded = false,
}: TodoListProps) {
  const theme = useTheme();
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
      <Box sx={{ p: embedded ? 2 : 0 }}>
        <Stack spacing={0}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Box
              key={i}
              sx={{ py: 1.5, px: 2, borderBottom: `1px solid ${theme.palette.divider}` }}
            >
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={18} sx={{ mt: 0.5 }} />
            </Box>
          ))}
        </Stack>
      </Box>
    );
  }

  if (todos.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
        <EmptyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
        <Typography variant="subtitle1" fontWeight={600} color="text.secondary" gutterBottom>
          No todos found
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 320, mx: 'auto' }}
        >
          Create a task or adjust your filters to see results here.
        </Typography>
        {onAddTodo && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={onAddTodo}>
            Create your first todo
          </Button>
        )}
      </Box>
    );
  }

  return (
    <>
      {/* Column headers — desktop only (Celigo data-table style) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'grid' },
          gridTemplateColumns: '40px 1fr 100px 90px 110px 72px',
          gap: 1,
          px: 2,
          py: 1,
          bgcolor: alpha(designTokens.colors.canvas, 0.6),
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box />
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ pl: 0.5 }}>
          Task
        </Typography>
        <Typography variant="caption" fontWeight={600} color="text.secondary">
          Status
        </Typography>
        <Typography variant="caption" fontWeight={600} color="text.secondary">
          Priority
        </Typography>
        <Typography variant="caption" fontWeight={600} color="text.secondary">
          Quadrant
        </Typography>
        <Box />
      </Box>

      {/* Grouped list rows (Apple-style) */}
      <Box>
        {todos.map((todo, index) => {
          const isHighlighted = highlightId != null && todo.id === highlightId;
          const isLast = index === todos.length - 1;
          return (
            <div key={todo.id} ref={isHighlighted ? highlightRef : undefined}>
              <TodoRow
                todo={todo}
                highlighted={isHighlighted}
                isLast={isLast && totalPages <= 1}
                onToggleComplete={onToggleComplete}
                onOpenMenu={(el) => setMenuAnchor({ el, todoId: todo.id })}
                onDelete={onDelete}
              />
            </div>
          );
        })}
      </Box>

      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Typography
          variant="caption"
          sx={{ px: 2, py: 0.75, color: 'text.secondary', display: 'block', fontWeight: 600 }}
        >
          Change status
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
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: config.color,
                  }}
                />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }}>
                {config.label}
              </ListItemText>
            </MenuItem>
          );
        })}
      </Menu>

      {totalPages > 1 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            py: 2,
            px: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => onPageChange(p)}
            color="primary"
            size="small"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </>
  );
}

// ─── Single row ──────────────────────────────────────────────────────────────

interface TodoRowProps {
  todo: TodoWithRelations;
  highlighted?: boolean;
  isLast?: boolean;
  onToggleComplete: (todo: TodoWithRelations) => Promise<boolean>;
  onOpenMenu: (el: HTMLElement) => void;
  onDelete: (id: number) => Promise<boolean>;
}

function TodoRow({
  todo,
  highlighted,
  isLast,
  onToggleComplete,
  onOpenMenu,
  onDelete,
}: TodoRowProps) {
  const theme = useTheme();
  const isCompleted = todo.status === 'completed';
  const statusConfig = TODO_STATUS_CONFIG[todo.status];
  const priorityConfig = PRIORITY_LEVELS[todo.priority];
  const quadrant = todo.eisenhower_quadrant;
  const quadrantInfo = quadrant ? EISENHOWER_QUADRANTS[quadrant] : null;
  const qColor = quadrant ? quadrantColors[quadrant] : undefined;

  const dueDate = todo.due_date ? new Date(todo.due_date) : null;
  const isOverdue = dueDate ? dueDate < new Date() && !isCompleted : false;

  const metaItems: { icon: React.ReactNode; label: string; color?: string }[] = [];

  if (todo.category_name) {
    metaItems.push({
      icon: (
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: todo.category_color || theme.palette.text.secondary,
          }}
        />
      ),
      label: todo.category_name,
    });
  }
  if (dueDate) {
    metaItems.push({
      icon: <ScheduleIcon sx={{ fontSize: 13 }} />,
      label: dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      color: isOverdue ? designTokens.colors.error : undefined,
    });
  }
  if (todo.time_estimate) {
    metaItems.push({
      icon: <TimeIcon sx={{ fontSize: 13 }} />,
      label: `${todo.time_estimate}m`,
    });
  }
  if (todo.energy_required) {
    metaItems.push({
      icon: <EnergyIcon sx={{ fontSize: 13 }} />,
      label: todo.energy_required,
    });
  }
  todo.tags?.forEach((tag) => {
    metaItems.push({
      icon: <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tag.color }} />,
      label: tag.name,
      color: tag.color,
    });
  });

  return (
    <Box
      className="todo-row"
      sx={{
        display: { xs: 'flex', md: 'grid' },
        gridTemplateColumns: { md: '40px 1fr 100px 90px 110px 72px' },
        alignItems: { xs: 'flex-start', md: 'center' },
        gap: { xs: 0, md: 1 },
        px: { xs: 1.5, sm: 2 },
        py: { xs: 1.5, md: 1.25 },
        borderBottom: isLast ? 'none' : `1px solid ${theme.palette.divider}`,
        bgcolor: highlighted ? alpha(qColor || theme.palette.primary.main, 0.06) : 'transparent',
        transition: 'background-color 0.15s ease',
        '&:hover': {
          bgcolor: highlighted
            ? alpha(qColor || theme.palette.primary.main, 0.08)
            : designTokens.colors.surfaceHover,
          '& .todo-row-actions': { opacity: 1 },
        },
        position: 'relative',
        ...(highlighted && {
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            bgcolor: qColor || theme.palette.primary.main,
          },
        }),
      }}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isCompleted}
        onChange={() => onToggleComplete(todo)}
        size="small"
        sx={{
          p: 0.5,
          mt: { xs: 0.25, md: 0 },
          color: alpha(statusConfig.color, 0.5),
          '&.Mui-checked': { color: statusColors.completed },
        }}
      />

      {/* Title + description + mobile meta */}
      <Box sx={{ flex: 1, minWidth: 0, pl: { xs: 0.5, md: 0 } }}>
        <Typography
          variant="body1"
          fontWeight={500}
          sx={{
            fontSize: '0.9375rem',
            lineHeight: 1.4,
            textDecoration: isCompleted ? 'line-through' : 'none',
            color: isCompleted ? 'text.secondary' : 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {todo.bullet_symbol && (
            <Box component="span" sx={{ color: qColor || 'text.secondary', mr: 0.5 }}>
              {todo.bullet_symbol}
            </Box>
          )}
          {todo.title}
        </Typography>

        {todo.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.8125rem',
            }}
          >
            {todo.description}
          </Typography>
        )}

        {/* Mobile-only inline meta */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            display: { xs: 'flex', md: 'none' },
            mt: 0.75,
            flexWrap: 'wrap',
            gap: 0.75,
          }}
        >
          <StatusPill label={statusConfig.label} color={statusConfig.color} />
          <PriorityPill label={priorityConfig.label} color={priorityConfig.color} />
          {quadrantInfo && (
            <QuadrantPill label={`${quadrant} · ${quadrantInfo.label}`} color={qColor!} />
          )}
          {metaItems.map((item, i) => (
            <MetaText key={i} icon={item.icon} label={item.label} color={item.color} />
          ))}
        </Stack>

        {/* Desktop secondary meta under title */}
        {metaItems.length > 0 && (
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              display: { xs: 'none', md: 'flex' },
              mt: 0.5,
              flexWrap: 'wrap',
              gap: 0.5,
            }}
          >
            {metaItems.map((item, i) => (
              <MetaText key={i} icon={item.icon} label={item.label} color={item.color} />
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop columns */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <StatusPill label={statusConfig.label} color={statusConfig.color} />
      </Box>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <PriorityPill label={priorityConfig.label} color={priorityConfig.color} />
      </Box>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        {quadrantInfo ? (
          <QuadrantPill label={`${quadrant} · ${quadrantInfo.label}`} color={qColor!} />
        ) : (
          <Typography variant="caption" color="text.disabled">
            —
          </Typography>
        )}
      </Box>

      {/* Actions — reveal on hover (Apple pattern) */}
      <Box
        className="todo-row-actions"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 0.25,
          opacity: { xs: 1, md: 0 },
          transition: 'opacity 0.15s ease',
          position: { xs: 'absolute', md: 'static' },
          right: { xs: 8, md: 'auto' },
          top: { xs: 8, md: 'auto' },
        }}
      >
        <Tooltip title="Change status">
          <IconButton size="small" onClick={(e) => onOpenMenu(e.currentTarget)}>
            <MoreIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => onDelete(todo.id)}
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.08) },
            }}
          >
            <DeleteIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

// ─── Micro components ─────────────────────────────────────────────────────────

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.75}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Typography variant="caption" fontWeight={500} sx={{ color, fontSize: '0.75rem' }}>
        {label}
      </Typography>
    </Stack>
  );
}

function PriorityPill({ label, color }: { label: string; color: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <FlagIcon sx={{ fontSize: 13, color }} />
      <Typography variant="caption" fontWeight={500} sx={{ color, fontSize: '0.75rem' }}>
        {label}
      </Typography>
    </Stack>
  );
}

function QuadrantPill({ label, color }: { label: string; color: string }) {
  return (
    <Typography
      variant="caption"
      fontWeight={500}
      sx={{
        fontSize: '0.75rem',
        color,
        bgcolor: alpha(color, 0.1),
        px: 1,
        py: 0.25,
        borderRadius: 1,
        display: 'inline-block',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: 110,
      }}
    >
      {label}
    </Typography>
  );
}

function MetaText({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color?: string;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Box sx={{ color: color || 'text.disabled', display: 'flex', alignItems: 'center' }}>
        {icon}
      </Box>
      <Typography
        variant="caption"
        sx={{
          color: color || 'text.secondary',
          fontSize: '0.75rem',
          textTransform: color ? 'none' : 'capitalize',
        }}
      >
        {label}
      </Typography>
    </Stack>
  );
}
