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
  alpha,
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
  ChevronRight,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { DashboardStats } from '@productivity-app/shared';
import { EISENHOWER_QUADRANTS } from '@productivity-app/shared';
import { analyticsApi, todosApi } from '../../services/api';
import type { TodoWithRelations } from '@productivity-app/shared';
import { useAuth } from '../../contexts/AuthContext';
import { quadrantColors } from '../../theme/theme';
import { PageHeader } from '../Layout/PageHeader';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  loading?: boolean;
}

function StatCard({ title, value, subtitle, icon, color, onClick, loading }: StatCardProps) {
  const content = (
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="overline"
            sx={{ color: 'text.secondary', letterSpacing: '0.06em', mb: 0.5, display: 'block' }}
          >
            {title}
          </Typography>
          {loading ? (
            <Skeleton width={60} height={40} />
          ) : (
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ color, fontFamily: '"Source Serif 4", serif', letterSpacing: '-0.02em' }}
            >
              {value}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ color, opacity: 0.7, display: 'flex', alignItems: 'center' }}>{icon}</Box>
      </Stack>
    </CardContent>
  );

  if (onClick) {
    return (
      <Card sx={{ '&:hover .stat-chevron': { opacity: 1, transform: 'translateX(2px)' } }}>
        <CardActionArea onClick={onClick} sx={{ position: 'relative' }}>
          {content}
          <ChevronRight
            className="stat-chevron"
            sx={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              fontSize: 18,
              color: 'text.secondary',
              opacity: 0,
              transition: 'opacity 0.15s, transform 0.15s',
            }}
          />
        </CardActionArea>
      </Card>
    );
  }

  return <Card>{content}</Card>;
}

