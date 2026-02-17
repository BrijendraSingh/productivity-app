import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  Chip,
  Stack,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  CheckCircle as TodoIcon,
  GridView as MatrixIcon,
  Book as DiaryIcon,
  EventNote as JournalIcon,
  Article as BlogIcon,
  BarChart as AnalyticsIcon,
  Dashboard as DashboardIcon,
  LightMode,
  DarkMode,
  RocketLaunch,
  Speed,
  Security,
  CloudOff,
} from '@mui/icons-material';
import { APP_CONFIG, EISENHOWER_QUADRANTS } from '@productivity-app/shared';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';
import { LoginDialog } from '../Auth/LoginDialog';

interface FeatureCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const FEATURES: FeatureCard[] = [
  {
    title: 'Smart Todos',
    description:
      'Create, prioritize, and track tasks with categories, tags, due dates, and energy-level estimates.',
    icon: <TodoIcon sx={{ fontSize: 40 }} />,
    color: '#1976d2',
  },
  {
    title: 'Eisenhower Matrix',
    description:
      'Auto-sort tasks into the 4 quadrants based on urgency and importance to focus on what truly matters.',
    icon: <MatrixIcon sx={{ fontSize: 40 }} />,
    color: EISENHOWER_QUADRANTS.Q1.color,
  },
  {
    title: 'Digital Diary',
    description:
      'Daily journal entries with mood, weather, and energy tracking. Build streaks and reflect on your days.',
    icon: <DiaryIcon sx={{ fontSize: 40 }} />,
    color: '#9c27b0',
  },
  {
    title: 'Bullet Journal',
    description:
      'Rapid logging with daily, weekly, monthly, and yearly views. Use symbols for tasks, events, and notes.',
    icon: <JournalIcon sx={{ fontSize: 40 }} />,
    color: '#ff9800',
  },
  {
    title: 'Blog Platform',
    description:
      'Write and publish articles with markdown support, reading time estimation, and category organization.',
    icon: <BlogIcon sx={{ fontSize: 40 }} />,
    color: '#4caf50',
  },
  {
    title: 'Analytics Dashboard',
    description:
      'Visualize productivity trends, completion rates, writing metrics, and mood patterns with interactive charts.',
    icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
    color: '#607d8b',
  },
];

const TECH_STACK = [
  'React 18',
  'TypeScript',
  'Material UI 6',
  'Vite',
  'Express',
  'SQLite',
  'Recharts',
  'Framer Motion',
  'date-fns',
];

const HIGHLIGHTS: { icon: React.ReactNode; label: string; detail: string }[] = [
  {
    icon: <Speed sx={{ fontSize: 28 }} />,
    label: 'Fast',
    detail: 'Instant local-first responses',
  },
  {
    icon: <Security sx={{ fontSize: 28 }} />,
    label: 'Secure',
    detail: 'Token-based auth with bcrypt',
  },
  {
    icon: <CloudOff sx={{ fontSize: 28 }} />,
    label: 'Offline-Ready',
    detail: 'SQLite — no cloud dependency',
  },
  {
    icon: <RocketLaunch sx={{ fontSize: 28 }} />,
    label: 'Modern',
    detail: 'Latest React + Vite stack',
  },
];

