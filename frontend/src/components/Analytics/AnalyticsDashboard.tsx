import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Stack,
  useTheme,
  alpha,
  Paper,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Speed as SpeedIcon,
  MenuBook as MenuBookIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  SentimentSatisfied as MoodIcon,
  BoltOutlined as EnergyIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { EISENHOWER_QUADRANTS, TODO_STATUS_CONFIG } from '@productivity-app/shared';
import { quadrantColors, statusColors, priorityColors } from '../../theme/theme';
import { useAnalytics, TIME_RANGE_OPTIONS, type TimeRange } from '../../hooks/useAnalytics';

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}) {
  const theme = useTheme();
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: alpha(color, theme.palette.mode === 'dark' ? 0.2 : 0.1),
              color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Chart Card wrapper ───────────────────────────────────────────────────────

function ChartCard({
  title,
  subtitle,
  children,
  minHeight = 300,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  minHeight?: number;
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {subtitle}
          </Typography>
        )}
        <Box sx={{ width: '100%', minHeight }}>
          {children}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Productivity Score Gauge ─────────────────────────────────────────────────

function ProductivityGauge({ score }: { score: number }) {
  const theme = useTheme();
  const clamped = Math.min(100, Math.max(0, score));
  const getColor = (s: number) => {
    if (s >= 75) return '#4caf50';
    if (s >= 50) return '#ff9800';
    if (s >= 25) return '#ff5722';
    return '#f44336';
  };
  const color = getColor(clamped);

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={140}
        thickness={4}
        sx={{ color: alpha(color, theme.palette.mode === 'dark' ? 0.15 : 0.1), position: 'absolute' }}
      />
      <CircularProgress
        variant="determinate"
        value={clamped}
        size={140}
        thickness={4}
        sx={{ color }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h3" fontWeight={700} sx={{ color }}>
          {Math.round(clamped)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          / 100
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ p: 1.5, boxShadow: 3 }}>
      {label && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
      )}
      {payload.map((entry) => (
        <Typography key={entry.name} variant="body2" sx={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </Typography>
      ))}
    </Paper>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AnalyticsDashboard() {
  const theme = useTheme();
  const {
    matrix,
    trends,
    writing,
    diary,
    loading,
    error,
    timeRange,
    setTimeRange,
    refresh,
  } = useAnalytics();

  if (loading && !matrix && !trends) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  // ─── Derived data ─────────────────────────────────────────────────────────

  const quadrantPieData = matrix?.distribution.map((d) => ({
    name: `${d.quadrant} — ${d.label}`,
    value: d.total,
    color: d.color,
  })) ?? [];

  const completionTrendData = trends?.completion_trends.map((d) => ({
    date: d.date.slice(5),
    Created: d.created,
    Completed: d.completed,
    Net: d.net,
  })) ?? [];

  const priorityBarData = trends?.priority_distribution.map((d) => ({
    name: d.label,
    Total: d.total,
    Completed: d.completed,
    Pending: d.pending,
    fill: d.color,
  })) ?? [];

  const statusPieData = trends?.status_breakdown.map((d) => ({
    name: TODO_STATUS_CONFIG[d.status]?.label ?? d.status,
    value: d.count,
    color: statusColors[d.status] ?? '#9e9e9e',
  })) ?? [];

  const moodBarData = diary?.mood_distribution.map((d) => ({
    name: `${d.emoji} ${d.label}`,
    Count: d.count,
    fill: d.color,
  })) ?? [];

  const energyLineData = diary?.energy_trends.map((d) => ({
    date: d.date.slice(5),
    Energy: d.energy_level,
  })) ?? [];

  const wordsLineData = writing?.words_over_time.map((d) => ({
    date: d.date.slice(5),
    Words: d.words_written,
    Sessions: d.sessions,
  })) ?? [];

  const dailyCompletionData: Array<Record<string, string | number>> = [];
  if (matrix?.daily_completions.length) {
    const byDate = new Map<string, Record<string, number>>();
    for (const row of matrix.daily_completions) {
      const key = row.date.slice(5);
      if (!byDate.has(key)) byDate.set(key, {});
      const entry = byDate.get(key)!;
      entry[row.quadrant] = (entry[row.quadrant] ?? 0) + row.tasks_completed;
    }
    for (const [date, qs] of byDate) {
      dailyCompletionData.push({ date, ...qs });
    }
  }

  const completionRate = matrix?.completion_rate ?? 0;
  const productivityScore = matrix?.productivity_score ?? 0;

  return (
    <Box sx={{ pb: 4 }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Insights across your productivity, writing, and wellness
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <ToggleButtonGroup
            size="small"
            exclusive
            value={timeRange}
            onChange={(_, v: TimeRange | null) => { if (v) setTimeRange(v); }}
          >
            {TIME_RANGE_OPTIONS.map((opt) => (
              <ToggleButton key={opt.value} value={opt.value}>
                {opt.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Tooltip title="Refresh data">
            <IconButton onClick={refresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* ── Productivity Score + Overview Stats ─────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                Productivity Score
              </Typography>
              <ProductivityGauge score={productivityScore} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Based on task completion across quadrants
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard
                title="Completion Rate"
                value={`${Math.round(completionRate)}%`}
                subtitle={`${matrix?.total_completed ?? 0} of ${matrix?.total_tasks ?? 0}`}
                icon={<CheckCircleIcon />}
                color="#4caf50"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard
                title="Overdue"
                value={trends?.overdue_count ?? 0}
                subtitle="Need attention"
                icon={<WarningIcon />}
                color="#f44336"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard
                title="On Track"
                value={trends?.on_track_count ?? 0}
                subtitle="Within deadline"
                icon={<TrendingUpIcon />}
                color="#1976d2"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <StatCard
                title="Avg. Completion"
                value={
                  trends?.avg_completion_time_hours != null
                    ? `${trends.avg_completion_time_hours.toFixed(1)}h`
                    : '—'
                }
                subtitle="Hours per task"
                icon={<ScheduleIcon />}
                color="#9c27b0"
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* ── Matrix Charts ──────────────────────────────────────────────────── */}
      <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
        Eisenhower Matrix
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Quadrant Distribution Pie */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Quadrant Distribution" subtitle="Tasks across the four quadrants">
            {quadrantPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={quadrantPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {quadrantPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No matrix data yet" />
            )}
          </ChartCard>
        </Grid>

        {/* Quadrant Breakdown Cards */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Quadrant Breakdown" subtitle="Completion per quadrant" minHeight={280}>
            <Grid container spacing={1.5}>
              {(matrix?.distribution ?? []).map((q) => (
                <Grid size={{ xs: 6 }} key={q.quadrant}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderLeft: `4px solid ${q.color}`,
                      height: '100%',
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600} sx={{ color: q.color }}>
                      {q.quadrant} — {q.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {q.completed}/{q.total}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Avg U: {q.avg_urgency.toFixed(1)} · I: {q.avg_importance.toFixed(1)}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </ChartCard>
        </Grid>

        {/* Daily Completions by Quadrant */}
        <Grid size={{ xs: 12 }}>
          <ChartCard title="Daily Completions by Quadrant" subtitle="Stacked bar chart of completed tasks per day">
            {dailyCompletionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Q1" stackId="a" fill={quadrantColors.Q1} name="Q1 — Do First" />
                  <Bar dataKey="Q2" stackId="a" fill={quadrantColors.Q2} name="Q2 — Schedule" />
                  <Bar dataKey="Q3" stackId="a" fill={quadrantColors.Q3} name="Q3 — Delegate" />
                  <Bar dataKey="Q4" stackId="a" fill={quadrantColors.Q4} name="Q4 — Eliminate" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No daily completion data yet" />
            )}
          </ChartCard>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* ── Trends ─────────────────────────────────────────────────────────── */}
      <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
        Task Trends
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Completion Trends Line */}
        <Grid size={{ xs: 12, md: 8 }}>
          <ChartCard title="Completion Trends" subtitle="Tasks created vs completed over time">
            {completionTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={completionTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="Created" stroke="#ff9800" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Completed" stroke="#4caf50" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Net" stroke="#2196f3" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No trend data yet" />
            )}
          </ChartCard>
        </Grid>

        {/* Status Breakdown Pie */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard title="Status Breakdown" subtitle="Current task statuses">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No status data yet" />
            )}
          </ChartCard>
        </Grid>

        {/* Priority Distribution Bar */}
        <Grid size={{ xs: 12 }}>
          <ChartCard title="Priority Distribution" subtitle="Tasks by priority level with completion status">
            {priorityBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={priorityBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Completed" stackId="a" fill="#4caf50" />
                  <Bar dataKey="Pending" stackId="a" fill="#ff9800" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No priority data yet" />
            )}
          </ChartCard>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* ── Writing Analytics ──────────────────────────────────────────────── */}
      <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
        Writing & Blog
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Total Posts"
            value={writing?.total_posts ?? 0}
            subtitle={`${writing?.published_posts ?? 0} published`}
            icon={<MenuBookIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Total Words"
            value={(writing?.total_words ?? 0).toLocaleString()}
            subtitle={`~${writing?.avg_words_per_post ?? 0} per post`}
            icon={<EditIcon />}
            color="#9c27b0"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Reading Time"
            value={`${writing?.total_reading_time ?? 0} min`}
            subtitle="Total across posts"
            icon={<ScheduleIcon />}
            color="#ff9800"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Total Views"
            value={(writing?.total_views ?? 0).toLocaleString()}
            subtitle={`${writing?.sessions.total_sessions ?? 0} sessions`}
            icon={<VisibilityIcon />}
            color="#4caf50"
          />
        </Grid>

        {/* Words Over Time */}
        <Grid size={{ xs: 12, md: 8 }}>
          <ChartCard title="Words Written Over Time" subtitle="Daily word count and writing sessions">
            {wordsLineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={wordsLineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="words" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="sessions" orientation="right" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="words" dataKey="Words" fill="#9c27b0" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="sessions" dataKey="Sessions" fill={alpha('#1976d2', 0.6)} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No writing data yet" />
            )}
          </ChartCard>
        </Grid>

        {/* Posts by Status */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard title="Posts by Status" subtitle="Draft, published, archived">
            {writing?.posts_by_status && writing.posts_by_status.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={writing.posts_by_status.map((d) => ({
                      name: d.status.charAt(0).toUpperCase() + d.status.slice(1),
                      value: d.count,
                      color:
                        d.status === 'published' ? '#4caf50'
                          : d.status === 'draft' ? '#ff9800'
                            : '#9e9e9e',
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {writing.posts_by_status.map((d, i) => (
                      <Cell
                        key={i}
                        fill={
                          d.status === 'published' ? '#4caf50'
                            : d.status === 'draft' ? '#ff9800'
                              : '#9e9e9e'
                        }
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No blog posts yet" />
            )}
          </ChartCard>
        </Grid>

        {/* Writing Sessions Summary */}
        {writing?.sessions && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Writing Sessions
                </Typography>
                <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                  <Chip
                    icon={<SpeedIcon />}
                    label={`${writing.sessions.total_sessions} sessions`}
                    variant="outlined"
                  />
                  <Chip
                    icon={<ScheduleIcon />}
                    label={`${writing.sessions.total_time_minutes} min total`}
                    variant="outlined"
                  />
                  <Chip
                    icon={<EditIcon />}
                    label={`${writing.sessions.total_words_written.toLocaleString()} words written`}
                    variant="outlined"
                  />
                  {writing.sessions.avg_productivity_score != null && (
                    <Chip
                      icon={<TrendingUpIcon />}
                      label={`Avg score: ${writing.sessions.avg_productivity_score.toFixed(1)}`}
                      variant="outlined"
                      color="primary"
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* ── Diary / Wellness ───────────────────────────────────────────────── */}
      <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
        Wellness & Diary
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Journal Entries"
            value={diary?.total_entries ?? 0}
            subtitle={`${diary?.streak ?? 0}-day streak`}
            icon={<MenuBookIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Avg Energy"
            value={diary?.avg_energy != null ? diary.avg_energy.toFixed(1) : '—'}
            subtitle="Out of 10"
            icon={<EnergyIcon />}
            color="#ff9800"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="Common Mood"
            value={diary?.most_common_mood ? diary.most_common_mood.charAt(0).toUpperCase() + diary.most_common_mood.slice(1) : '—'}
            icon={<MoodIcon />}
            color="#9c27b0"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            title="With Gratitude"
            value={diary?.entries_with_gratitude ?? 0}
            subtitle="Entries with gratitude"
            icon={<CheckCircleIcon />}
            color="#4caf50"
          />
        </Grid>

        {/* Mood Distribution Bar */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Mood Distribution" subtitle="Frequency of each mood">
            {moodBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={moodBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="Count" radius={[4, 4, 0, 0]}>
                    {moodBarData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No mood data yet" />
            )}
          </ChartCard>
        </Grid>

        {/* Energy Trends Line */}
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title="Energy Trends" subtitle="Daily energy levels over time">
            {energyLineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={energyLineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="Energy"
                    stroke="#ff9800"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No energy data yet" />
            )}
          </ChartCard>
        </Grid>

        {/* Weather Distribution */}
        {diary?.weather_distribution && diary.weather_distribution.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <ChartCard title="Weather Distribution" subtitle="Weather conditions logged">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={diary.weather_distribution.map((d) => ({
                      name: d.weather.charAt(0).toUpperCase() + d.weather.slice(1),
                      value: d.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {diary.weather_distribution.map((_, i) => {
                      const weatherColors = ['#ff9800', '#9e9e9e', '#2196f3', '#e0e0e0', '#7b1fa2'];
                      return <Cell key={i} fill={weatherColors[i % weatherColors.length]} />;
                    })}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        color: 'text.secondary',
      }}
    >
      <Typography variant="body2">{message}</Typography>
    </Box>
  );
}
