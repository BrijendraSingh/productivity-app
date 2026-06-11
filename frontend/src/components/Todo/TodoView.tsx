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
  Button,
  alpha,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  CheckCircle as CompletedIcon,
  HourglassEmpty as PendingIcon,
  PlayArrow as InProgressIcon,
  Assignment as TotalIcon,
} from '@mui/icons-material';
import type { TodoStatus, Priority, EisenhowerQuadrant } from '@productivity-app/shared';
import {
  EISENHOWER_QUADRANTS,
  PRIORITY_LEVELS,
  TODO_STATUS_CONFIG,
} from '@productivity-app/shared';
import { quadrantColors, statusColors, priorityColors, designTokens } from '../../theme/theme';
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

type StatusTab = '' | TodoStatus;

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Done' },
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
    [setFilters, searchTimeout]
  );

  const hasActiveFilters =
    filters.status !== '' ||
    filters.priority !== '' ||
    filters.quadrant !== '' ||
    filters.category_id !== '' ||
    filters.search !== '';

  const activeFilterCount = [
    filters.status,
    filters.priority,
    filters.quadrant,
    filters.category_id,
  ].filter(Boolean).length;

  const handleOpenDialog = useCallback(() => setDialogOpen(true), []);
  const handleCloseDialog = useCallback(() => setDialogOpen(false), []);

  const handleStatusTab = (_: React.MouseEvent<HTMLElement>, value: StatusTab | null) => {
    if (value !== null) setFilters({ status: value });
  };

  return (
    <Box>
      {/* ─── KPI strip (Celigo-style metric cards) ───────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <MetricCard
          icon={<TotalIcon sx={{ fontSize: 18 }} />}
          label="Total"
          value={stats.total}
          color={designTokens.colors.primary}
          active={filters.status === ''}
          onClick={() => setFilters({ status: '' })}
        />
        <MetricCard
          icon={<PendingIcon sx={{ fontSize: 18 }} />}
          label="Pending"
          value={stats.pending}
          color={statusColors.pending}
          active={filters.status === 'pending'}
          onClick={() => setFilters({ status: filters.status === 'pending' ? '' : 'pending' })}
        />
        <MetricCard
          icon={<InProgressIcon sx={{ fontSize: 18 }} />}
          label="In progress"
          value={stats.in_progress}
          color={statusColors.in_progress}
          active={filters.status === 'in_progress'}
          onClick={() =>
            setFilters({ status: filters.status === 'in_progress' ? '' : 'in_progress' })
          }
        />
        <MetricCard
          icon={<CompletedIcon sx={{ fontSize: 18 }} />}
          label="Done"
          value={stats.completed}
          color={statusColors.completed}
          active={filters.status === 'completed'}
          onClick={() => setFilters({ status: filters.status === 'completed' ? '' : 'completed' })}
        />
      </Box>

      {/* ─── Main panel (Apple grouped container) ────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: `${designTokens.radius.md}px`,
          overflow: 'hidden',
        }}
      >
        {/* Toolbar */}
        <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <TextField
              placeholder="Search todos…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              size="small"
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
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
                        aria-label="Clear search"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                  sx: {
                    bgcolor: designTokens.colors.canvas,
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: designTokens.colors.border },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                  },
                },
              }}
            />

            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
              <Tooltip title="Filters">
                <IconButton
                  onClick={() => setShowFilters(!showFilters)}
                  size="small"
                  sx={{
                    bgcolor: showFilters || activeFilterCount > 0 ? 'primary.main' : 'transparent',
                    color: showFilters || activeFilterCount > 0 ? '#fff' : 'text.secondary',
                    '&:hover': {
                      bgcolor:
                        showFilters || activeFilterCount > 0
                          ? 'primary.dark'
                          : alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <FilterIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {activeFilterCount > 0 && (
                <Typography variant="caption" color="primary" fontWeight={600}>
                  {activeFilterCount} active
                </Typography>
              )}
              <Tooltip title="Refresh">
                <IconButton onClick={refresh} size="small">
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                sx={{ ml: 0.5, whiteSpace: 'nowrap' }}
              >
                Add todo
              </Button>
            </Stack>
          </Stack>

          {/* Status tabs (Google-style segmented nav) */}
          <Box sx={{ mt: 1.5, overflowX: 'auto' }}>
            <ToggleButtonGroup
              value={filters.status}
              exclusive
              onChange={handleStatusTab}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: `${designTokens.radius.pill}px !important`,
                  px: 2,
                  py: 0.5,
                  mx: 0.25,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'text.secondary',
                  textTransform: 'none',
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    fontWeight: 600,
                  },
                },
              }}
            >
              {STATUS_TABS.map((tab) => (
                <ToggleButton key={tab.value || 'all'} value={tab.value}>
                  {tab.label}
                  {tab.value === '' && stats.total > 0 && (
                    <Box
                      component="span"
                      sx={{
                        ml: 0.75,
                        px: 0.75,
                        py: 0.125,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.text.secondary, 0.1),
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                      }}
                    >
                      {stats.total}
                    </Box>
                  )}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Advanced filters */}
        <Collapse in={showFilters}>
          <Divider />
          <Box
            sx={{ px: { xs: 1.5, sm: 2 }, py: 2, bgcolor: alpha(designTokens.colors.canvas, 0.5) }}
          >
            <FilterSection label="Status">
              {STATUS_FILTERS.map((s) => (
                <FilterChip
                  key={s.value}
                  label={s.label}
                  color={s.color}
                  selected={filters.status === s.value}
                  onClick={() => setFilters({ status: filters.status === s.value ? '' : s.value })}
                />
              ))}
            </FilterSection>

            <FilterSection label="Priority">
              {PRIORITY_FILTERS.map((p) => (
                <FilterChip
                  key={p.value}
                  label={p.label}
                  color={p.color}
                  selected={filters.priority === p.value}
                  onClick={() =>
                    setFilters({ priority: filters.priority === p.value ? '' : p.value })
                  }
                />
              ))}
            </FilterSection>

            <FilterSection label="Quadrant">
              {QUADRANT_FILTERS.map((q) => (
                <FilterChip
                  key={q.value}
                  label={q.label}
                  color={q.color}
                  selected={filters.quadrant === q.value}
                  onClick={() =>
                    setFilters({ quadrant: filters.quadrant === q.value ? '' : q.value })
                  }
                />
              ))}
            </FilterSection>

            {categories.length > 0 && (
              <FilterSection label="Category">
                {categories.map((cat) => (
                  <FilterChip
                    key={cat.id}
                    label={`${cat.name} (${cat.todo_count})`}
                    color={cat.color}
                    selected={filters.category_id === cat.id}
                    onClick={() =>
                      setFilters({
                        category_id: filters.category_id === cat.id ? '' : cat.id,
                      })
                    }
                  />
                ))}
              </FilterSection>
            )}

            {hasActiveFilters && (
              <Button
                size="small"
                onClick={() => {
                  resetFilters();
                  setSearchInput('');
                }}
                sx={{ mt: 0.5, textTransform: 'none' }}
              >
                Clear all filters
              </Button>
            )}
          </Box>
        </Collapse>

        <Divider />

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ m: 2, borderRadius: 1 }} onClose={() => {}}>
            {error}
          </Alert>
        )}

        {/* List */}
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
          onAddTodo={handleOpenDialog}
          embedded
        />
      </Paper>

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  color,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 1.75,
        cursor: onClick ? 'pointer' : 'default',
        border: `1px solid ${active ? alpha(color, 0.4) : designTokens.colors.borderLight}`,
        borderRadius: `${designTokens.radius.md}px`,
        bgcolor: active ? alpha(color, 0.06) : 'background.paper',
        transition: 'all 0.15s ease',
        '&:hover': onClick
          ? {
              borderColor: alpha(color, 0.5),
              bgcolor: alpha(color, 0.08),
              transform: 'translateY(-1px)',
            }
          : undefined,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
        <Box sx={{ color, display: 'flex', opacity: 0.85 }}>{icon}</Box>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          {label}
        </Typography>
      </Stack>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, color: active ? color : 'text.primary', lineHeight: 1 }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

function FilterChip({
  label,
  color,
  selected,
  onClick,
}: {
  label: string;
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Chip
      label={label}
      size="small"
      onClick={onClick}
      sx={{
        fontWeight: 500,
        fontSize: '0.75rem',
        height: 26,
        ...(selected
          ? { bgcolor: color, color: '#fff', '&:hover': { bgcolor: color } }
          : {
              bgcolor: alpha(color, 0.08),
              color,
              border: `1px solid ${alpha(color, 0.2)}`,
              '&:hover': { bgcolor: alpha(color, 0.15) },
            }),
      }}
    />
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 0.75, display: 'block', fontWeight: 600, letterSpacing: '0.02em' }}
      >
        {label}
      </Typography>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
        {children}
      </Stack>
    </Box>
  );
}

export function useTodoDialogEvent(onOpen: () => void) {
  React.useEffect(() => {
    const handler = () => onOpen();
    window.addEventListener('open-add-todo-dialog', handler);
    return () => window.removeEventListener('open-add-todo-dialog', handler);
  }, [onOpen]);
}
