import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Stack,
  Skeleton,
  Alert,
  LinearProgress,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  CheckCircle as TodoIcon,
  GridView as MatrixIcon,
  Book as DiaryIcon,
  Article as BlogIcon,
  TrendingUp,
  Warning as WarningIcon,
  LocalFireDepartment as StreakIcon,
  Schedule as ScheduleIcon,
  PlayArrow as InProgressIcon,
  TaskAlt as CompletedIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { DashboardStats } from '@productivity-app/shared';
import { EISENHOWER_QUADRANTS } from '@productivity-app/shared';
import { analyticsApi, todosApi } from '../../services/api';
import type { TodoWithRelations } from '@productivity-app/shared';
import { useAuth } from '../../contexts/AuthContext';
import { quadrantColors } from '../../theme/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  loading?: boolean;
}

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  onClick,
  loading,
}: StatCardProps) {
  const theme = useTheme();

  const content = (
    <CardContent sx={{ p: 2.5 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight={500}
            gutterBottom
          >
            {title}
          </Typography>
          {loading ? (
            <Skeleton width={60} height={40} />
          ) : (
            <Typography variant="h4" fontWeight={700} sx={{ color }}>
              {value}
            </Typography>
          )}
          {subtitle && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: 'block' }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: alpha(color, theme.palette.mode === 'dark' ? 0.15 : 0.08),
            color,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {icon}
        </Box>
      </Stack>
    </CardContent>
  );

  if (onClick) {
    return (
      <Card>
        <CardActionArea onClick={onClick}>{content}</CardActionArea>
      </Card>
    );
  }

  return <Card>{content}</Card>;
}

// ─── SimpleAnalytics (Quadrant Pie) ──────────────────────────────────────────

function SimpleAnalytics({
  stats,
  loading,
}: {
  stats: DashboardStats | null;
  loading: boolean;
}) {
  const theme = useTheme();

  if (loading || !stats) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width={180} height={28} />
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Skeleton variant="circular" width={180} height={180} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  const { q1, q2, q3, q4 } = stats.matrix;
  const matrixTotal = q1 + q2 + q3 + q4;

  const pieData = [
    { name: `Q1: ${EISENHOWER_QUADRANTS.Q1.label}`, value: q1, color: quadrantColors.Q1 },
    { name: `Q2: ${EISENHOWER_QUADRANTS.Q2.label}`, value: q2, color: quadrantColors.Q2 },
    { name: `Q3: ${EISENHOWER_QUADRANTS.Q3.label}`, value: q3, color: quadrantColors.Q3 },
    { name: `Q4: ${EISENHOWER_QUADRANTS.Q4.label}`, value: q4, color: quadrantColors.Q4 },
  ].filter((d) => d.value > 0);

  const completionRate =
    stats.todos.total > 0
      ? Math.round((stats.todos.completed / stats.todos.total) * 100)
      : 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ mb: 2 }}
        >
          <TrendingUp sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="h6" fontWeight={600}>
            Quick Insights
          </Typography>
        </Stack>

        {/* Completion rate */}
        <Box sx={{ mb: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ mb: 0.5 }}
          >
            <Typography variant="body2" color="text.secondary">
              Completion Rate
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {completionRate}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={completionRate}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.success.main, 0.12),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: 'success.main',
              },
            }}
          />
        </Box>

        {/* Quadrant pie */}
        {matrixTotal > 0 ? (
          <>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Active Tasks by Quadrant
            </Typography>
            <Box sx={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `${value} task${value !== 1 ? 's' : ''}`,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Stack
              direction="row"
              flexWrap="wrap"
              spacing={1}
              useFlexGap
              justifyContent="center"
              sx={{ mt: 1 }}
            >
              {pieData.map((d) => (
                <Chip
                  key={d.name}
                  label={`${d.name} (${d.value})`}
                  size="small"
                  sx={{
                    bgcolor: alpha(d.color, 0.12),
                    color: d.color,
                    fontWeight: 500,
                    fontSize: '0.72rem',
                  }}
                />
              ))}
            </Stack>
          </>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ py: 3 }}
          >
            No active tasks in the matrix yet.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Today's Focus ───────────────────────────────────────────────────────────

function TodaysFocus({
  stats,
  loading,
}: {
  stats: DashboardStats | null;
  loading: boolean;
}) {
  if (loading || !stats) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width={140} height={28} />
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" width={110} height={32} />
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const chips: { label: string; color: string; icon: React.ReactNode }[] = [];

  if (stats.todos.overdue > 0) {
    chips.push({
      label: `${stats.todos.overdue} overdue`,
      color: '#f44336',
      icon: <WarningIcon sx={{ fontSize: 16 }} />,
    });
  }
  if (stats.matrix.q1 > 0) {
    chips.push({
      label: `${stats.matrix.q1} urgent & important`,
      color: quadrantColors.Q1,
      icon: <ScheduleIcon sx={{ fontSize: 16 }} />,
    });
  }
  if (stats.todos.in_progress > 0) {
    chips.push({
      label: `${stats.todos.in_progress} in progress`,
      color: '#2196f3',
      icon: <InProgressIcon sx={{ fontSize: 16 }} />,
    });
  }
  if (stats.diary.streak > 0) {
    chips.push({
      label: `${stats.diary.streak}-day journal streak`,
      color: '#ff9800',
      icon: <StreakIcon sx={{ fontSize: 16 }} />,
    });
  }
  if (stats.todos.completed > 0) {
    chips.push({
      label: `${stats.todos.completed} completed`,
      color: '#4caf50',
      icon: <CompletedIcon sx={{ fontSize: 16 }} />,
    });
  }

  if (chips.length === 0) {
    chips.push({
      label: 'No tasks yet — create your first todo!',
      color: '#9e9e9e',
      icon: <TodoIcon sx={{ fontSize: 16 }} />,
    });
  }

  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
          Today's Focus
        </Typography>
        <Stack direction="row" flexWrap="wrap" spacing={1} useFlexGap>
          {chips.map((c) => (
            <Chip
              key={c.label}
              icon={<>{c.icon}</>}
              label={c.label}
              sx={{
                bgcolor: alpha(c.color, 0.1),
                color: c.color,
                fontWeight: 500,
                '& .MuiChip-icon': { color: c.color },
              }}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

// ─── Recent Activity ─────────────────────────────────────────────────────────

function RecentActivity({ loading }: { loading: boolean }) {
  const [recentTodos, setRecentTodos] = useState<TodoWithRelations[]>([]);
  const [todosLoading, setTodosLoading] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    let cancelled = false;

    async function fetchRecent() {
      try {
        const res = await todosApi.list({ limit: '5', page: '1' });
        if (!cancelled && res.success && res.data) {
          setRecentTodos(res.data);
        }
      } catch {
        // silent — dashboard shouldn't break if todos fail
      } finally {
        if (!cancelled) setTodosLoading(false);
      }
    }

    fetchRecent();
    return () => {
      cancelled = true;
    };
  }, []);

  const isLoading = loading || todosLoading;

  const statusColor: Record<string, string> = {
    pending: '#ff9800',
    in_progress: '#2196f3',
    completed: '#4caf50',
    cancelled: '#9e9e9e',
    deferred: '#795548',
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Recent Activity
        </Typography>

        {isLoading ? (
          <Stack spacing={1.5}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rounded" height={48} />
            ))}
          </Stack>
        ) : recentTodos.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ py: 4 }}
          >
            No todos yet. Create your first task to get started!
          </Typography>
        ) : (
          <Stack spacing={0} divider={<Divider />}>
            {recentTodos.map((todo) => (
              <Box
                key={todo.id}
                sx={{
                  py: 1.5,
                  px: 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: alpha(
                      theme.palette.primary.main,
                      theme.palette.mode === 'dark' ? 0.08 : 0.04,
                    ),
                  },
                }}
                onClick={() => navigate(`/todos/${todo.id}`)}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      noWrap
                      sx={{
                        textDecoration:
                          todo.status === 'completed'
                            ? 'line-through'
                            : 'none',
                        color:
                          todo.status === 'completed'
                            ? 'text.secondary'
                            : 'text.primary',
                      }}
                    >
                      {todo.title}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} sx={{ ml: 1 }}>
                    {todo.eisenhower_quadrant && (
                      <Chip
                        label={todo.eisenhower_quadrant}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          bgcolor: alpha(
                            quadrantColors[
                              todo.eisenhower_quadrant as keyof typeof quadrantColors
                            ] || '#757575',
                            0.12,
                          ),
                          color:
                            quadrantColors[
                              todo.eisenhower_quadrant as keyof typeof quadrantColors
                            ] || '#757575',
                        }}
                      />
                    )}
                    <Chip
                      label={todo.status.replace('_', ' ')}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.68rem',
                        fontWeight: 500,
                        bgcolor: alpha(
                          statusColor[todo.status] || '#9e9e9e',
                          0.12,
                        ),
                        color: statusColor[todo.status] || '#9e9e9e',
                      }}
                    />
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}

        {recentTodos.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Chip
              label="View All Todos"
              clickable
              onClick={() => navigate('/todos')}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Quick Navigation ────────────────────────────────────────────────────────

function QuickNav() {
  const navigate = useNavigate();
  const theme = useTheme();

  const items = [
    { label: 'Todos', path: '/todos', icon: <TodoIcon />, color: '#1976d2' },
    { label: 'Matrix', path: '/matrix', icon: <MatrixIcon />, color: quadrantColors.Q1 },
    { label: 'Diary', path: '/diary', icon: <DiaryIcon />, color: '#9c27b0' },
    { label: 'Blog', path: '/blog', icon: <BlogIcon />, color: '#4caf50' },
  ];

  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
          Quick Navigation
        </Typography>
        <Grid container spacing={1.5}>
          {items.map((item) => (
            <Grid size={{ xs: 6 }} key={item.label}>
              <Card
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderColor: alpha(item.color, 0.25),
                  '&:hover': {
                    borderColor: item.color,
                    bgcolor: alpha(
                      item.color,
                      theme.palette.mode === 'dark' ? 0.08 : 0.03,
                    ),
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => navigate(item.path)}
              >
                <CardContent
                  sx={{
                    p: 1.5,
                    '&:last-child': { pb: 1.5 },
                    textAlign: 'center',
                  }}
                >
                  <Box sx={{ color: item.color, mb: 0.5 }}>{item.icon}</Box>
                  <Typography variant="body2" fontWeight={500}>
                    {item.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

// ─── Dashboard (main) ────────────────────────────────────────────────────────

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.dashboard();
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        setError(res.message || 'Failed to load dashboard stats');
      }
    } catch {
      setError('Failed to load dashboard data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <Box>
      {/* Greeting */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          {greeting}
          {user ? `, ${user.username}` : ''}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your productivity.
        </Typography>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ─── Stat Cards Row ─── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Todos"
            value={stats?.todos.total ?? 0}
            subtitle={
              stats
                ? `${stats.todos.pending} pending, ${stats.todos.in_progress} active`
                : undefined
            }
            icon={<TodoIcon />}
            color="#1976d2"
            onClick={() => navigate('/todos')}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Matrix Items"
            value={
              stats
                ? stats.matrix.q1 +
                  stats.matrix.q2 +
                  stats.matrix.q3 +
                  stats.matrix.q4
                : 0
            }
            subtitle={stats ? `Q1: ${stats.matrix.q1} urgent` : undefined}
            icon={<MatrixIcon />}
            color={quadrantColors.Q1}
            onClick={() => navigate('/matrix')}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Journal Entries"
            value={stats?.diary.total_entries ?? 0}
            subtitle={
              stats && stats.diary.streak > 0
                ? `${stats.diary.streak}-day streak`
                : 'Start your streak!'
            }
            icon={<DiaryIcon />}
            color="#9c27b0"
            onClick={() => navigate('/diary')}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Blog Posts"
            value={stats?.blog.total_posts ?? 0}
            subtitle={
              stats
                ? `${stats.blog.published} published, ${stats.blog.draft} drafts`
                : undefined
            }
            icon={<BlogIcon />}
            color="#4caf50"
            onClick={() => navigate('/blog')}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ─── Today's Focus ─── */}
      <Box sx={{ mb: 3 }}>
        <TodaysFocus stats={stats} loading={loading} />
      </Box>

      {/* ─── Analytics + Activity + Nav ─── */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SimpleAnalytics stats={stats} loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <RecentActivity loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <QuickNav />
        </Grid>
      </Grid>
    </Box>
  );
}