export function LandingPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginTab, setLoginTab] = useState(0);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/');
    } else {
      setLoginTab(1);
      setLoginOpen(true);
    }
  };

  const handleSignIn = () => {
    if (isAuthenticated) {
      navigate('/');
    } else {
      setLoginTab(0);
      setLoginOpen(true);
    }
  };

  const isDark = mode === 'dark';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* ─── Top Bar ─── */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: alpha(theme.palette.background.default, 0.85),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <DashboardIcon sx={{ color: 'primary.main', fontSize: 28 }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: 'text.primary' }}
              >
                {APP_CONFIG.APP_NAME}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton onClick={toggleTheme} size="small">
                {isDark ? <LightMode /> : <DarkMode />}
              </IconButton>
              {isAuthenticated ? (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate('/')}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button size="small" onClick={handleSignIn}>
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleGetStarted}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* ─── Hero Section ─── */}
      <Box
        sx={{
          pt: { xs: 8, md: 12 },
          pb: { xs: 6, md: 10 },
          textAlign: 'center',
          background: isDark
            ? `linear-gradient(135deg, ${alpha('#1976d2', 0.12)} 0%, ${alpha('#dc004e', 0.08)} 100%)`
            : `linear-gradient(135deg, ${alpha('#1976d2', 0.06)} 0%, ${alpha('#dc004e', 0.04)} 100%)`,
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2.2rem', sm: '3rem', md: '3.6rem' },
              mb: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Your All-in-One Productivity Hub
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{
              mb: 4,
              maxWidth: 600,
              mx: 'auto',
              fontSize: { xs: '1.05rem', md: '1.3rem' },
              lineHeight: 1.6,
            }}
          >
            Manage tasks with the Eisenhower Matrix, journal your thoughts,
            write blog posts, and track your productivity — all in one place.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              sx={{ px: 4, py: 1.5, fontSize: '1.05rem' }}
            >
              Get Started Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={handleSignIn}
              sx={{ px: 4, py: 1.5, fontSize: '1.05rem' }}
            >
              Sign In
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ─── Highlights Strip ─── */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={2}>
          {HIGHLIGHTS.map((h) => (
            <Grid size={{ xs: 6, md: 3 }} key={h.label}>
              <Stack alignItems="center" spacing={0.5} sx={{ py: 1 }}>
                <Box sx={{ color: 'primary.main' }}>{h.icon}</Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {h.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {h.detail}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ─── Features Grid ─── */}
      <Box
        sx={{
          py: { xs: 6, md: 8 },
          bgcolor: isDark
            ? alpha(theme.palette.background.paper, 0.4)
            : alpha(theme.palette.primary.main, 0.02),
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            textAlign="center"
            fontWeight={700}
            sx={{ mb: 1 }}
          >
            Everything You Need
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 5, maxWidth: 520, mx: 'auto' }}
          >
            Six powerful modules working together to boost your productivity.
          </Typography>

          <Grid container spacing={3}>
            {FEATURES.map((f) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={f.title}>
                <Card
                  sx={{
                    height: '100%',
                    borderTop: `3px solid ${f.color}`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 30px ${alpha(f.color, 0.18)}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ color: f.color, mb: 1.5 }}>{f.icon}</Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {f.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {f.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── Eisenhower Matrix Preview ─── */}
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 8 } }}>
        <Typography
          variant="h4"
          textAlign="center"
          fontWeight={700}
          sx={{ mb: 1 }}
        >
          Eisenhower Matrix Built In
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 4 }}
        >
          Every task is automatically placed in the right quadrant based on
          urgency and importance.
        </Typography>
        <Grid container spacing={2}>
          {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => {
            const info = EISENHOWER_QUADRANTS[q];
            return (
              <Grid size={{ xs: 6 }} key={q}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: `2px solid ${alpha(info.color, 0.35)}`,
                    bgcolor: alpha(info.color, isDark ? 0.1 : 0.05),
                    textAlign: 'center',
                    minHeight: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{ color: info.color }}
                  >
                    {q}: {info.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {info.description}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      {/* ─── Tech Stack ─── */}
      <Box
        sx={{
          py: 5,
          bgcolor: isDark
            ? alpha(theme.palette.background.paper, 0.4)
            : alpha(theme.palette.primary.main, 0.02),
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h5"
            textAlign="center"
            fontWeight={600}
            sx={{ mb: 3 }}
          >
            Built With Modern Tech
          </Typography>
          <Stack
            direction="row"
            flexWrap="wrap"
            justifyContent="center"
            spacing={1}
            useFlexGap
          >
            {TECH_STACK.map((tech) => (
              <Chip
                key={tech}
                label={tech}
                variant="outlined"
                sx={{
                  fontWeight: 500,
                  borderColor: alpha(theme.palette.primary.main, 0.4),
                }}
              />
            ))}
          </Stack>
        </Container>
      </Box>

      {/* ─── Bottom CTA ─── */}
      <Box sx={{ py: { xs: 6, md: 8 }, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
            Ready to Be More Productive?
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Create a free account and start organizing your life today.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{ px: 5, py: 1.5, fontSize: '1.05rem' }}
          >
            Get Started Free
          </Button>
        </Container>
      </Box>

      {/* ─── Footer ─── */}
      <Box
        component="footer"
        sx={{
          py: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {APP_CONFIG.APP_NAME} v{APP_CONFIG.APP_VERSION}
        </Typography>
      </Box>

      {/* ─── Login Dialog ─── */}
      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        initialTab={loginTab}
      />
    </Box>
  );
}
