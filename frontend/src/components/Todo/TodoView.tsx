import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Typography,
  Paper,
  Alert,
  IconButton,
  Tooltip,
  Collapse,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  CheckCircle as CompletedIcon,
  HourglassEmpty as PendingIcon,
  PlayArrow as InProgressIcon,
  Assignment as TotalIcon,
} from '@mui/icons-material';
import type {
  TodoStatus,
  Priority,
  EisenhowerQuadrant,
} from '@productivity-app/shared';
import {
  EISENHOWER_QUADRANTS,
  PRIORITY_LEVELS,
  TODO_STATUS_CONFIG,
} from '@productivity-app/shared';
import { quadrantColors, statusColors, priorityColors } from '../../theme/theme';
import { useTodos } from '../../hooks/useTodos';
import { TodoList } from './TodoList';
import { AddTodoDialog } from './AddTodoDialog';

// ─── Filter option arrays ────────────────────────────────────────────────────

const STATUS_FILTERS: { value: TodoStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: statusColors.pending },
  { value: 'in_progress', label: 'In Progress', color: statusColors.in_progress },
  { value: 'completed', label: 'Completed', color: statusColors.completed },
  { value: 'cancelled', label: 'Cancelled', color: statusColors.cancelled },
  { value: 'deferred', label: 'Deferred', color: statusColors.deferred },
];

const PRIORITY_FILTERS: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: priorityColors.high },
  { value: 'medium', label: 'Medium', color: priorityColors.medium },
  { value: 'low', label: 'Low', color: priorityColors.low },
];