function SimpleAnalytics({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) {
  if (loading || !stats) {
    return (
      <Card>
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
    stats.todos.total > 0 ? Math.round((stats.todos.completed / stats.todos.total) * 100) : 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
          <TrendingUp sx={{ color: 'primary.main', fontSize: 18 }} />
          <Typography variant="subtitle1" fontWeight={600}>
            Quick insights
          </Typography>
        </Stack>

        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
            <Typography variant="body2" color="text.secondary">
              Completion rate
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {completionRate}%
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={completionRate} sx={{ height: 6 }} />
        </Box>

        {matrixTotal > 0 ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Active tasks by quadrant
            </Typography>
            <Box sx={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={68}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} task${value !== 1 ? 's' : ''}`]} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Stack direction="row" flexWrap="wrap" spacing={0.75} useFlexGap sx={{ mt: 1.5 }}>
              {pieData.map((d) => (
                <Chip
                  key={d.name}
                  label={`${d.name} (${d.value})`}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: alpha(d.color, 0.35),
                    color: d.color,
                    fontWeight: 500,
                    fontSize: '0.7rem',
                  }}
                />
              ))}
            </Stack>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
            No active tasks in the matrix yet.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function TodaysFocus({ stats, loading }: { stats: DashboardStats | null; loading: boolean }) {
  if (loading || !stats) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width={140} height={28} />
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" width={110} height={28} />
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
      color: '#dc2626',
      icon: <WarningIcon sx={{ fontSize: 14 }} />,
    });
  }
  if (stats.matrix.q1 > 0) {
    chips.push({
      label: `${stats.matrix.q1} urgent & important`,
      color: quadrantColors.Q1,
      icon: <ScheduleIcon sx={{ fontSize: 14 }} />,
    });
  }
  if (stats.todos.in_progress > 0) {
    chips.push({
      label: `${stats.todos.in_progress} in progress`,
      color: '#2563eb',
      icon: <InProgressIcon sx={{ fontSize: 14 }} />,
    });
  }
  if (stats.diary.streak > 0) {
    chips.push({
      label: `${stats.diary.streak}-day journal streak`,
      color: '#ea580c',
      icon: <StreakIcon sx={{ fontSize: 14 }} />,
    });
  }
  if (stats.todos.completed > 0) {
    chips.push({
      label: `${stats.todos.completed} completed`,
      color: '#16a34a',
      icon: <CompletedIcon sx={{ fontSize: 14 }} />,
    });
  }

  if (chips.length === 0) {
    chips.push({
      label: 'No tasks yet — create your first todo',
      color: '#94a3b8',
      icon: <TodoIcon sx={{ fontSize: 14 }} />,
    });
  }

  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
          Today&apos;s focus
        </Typography>
        <Stack direction="row" flexWrap="wrap" spacing={0.75} useFlexGap>
          {chips.map((c) => (
            <Chip
              key={c.label}
              icon={<>{c.icon}</>}
              label={c.label}
              size="small"
              variant="outlined"
              sx={{
                borderColor: alpha(c.color, 0.35),
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

function RecentActivity({ loading }: { loading: boolean }) {
  const [recentTodos, setRecentTodos] = useState<TodoWithRelations[]>([]);
  const [todosLoading, setTodosLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function fetchRecent() {
      try {
        const res = await todosApi.list({ limit: '5', page: '1' });
        if (!cancelled && res.success && res.data) {
          setRecentTodos(res.data);
        }
      } catch {
        // silent
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
    pending: '#ea580c',
    in_progress: '#2563eb',
    completed: '#16a34a',
    cancelled: '#94a3b8',
    deferred: '#78716c',
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Recent activity
        </Typography>

        {isLoading ? (
          <Stack spacing={1.5}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rounded" height={44} />
            ))}
          </Stack>
        ) : recentTodos.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            No todos yet. Create your first task to get started.
          </Typography>
        ) : (
          <Stack spacing={0} className="feed-divider">
            {recentTodos.map((todo) => (
              <Box
                key={todo.id}
                sx={{
                  py: 1.5,
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                  '&:hover .todo-title': { color: 'primary.main' },
                }}
                onClick={() => navigate(`/todos/${todo.id}`)}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                  <Typography
                    className="todo-title"
                    variant="body2"
                    fontWeight={500}
                    noWrap
                    sx={{
                      flex: 1,
                      transition: 'color 0.15s',
                      textDecoration: todo.status === 'completed' ? 'line-through' : 'none',
                      color: todo.status === 'completed' ? 'text.secondary' : 'text.primary',
                    }}
                  >
                    {todo.title}
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                    {todo.eisenhower_quadrant && (
                      <Chip
                        label={todo.eisenhower_quadrant}
                        size="small"
                        variant="outlined"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          borderColor: alpha(
                            quadrantColors[
                              todo.eisenhower_quadrant as keyof typeof quadrantColors
                            ] || '#94a3b8',
                            0.35
                          ),
                          color:
                            quadrantColors[
                              todo.eisenhower_quadrant as keyof typeof quadrantColors
                            ] || '#94a3b8',
                        }}
                      />
                    )}
                    <Chip
                      label={todo.status.replace('_', ' ')}
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 500,
                        borderColor: alpha(statusColor[todo.status] || '#94a3b8', 0.35),
                        color: statusColor[todo.status] || '#94a3b8',
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
              label="View all todos"
              clickable
              onClick={() => navigate('/todos')}
              variant="outlined"
              size="small"
              sx={{ fontWeight: 500 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function QuickNav() {
  const navigate = useNavigate();

  const items = [
    { label: 'Todos', path: '/todos', icon: <TodoIcon fontSize="small" /> },
    { label: 'Matrix', path: '/matrix', icon: <MatrixIcon fontSize="small" /> },
    { label: 'Diary', path: '/diary', icon: <DiaryIcon fontSize="small" /> },
    { label: 'Blog', path: '/blog', icon: <BlogIcon fontSize="small" /> },
  ];

  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
          Quick navigation
        </Typography>
        <Stack spacing={0} className="feed-divider">
          {items.map((item) => (
            <Box
              key={item.label}
              onClick={() => navigate(item.path)}
              sx={{
                py: 1.25,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                color: 'text.secondary',
                transition: 'color 0.15s',
                '&:hover': { color: 'primary.main' },
              }}
            >
              {item.icon}
              <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
                {item.label}
              </Typography>
              <ChevronRight sx={{ fontSize: 16, opacity: 0.5 }} />
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

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
      <PageHeader
        label="Overview"
        title={`${greeting}${user ? `, ${user.username}` : ''}`}
        description="Here's an overview of your productivity."
      />

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total todos"
            value={stats?.todos.total ?? 0}
            subtitle={
              stats
                ? `${stats.todos.pending} pending, ${stats.todos.in_progress} active`
                : undefined
            }
            icon={<TodoIcon />}
            color="#1d4ed8"
            onClick={() => navigate('/todos')}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Matrix items"
            value={
              stats ? stats.matrix.q1 + stats.matrix.q2 + stats.matrix.q3 + stats.matrix.q4 : 0
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
            title="Journal entries"
            value={stats?.diary.total_entries ?? 0}
            subtitle={
              stats && stats.diary.streak > 0
                ? `${stats.diary.streak}-day streak`
                : 'Start your streak'
            }
            icon={<DiaryIcon />}
            color="#7c3aed"
            onClick={() => navigate('/diary')}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Blog posts"
            value={stats?.blog.total_posts ?? 0}
            subtitle={
              stats ? `${stats.blog.published} published, ${stats.blog.draft} drafts` : undefined
            }
            icon={<BlogIcon />}
            color="#16a34a"
            onClick={() => navigate('/blog')}
            loading={loading}
          />
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <TodaysFocus stats={stats} loading={loading} />
      </Box>

      <Grid container spacing={2}>
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
