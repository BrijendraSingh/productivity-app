import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  Skeleton,
  Alert,
  Paper,
  Tooltip,
  IconButton,
  Divider,
  Checkbox,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  MoreHoriz as MoreIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import type {
  TodoWithRelations,
  EisenhowerQuadrant,
  TodoStatus,
  UpdateTodoRequest,
} from '@productivity-app/shared';
import { EISENHOWER_QUADRANTS, TODO_STATUS_CONFIG } from '@productivity-app/shared';
import { EisenhowerUtils } from '@productivity-app/shared';
import { todosApi } from '../../services/api';
import { quadrantColors, statusColors, designTokens, surface } from '../../theme/theme';
import { PageHeader } from '../Layout/PageHeader';
import { useFocusRail } from '../../contexts/FocusRailContext';
import { MatrixLegend, MatrixLegendPanel } from './MatrixLegend';
import { Q1ActionQueue } from '../Layout/FocusRail/widgets/Q1ActionQueue';
import { dispatchTodosChanged } from '../../utils/events';

// X-axis = Urgency (low → high), Y-axis = Importance (low → high)
const QUADRANT_GRID: {
  quadrant: EisenhowerQuadrant;
  row: number;
  col: number;
  textAlign: 'left' | 'right';
  verticalAlign: 'top' | 'bottom';
}[] = [
  { quadrant: 'Q2', row: 0, col: 0, textAlign: 'left', verticalAlign: 'top' },
  { quadrant: 'Q1', row: 0, col: 1, textAlign: 'right', verticalAlign: 'top' },
  { quadrant: 'Q4', row: 1, col: 0, textAlign: 'left', verticalAlign: 'bottom' },
  { quadrant: 'Q3', row: 1, col: 1, textAlign: 'right', verticalAlign: 'bottom' },
];

const PEN_COLOR = '#2c4a7c';
const NOTEBOOK_BG = '#faf6ed';
const NOTEBOOK_LINE = '#d9d4c8';
const HAND_FONT = '"Patrick Hand", "Kalam", "Segoe Print", cursive';
const STATUS_OPTIONS: TodoStatus[] = [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
  'deferred',
];

// ─── Component ────────────────────────────────────────────────────────────────

export function EisenhowerMatrixView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isRailVisible = useMediaQuery(theme.breakpoints.up('lg'));
  const navigate = useNavigate();
  const { setPageWidgets } = useFocusRail();

  const [todos, setTodos] = useState<TodoWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; todoId: number } | null>(null);
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

  const handleOpenTodo = useCallback(
    (todoId: number) => {
      navigate(`/todos/${todoId}`);
    },
    [navigate]
  );

  const handleToggleComplete = useCallback(
    async (todo: TodoWithRelations) => {
      const newStatus: TodoStatus = todo.status === 'completed' ? 'pending' : 'completed';
      try {
        const response = await todosApi.update(todo.id, { status: newStatus });
        if (response.success && response.data) {
          setTodos((prev) => prev.map((t) => (t.id === todo.id ? response.data! : t)));
          dispatchTodosChanged();
        }
      } catch {
        fetchAllTodos();
      }
    },
    [fetchAllTodos]
  );

  const handleUpdateStatus = useCallback(
    async (id: number, data: UpdateTodoRequest) => {
      try {
        const response = await todosApi.update(id, data);
        if (response.success && response.data) {
          setTodos((prev) => prev.map((t) => (t.id === id ? response.data! : t)));
        }
      } catch {
        fetchAllTodos();
      }
    },
    [fetchAllTodos]
  );

  const grouped = EisenhowerUtils.groupByQuadrant(todos);
  const counts = EisenhowerUtils.getQuadrantCounts(todos);
  const totalTasks = todos.length;

  useEffect(() => {
    if (!isRailVisible) {
      setPageWidgets(null);
      return;
    }

    setPageWidgets(
      <Box>
        <Divider sx={{ my: 2 }} />
        <MatrixLegend onOpenTodos={() => navigate('/todos')} />
        <Divider sx={{ my: 2 }} />
        <Q1ActionQueue todos={todos} onToggleComplete={handleToggleComplete} />
      </Box>
    );

    return () => setPageWidgets(null);
  }, [todos, isRailVisible, navigate, setPageWidgets, handleToggleComplete]);

  if (loading) {
    return <MatrixSkeleton isMobile={isMobile} />;
  }

  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader
        label="Prioritization"
        title="Eisenhower Matrix"
        description={`Prioritize by urgency and importance — ${totalTasks} task${totalTasks !== 1 ? 's' : ''} total`}
        action={
          <Tooltip title="Refresh">
            <IconButton onClick={fetchAllTodos} size="small">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ minWidth: 0 }}>
        <MatrixCoordinatePlane
          grouped={grouped}
          counts={counts}
          isMobile={isMobile}
          onOpenTodo={handleOpenTodo}
          onToggleComplete={handleToggleComplete}
          onOpenMenu={(el, todoId) => setMenuAnchor({ el, todoId })}
        />
      </Box>

      {!isRailVisible && (
        <Box sx={{ mt: 2.5 }}>
          <MatrixLegendPanel onOpenTodos={() => navigate('/todos')} />
        </Box>
      )}

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
                  await handleUpdateStatus(menuAnchor.todoId, { status });
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
        {menuAnchor && (
          <MenuItem
            onClick={() => {
              handleOpenTodo(menuAnchor.todoId);
              setMenuAnchor(null);
            }}
          >
            <ListItemIcon>
              <OpenIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }}>
              Open in Todos
            </ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}