const QUADRANT_FILTERS: { value: EisenhowerQuadrant; label: string; color: string }[] = [
  { value: 'Q1', label: `Q1 ${EISENHOWER_QUADRANTS.Q1.label}`, color: quadrantColors.Q1 },
  { value: 'Q2', label: `Q2 ${EISENHOWER_QUADRANTS.Q2.label}`, color: quadrantColors.Q2 },
  { value: 'Q3', label: `Q3 ${EISENHOWER_QUADRANTS.Q3.label}`, color: quadrantColors.Q3 },
  { value: 'Q4', label: `Q4 ${EISENHOWER_QUADRANTS.Q4.label}`, color: quadrantColors.Q4 },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function TodoView() {
  const theme = useTheme();
  const { id: idParam } = useParams<{ id: string }>();
  const highlightId = idParam ? parseInt(idParam, 10) : null;
  const {
    todos,
    loading,
    error,
    filters,
    page,
    meta,
    categories,
    tags,
    setFilters,
    resetFilters,
    setPage,
    refresh,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    stats,
  } = useTodos();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Listen for FAB click dispatched from AppLayout
  useTodoDialogEvent(useCallback(() => setDialogOpen(true), []));

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (searchTimeout) clearTimeout(searchTimeout);
      const timeout = setTimeout(() => {
        setFilters({ search: value });
      }, 350);
      setSearchTimeout(timeout);
    },
    [setFilters, searchTimeout],
  );

  const hasActiveFilters =
    filters.status !== '' ||
    filters.priority !== '' ||
    filters.quadrant !== '' ||
    filters.category_id !== '' ||
    filters.search !== '';

  const handleOpenDialog = useCallback(() => setDialogOpen(true), []);
  const handleCloseDialog = useCallback(() => setDialogOpen(false), []);

  return (
    <Box>
      {/* ─── Quick Stats ─────────────────────────────────────────────────── */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <StatChip
          icon={<TotalIcon sx={{ fontSize: 16 }} />}
          label={`${stats.total} Total`}
          color={theme.palette.primary.main}
        />
        <StatChip
          icon={<PendingIcon sx={{ fontSize: 16 }} />}
          label={`${stats.pending} Pending`}
          color={statusColors.pending}
        />
        <StatChip
          icon={<InProgressIcon sx={{ fontSize: 16 }} />}
          label={`${stats.in_progress} In Progress`}
          color={statusColors.in_progress}
        />
        <StatChip
          icon={<CompletedIcon sx={{ fontSize: 16 }} />}
          label={`${stats.completed} Done`}
          color={statusColors.completed}
        />
      </Stack>

      {/* ─── Search Bar + Controls ───────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            placeholder="Search todos..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            size="small"
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearchInput('');
                        setFilters({ search: '' });
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />
          <Tooltip title="Toggle filters">
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters || hasActiveFilters ? 'primary' : 'default'}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={refresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* ─── Filter Chips ──────────────────────────────────────────────── */}
        <Collapse in={showFilters}>
          <Box sx={{ mt: 2 }}>
            {/* Status */}
            <FilterSection label="Status">
              {STATUS_FILTERS.map((s) => (
                <Chip
                  key={s.value}
                  label={s.label}
                  size="small"
                  onClick={() =>
                    setFilters({ status: filters.status === s.value ? '' : s.value })
                  }
                  sx={{
                    fontWeight: 500,
                    ...(filters.status === s.value
                      ? { bgcolor: s.color, color: '#fff' }
                      : {
                          bgcolor: alpha(s.color, 0.1),
                          color: s.color,
                          '&:hover': { bgcolor: alpha(s.color, 0.2) },
                        }),
                  }}
                />
              ))}
            </FilterSection>

            {/* Priority */}
            <FilterSection label="Priority">
              {PRIORITY_FILTERS.map((p) => (
                <Chip
                  key={p.value}
                  label={p.label}
                  size="small"
                  onClick={() =>
                    setFilters({ priority: filters.priority === p.value ? '' : p.value })
                  }
                  sx={{
                    fontWeight: 500,
                    ...(filters.priority === p.value
                      ? { bgcolor: p.color, color: '#fff' }
                      : {
                          bgcolor: alpha(p.color, 0.1),
                          color: p.color,
                          '&:hover': { bgcolor: alpha(p.color, 0.2) },
                        }),
                  }}
                />
              ))}
            </FilterSection>

            {/* Quadrant */}
            <FilterSection label="Quadrant">
              {QUADRANT_FILTERS.map((q) => (
                <Chip
                  key={q.value}
                  label={q.label}
                  size="small"
                  onClick={() =>
                    setFilters({ quadrant: filters.quadrant === q.value ? '' : q.value })
                  }
                  sx={{
                    fontWeight: 500,
                    ...(filters.quadrant === q.value
                      ? { bgcolor: q.color, color: '#fff' }
                      : {
                          bgcolor: alpha(q.color, 0.1),
                          color: q.color,
                          '&:hover': { bgcolor: alpha(q.color, 0.2) },
                        }),
                  }}
                />
              ))}
            </FilterSection>

            {/* Category */}
            {categories.length > 0 && (
              <FilterSection label="Category">
                {categories.map((cat) => (
                  <Chip
                    key={cat.id}
                    label={`${cat.name} (${cat.todo_count})`}
                    size="small"
                    onClick={() =>
                      setFilters({
                        category_id: filters.category_id === cat.id ? '' : cat.id,
                      })
                    }
                    sx={{
                      fontWeight: 500,
                      ...(filters.category_id === cat.id
                        ? { bgcolor: cat.color, color: '#fff' }
                        : {
                            bgcolor: alpha(cat.color, 0.1),
                            color: cat.color,
                            '&:hover': { bgcolor: alpha(cat.color, 0.2) },
                          }),
                    }}
                  />
                ))}
              </FilterSection>
            )}

            {/* Clear all */}
            {hasActiveFilters && (
              <Box sx={{ mt: 1 }}>
                <Chip
                  label="Clear all filters"
                  size="small"
                  onDelete={() => {
                    resetFilters();
                    setSearchInput('');
                  }}
                  onClick={() => {
                    resetFilters();
                    setSearchInput('');
                  }}
                  color="default"
                  variant="outlined"
                />
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>

      {/* ─── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* ─── Todo List ───────────────────────────────────────────────────── */}
      <TodoList
        todos={todos}
        loading={loading}
        meta={meta}
        page={page}
        highlightId={highlightId}
        onPageChange={setPage}
        onToggleComplete={toggleComplete}
        onUpdateStatus={updateTodo}
        onDelete={deleteTodo}
      />

      {/* ─── Add Todo Dialog ─────────────────────────────────────────────── */}
      <AddTodoDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={createTodo}
        categories={categories}
        tags={tags}
      />
    </Box>
  );
}

// ─── Small sub-components ─────────────────────────────────────────────────────

function StatChip({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <Chip
      icon={<>{icon}</>}
      label={label}
      size="small"
      sx={{
        bgcolor: alpha(color, 0.1),
        color,
        fontWeight: 600,
        fontSize: '0.8rem',
        '& .MuiChip-icon': { color },
      }}
    />
  );
}

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
        {children}
      </Stack>
    </Box>
  );
}

// Re-export for convenience — allows AppLayout to open the dialog via ref or context.
// For now, TodoView manages its own dialog state internally and the FAB in AppLayout
// dispatches a custom event.
export function useTodoDialogEvent(onOpen: () => void) {
  React.useEffect(() => {
    const handler = () => onOpen();
    window.addEventListener('open-add-todo-dialog', handler);
    return () => window.removeEventListener('open-add-todo-dialog', handler);
  }, [onOpen]);
}
