import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Info as InfoIcon,
  ArrowUpward as UrgentIcon,
  Star as ImportantIcon,
} from '@mui/icons-material';
import type { TodoWithRelations, EisenhowerQuadrant } from '@productivity-app/shared';
import { EISENHOWER_QUADRANTS } from '@productivity-app/shared';
import { EisenhowerUtils } from '@productivity-app/shared';
import { todosApi } from '../../services/api';
import { quadrantColors, designTokens, surface } from '../../theme/theme';
import { PageHeader } from '../Layout/PageHeader';

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
const HAND_FONT = '"Caveat", "Segoe Print", "Bradley Hand", cursive';

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

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 272px' },
          gap: { xs: 2.5, lg: 3 },
          alignItems: 'start',
        }}
      >
        {/* Coordinate-plane matrix — left */}
        <Box sx={{ minWidth: 0 }}>
          <MatrixCoordinatePlane grouped={grouped} counts={counts} isMobile={isMobile} />
        </Box>

        {/* Legend — right sidebar (desktop) / below matrix (mobile) */}
        <Box
          sx={{
            minWidth: 0,
            order: { xs: 2, lg: 0 },
            position: { lg: 'sticky' },
            top: { lg: 16 },
            alignSelf: 'start',
          }}
        >
          <MatrixLegend />
        </Box>
      </Box>
    </Box>
  );
}

// ─── Coordinate plane (X = urgency, Y = importance) ───────────────────────────

interface MatrixCoordinatePlaneProps {
  grouped: Record<EisenhowerQuadrant, TodoWithRelations[]>;
  counts: Record<EisenhowerQuadrant, number>;
  isMobile: boolean;
}

function MatrixCoordinatePlane({ grouped, counts, isMobile }: MatrixCoordinatePlaneProps) {
  const labelSx = {
    fontFamily: HAND_FONT,
    fontSize: { xs: '0.95rem', sm: '1.05rem' },
    fontWeight: 600,
    color: alpha(PEN_COLOR, 0.75),
    lineHeight: 1.2,
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
      {/* Y-axis — wobbly vertical through center */}
      <path
        d="M 50 96 C 50.9 78, 49.1 62, 50.6 50 C 49.2 36, 51.1 20, 50 5"
        fill="none"
        stroke={PEN_COLOR}
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M 50.4 96 C 51.2 78, 49.5 62, 50.9 50 C 49.6 36, 51.4 20, 50.4 5"
        fill="none"
        stroke={PEN_COLOR}
        strokeWidth="0.35"
        strokeLinecap="round"
        opacity="0.3"
      />

      {/* X-axis — wobbly horizontal through center */}
      <path
        d="M 4 50 C 20 49.2, 34 50.7, 50 49.4 C 66 50.5, 80 49.1, 96 50.2"
        fill="none"
        stroke={PEN_COLOR}
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M 4 50.4 C 20 49.6, 34 51.1, 50 49.8 C 66 50.9, 80 49.5, 96 50.6"
        fill="none"
        stroke={PEN_COLOR}
        strokeWidth="0.35"
        strokeLinecap="round"
        opacity="0.3"
      />

      {/* Arrowheads — sketched pen strokes */}
      <path
        d="M 50 5 L 47.2 11 M 50 5 L 52.8 10.5"
        stroke={PEN_COLOR}
        strokeWidth="0.55"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 96 50 L 90 47.5 M 96 50 L 90.5 52.8"
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
}

function QuadrantZone({
  quadrant,
  info,
  todos,
  count,
  textAlign,
  verticalAlign,
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
              <NotebookTaskItem key={todo.id} todo={todo} color={color} align={textAlign} />
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
}

function NotebookTaskItem({ todo, color, align }: NotebookTaskItemProps) {
  const isCompleted = todo.status === 'completed';

  return (
    <Box sx={{ maxWidth: '92%', opacity: isCompleted ? 0.45 : 1 }}>
      <Typography
        sx={{
          fontFamily: HAND_FONT,
          fontSize: { xs: '1.05rem', sm: '1.15rem' },
          fontWeight: 500,
          color: PEN_COLOR,
          textDecoration: isCompleted ? 'line-through' : 'none',
          textAlign: align,
          lineHeight: 1.3,
        }}
      >
        {todo.bullet_symbol} {todo.title}
      </Typography>
      <Typography
        sx={{
          fontFamily: HAND_FONT,
          fontSize: '0.8rem',
          color: alpha(color, 0.7),
          textAlign: align,
        }}
      >
        U{todo.urgency_level} · I{todo.importance_level}
      </Typography>
    </Box>
  );
}

// ─── Legend ──────────────────────────────────────────────────────────────────

function MatrixLegend() {
  const allQuadrants = EisenhowerUtils.getAllQuadrants();

  return (
    <Paper
      elevation={0}
      sx={{
        ...surface.panel,
        p: 2.5,
        borderRadius: `${designTokens.radius.md}px`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <InfoIcon fontSize="small" sx={{ color: 'primary.main' }} />
        <Typography variant="subtitle2" fontWeight={600}>
          How the Eisenhower Matrix Works
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.55 }}>
        Tasks are automatically assigned to quadrants based on their urgency and importance levels.
        Urgency and importance are rated 1–10; a threshold of 7 determines the split.
      </Typography>

      <Stack spacing={1.5}>
        {allQuadrants.map((info) => (
          <Box
            key={info.id}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.25,
              p: 1.25,
              borderRadius: `${designTokens.radius.sm}px`,
              bgcolor: alpha(info.color, 0.04),
              border: `1px solid ${alpha(info.color, 0.15)}`,
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: info.color,
                mt: 0.6,
                flexShrink: 0,
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} sx={{ color: info.color }}>
                {info.id}: {info.label}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.25 }}
              >
                {info.description}
              </Typography>
            </Box>
          </Box>
        ))}
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <UrgentIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            Urgency level (1–10)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <ImportantIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            Importance level (1–10)
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ pl: 0.25 }}>
          Threshold: &ge;7 = high
        </Typography>
      </Stack>
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
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 272px' },
          gap: 3,
        }}
      >
        <Skeleton
          variant="rounded"
          sx={{ height: isMobile ? 440 : 500, borderRadius: `${designTokens.radius.sm}px` }}
        />
        <Skeleton variant="rounded" height={420} />
      </Box>
    </Box>
  );
}