// ─── Coordinate plane (X = urgency, Y = importance) ───────────────────────────

interface MatrixCoordinatePlaneProps {
  grouped: Record<EisenhowerQuadrant, TodoWithRelations[]>;
  counts: Record<EisenhowerQuadrant, number>;
  isMobile: boolean;
  onOpenTodo: (todoId: number) => void;
  onToggleComplete: (todo: TodoWithRelations) => Promise<void>;
  onOpenMenu: (el: HTMLElement, todoId: number) => void;
}

function MatrixCoordinatePlane({
  grouped,
  counts,
  isMobile,
  onOpenTodo,
  onToggleComplete,
  onOpenMenu,
}: MatrixCoordinatePlaneProps) {
  const labelSx = {
    fontFamily: HAND_FONT,
    fontSize: { xs: '1rem', sm: '1.1rem' },
    fontWeight: 600,
    color: alpha(PEN_COLOR, 0.8),
    lineHeight: 1.25,
    letterSpacing: '0.02em',
    userSelect: 'none' as const,
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: isMobile ? 440 : 500,
        aspectRatio: isMobile ? undefined : { sm: '4/3' },
        bgcolor: NOTEBOOK_BG,
        borderRadius: `${designTokens.radius.sm}px`,
        borderLeft: '3px solid #e8b4b8',
        boxShadow: '2px 3px 12px rgba(44, 74, 124, 0.08), inset 0 0 40px rgba(255,255,255,0.5)',
        backgroundImage: `
          repeating-linear-gradient(
            transparent,
            transparent 27px,
            ${NOTEBOOK_LINE} 27px,
            ${NOTEBOOK_LINE} 28px
          )
        `,
        overflow: 'hidden',
      }}
    >
      <HandDrawnAxes />

      {/* Axis labels */}
      <Typography
        sx={{
          ...labelSx,
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
        }}
      >
        High
      </Typography>
      <Typography
        sx={{
          ...labelSx,
          position: 'absolute',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
        }}
      >
        Low
      </Typography>
      <Typography
        sx={{
          ...labelSx,
          position: 'absolute',
          left: 10,
          top: '50%',
          transform: 'translateY(-50%) rotate(-90deg)',
          transformOrigin: 'center',
          zIndex: 3,
          whiteSpace: 'nowrap',
        }}
      >
        Importance
      </Typography>
      <Typography sx={{ ...labelSx, position: 'absolute', left: 14, bottom: 36, zIndex: 3 }}>
        Low urgency
      </Typography>
      <Typography sx={{ ...labelSx, position: 'absolute', right: 14, bottom: 36, zIndex: 3 }}>
        High urgency
      </Typography>
      <Typography
        sx={{
          ...labelSx,
          position: 'absolute',
          bottom: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
        }}
      >
        Urgency →
      </Typography>

      {/* Quadrant task zones — no boxes, just open notebook regions */}
      <Box
        sx={{
          position: 'absolute',
          inset: { xs: '36px 12px 52px 48px', sm: '40px 16px 56px 56px' },
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          zIndex: 1,
        }}
      >
        {QUADRANT_GRID.map(({ quadrant, textAlign, verticalAlign }) => {
          const info = EISENHOWER_QUADRANTS[quadrant];
          const quadrantTodos = grouped[quadrant] as TodoWithRelations[];
          const count = counts[quadrant];

          return (
            <QuadrantZone
              key={quadrant}
              quadrant={quadrant}
              info={info}
              todos={quadrantTodos}
              count={count}
              textAlign={textAlign}
              verticalAlign={verticalAlign}
              onOpenTodo={onOpenTodo}
              onToggleComplete={onToggleComplete}
              onOpenMenu={onOpenMenu}
            />
          );
        })}
      </Box>
    </Box>
  );
}

// ─── Hand-drawn pen axes (cross at center) ─────────────────────────────────────

function HandDrawnAxes() {
  return (
    <Box
      component="svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
      sx={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      {/* Y-axis — mostly straight with a light sketch shadow */}
      <line
        x1="50"
        y1="96"
        x2="50"
        y2="5"
        stroke={PEN_COLOR}
        strokeWidth="0.65"
        strokeLinecap="round"
        opacity="0.9"
      />
      <line
        x1="50.35"
        y1="96"
        x2="50.35"
        y2="5"
        stroke={PEN_COLOR}
        strokeWidth="0.3"
        strokeLinecap="round"
        opacity="0.25"
      />

      {/* X-axis — mostly straight with a light sketch shadow */}
      <line
        x1="4"
        y1="50"
        x2="96"
        y2="50"
        stroke={PEN_COLOR}
        strokeWidth="0.65"
        strokeLinecap="round"
        opacity="0.9"
      />
      <line
        x1="4"
        y1="50.35"
        x2="96"
        y2="50.35"
        stroke={PEN_COLOR}
        strokeWidth="0.3"
        strokeLinecap="round"
        opacity="0.25"
      />

      {/* Arrowheads */}
      <path
        d="M 50 5 L 47.5 11 M 50 5 L 52.5 11"
        stroke={PEN_COLOR}
        strokeWidth="0.55"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 96 50 L 90 47.5 M 96 50 L 90 52.5"
        stroke={PEN_COLOR}
        strokeWidth="0.55"
        strokeLinecap="round"
        fill="none"
      />
    </Box>
  );
}

// ─── Open quadrant zone (no box borders) ──────────────────────────────────────

interface QuadrantZoneProps {
  quadrant: EisenhowerQuadrant;
  info: { id: string; label: string; description: string; color: string; actionVerb: string };
  todos: TodoWithRelations[];
  count: number;
  textAlign: 'left' | 'right';
  verticalAlign: 'top' | 'bottom';
  onOpenTodo: (todoId: number) => void;
  onToggleComplete: (todo: TodoWithRelations) => Promise<void>;
  onOpenMenu: (el: HTMLElement, todoId: number) => void;
}

function QuadrantZone({
  quadrant,
  info,
  todos,
  count,
  textAlign,
  verticalAlign,
  onOpenTodo,
  onToggleComplete,
  onOpenMenu,
}: QuadrantZoneProps) {
  const color = quadrantColors[quadrant];
  const isEmpty = count === 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: verticalAlign === 'top' ? 'flex-start' : 'flex-end',
        alignItems: textAlign === 'left' ? 'flex-start' : 'flex-end',
        p: { xs: 1, sm: 1.25 },
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ width: '100%', textAlign, flexShrink: 0, mb: 0.5 }}>
        <Typography
          component="span"
          sx={{
            fontFamily: HAND_FONT,
            fontSize: { xs: '1rem', sm: '1.1rem' },
            fontWeight: 700,
            color,
            mr: textAlign === 'left' ? 0.5 : 0,
            ml: textAlign === 'right' ? 0.5 : 0,
          }}
        >
          {quadrant}
        </Typography>
        <Typography
          component="span"
          sx={{
            fontFamily: HAND_FONT,
            fontSize: { xs: '0.9rem', sm: '1rem' },
            fontWeight: 500,
            color: alpha(color, 0.85),
          }}
        >
          {info.label}
        </Typography>
        <Typography
          component="span"
          sx={{
            fontFamily: HAND_FONT,
            fontSize: '0.85rem',
            fontWeight: 600,
            color: alpha(PEN_COLOR, 0.55),
            ml: 0.75,
          }}
        >
          ({count})
        </Typography>
      </Box>

      <Box
        sx={{
          width: '100%',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          textAlign,
          '&::-webkit-scrollbar': { width: 3 },
          '&::-webkit-scrollbar-thumb': { bgcolor: alpha(PEN_COLOR, 0.15), borderRadius: 2 },
        }}
      >
        {isEmpty ? (
          <Typography
            sx={{
              fontFamily: HAND_FONT,
              fontSize: '0.95rem',
              color: alpha(PEN_COLOR, 0.35),
              fontStyle: 'italic',
              py: 0.5,
            }}
          >
            —
          </Typography>
        ) : (
          <Stack
            spacing={0.25}
            sx={{ alignItems: textAlign === 'left' ? 'flex-start' : 'flex-end' }}
          >
            {todos.map((todo) => (
              <NotebookTaskItem
                key={todo.id}
                todo={todo}
                color={color}
                align={textAlign}
                onOpen={() => onOpenTodo(todo.id)}
                onToggleComplete={() => onToggleComplete(todo)}
                onOpenMenu={(el) => onOpenMenu(el, todo.id)}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

// ─── Notebook-style task line ─────────────────────────────────────────────────

interface NotebookTaskItemProps {
  todo: TodoWithRelations;
  color: string;
  align: 'left' | 'right';
  onOpen: () => void;
  onToggleComplete: () => void;
  onOpenMenu: (el: HTMLElement) => void;
}

function NotebookTaskItem({
  todo,
  color,
  align,
  onOpen,
  onToggleComplete,
  onOpenMenu,
}: NotebookTaskItemProps) {
  const isCompleted = todo.status === 'completed';
  const isRightAligned = align === 'right';

  return (
    <Box
      className="matrix-task-item"
      sx={{
        maxWidth: '96%',
        opacity: isCompleted ? 0.5 : 1,
        display: 'flex',
        flexDirection: isRightAligned ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 0.25,
        borderRadius: 1,
        px: 0.25,
        py: 0.15,
        transition: 'background-color 0.15s ease',
        '&:hover': {
          bgcolor: alpha(PEN_COLOR, 0.05),
          '& .matrix-task-actions': { opacity: 1 },
        },
      }}
    >
      <Checkbox
        checked={isCompleted}
        onChange={onToggleComplete}
        size="small"
        sx={{
          p: 0.25,
          mt: 0.1,
          color: alpha(color, 0.55),
          '&.Mui-checked': { color: statusColors.completed },
        }}
        inputProps={{ 'aria-label': `Mark ${todo.title} complete` }}
      />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: isRightAligned ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            gap: 0.25,
          }}
        >
          <Typography
            component="button"
            type="button"
            onClick={onOpen}
            sx={{
              fontFamily: HAND_FONT,
              fontSize: { xs: '1.1rem', sm: '1.2rem' },
              fontWeight: 600,
              color: PEN_COLOR,
              letterSpacing: '0.02em',
              textDecoration: isCompleted ? 'line-through' : 'none',
              textAlign: align,
              lineHeight: 1.35,
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              p: 0,
              m: 0,
              width: '100%',
              textAlignLast: align,
              '&:hover': {
                textDecoration: isCompleted ? 'line-through' : 'underline',
                textDecorationColor: alpha(color, 0.6),
              },
            }}
          >
            {todo.bullet_symbol} {todo.title}
          </Typography>

          <Tooltip title="More actions">
            <IconButton
              className="matrix-task-actions"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMenu(e.currentTarget);
              }}
              sx={{
                opacity: { xs: 1, sm: 0 },
                transition: 'opacity 0.15s ease',
                p: 0.25,
                color: alpha(PEN_COLOR, 0.55),
                '&:hover': { color: PEN_COLOR },
              }}
              aria-label={`Actions for ${todo.title}`}
            >
              <MoreIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography
          sx={{
            fontFamily: HAND_FONT,
            fontSize: '0.85rem',
            fontWeight: 500,
            color: alpha(color, 0.75),
            textAlign: align,
            letterSpacing: '0.02em',
          }}
        >
          U{todo.urgency_level} · I{todo.importance_level}
        </Typography>
      </Box>
    </Box>
  );
}

function MatrixSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width={260} height={40} />
        <Skeleton variant="text" width={180} height={20} />
      </Box>
      <Skeleton
        variant="rounded"
        sx={{ height: isMobile ? 440 : 500, borderRadius: `${designTokens.radius.sm}px` }}
      />
    </Box>
  );
}
