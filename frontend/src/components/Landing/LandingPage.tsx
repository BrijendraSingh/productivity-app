import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  Stack,
  AppBar,
  Toolbar,
  alpha,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  CheckCircle as TodoIcon,
  GridView as MatrixIcon,
  Book as DiaryIcon,
  EventNote as JournalIcon,
  Article as BlogIcon,
  BarChart as AnalyticsIcon,
  Speed,
  Security,
  CloudOff,
  AutoAwesome as LogoIcon,
} from '@mui/icons-material';
import { APP_CONFIG, EISENHOWER_QUADRANTS } from '@productivity-app/shared';
import { useAuth } from '../../contexts/AuthContext';
import { LoginDialog } from '../Auth/LoginDialog';
import { designTokens } from '../../theme/theme';

const APP_TAGLINE = 'Your personal productivity workspace';

interface FeatureCard {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FEATURES: FeatureCard[] = [
  {
    title: 'Smart Todos',
    description:
      'Create, prioritize, and track tasks with categories, tags, due dates, and energy-level estimates.',
    icon: <TodoIcon />,
  },
  {
    title: 'Eisenhower Matrix',
    description:
      'Auto-sort tasks into four quadrants based on urgency and importance to focus on what truly matters.',
    icon: <MatrixIcon />,
  },
  {
    title: 'Digital Diary',
    description:
      'Daily journal entries with mood, weather, and energy tracking. Build streaks and reflect on your days.',
    icon: <DiaryIcon />,
  },
  {
    title: 'Bullet Journal',
    description:
      'Rapid logging with daily, weekly, monthly, and yearly views. Use symbols for tasks, events, and notes.',
    icon: <JournalIcon />,
  },
  {
    title: 'Blog Platform',
    description:
      'Write and publish articles with markdown support, reading time estimation, and category organization.',
    icon: <BlogIcon />,
  },
  {
    title: 'Analytics Dashboard',
    description:
      'Visualize productivity trends, completion rates, writing metrics, and mood patterns.',
    icon: <AnalyticsIcon />,
  },
];

const HIGHLIGHTS = [
  { icon: <Speed fontSize="small" />, label: 'Fast', detail: 'Instant local-first responses' },
  { icon: <Security fontSize="small" />, label: 'Secure', detail: 'Token-based auth' },
  {
    icon: <CloudOff fontSize="small" />,
    label: 'Private',
    detail: 'SQLite — your data stays local',
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
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

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: designTokens.colors.canvas,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppBar
        position="sticky"
        color="inherit"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: alpha(designTokens.colors.surface, 0.95),
          backdropFilter: 'blur(12px)',
        }}
      >
        <Container maxWidth="lg" disableGutters sx={{ px: { xs: 2, sm: 3 } }}>
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: 60 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: `${designTokens.radius.sm}px`,
                  bgcolor: designTokens.colors.primarySoft,
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LogoIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {APP_CONFIG.APP_NAME}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: { xs: 'none', sm: 'block' } }}
                >
                  {APP_TAGLINE}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              {isAuthenticated ? (
                <Button variant="contained" size="small" onClick={() => navigate('/')}>
                  Open app
                </Button>
              ) : (
                <>
                  <Button size="small" onClick={handleSignIn}>
                    Sign in
                  </Button>
                  <Button variant="contained" size="small" onClick={handleGetStarted}>
                    Get started
                  </Button>
                </>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* ─── Hero ─── */}
      <Container maxWidth="lg" sx={{ flex: 1, px: { xs: 2, sm: 3 }, py: { xs: 6, md: 10 } }}>
        <Box sx={{ maxWidth: 640 }}>
          <Typography className="section-label" component="p" sx={{ mb: 1 }}>
            Personal productivity
          </Typography>
          <Typography
            component="h1"
            className="display-heading"
            sx={{
              fontSize: { xs: '2.25rem', sm: '3rem', md: '3.25rem' },
              lineHeight: 1.15,
              mb: 2,
            }}
          >
            One place for tasks, focus, and reflection
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: '1.125rem', mb: 4, maxWidth: 520 }}
          >
            Manage todos with the Eisenhower Matrix, journal your thoughts, write blog posts, and
            track your productivity — designed for clarity, not clutter.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant="contained" size="large" onClick={handleGetStarted} sx={{ px: 3 }}>
              Get started free
            </Button>
            <Button variant="outlined" size="large" onClick={handleSignIn} sx={{ px: 3 }}>
              Sign in
            </Button>
          </Stack>
        </Box>

        {/* ─── Highlights ─── */}
        <Grid container spacing={3} sx={{ mt: { xs: 6, md: 8 }, maxWidth: 720 }}>
          {HIGHLIGHTS.map((h) => (
            <Grid size={{ xs: 12, sm: 4 }} key={h.label}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    color: 'primary.main',
                    mt: 0.25,
                    display: 'flex',
                  }}
                >
                  {h.icon}
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {h.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {h.detail}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: { xs: 6, md: 8 } }} />

        {/* ─── Features ─── */}
        <Box sx={{ mb: 2 }}>
          <Typography className="section-label" component="p" sx={{ mb: 1 }}>
            Modules
          </Typography>
          <Typography
            component="h2"
            className="display-heading"
            sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: 1 }}
          >
            Everything you need
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480 }}>
            Six integrated tools that work together — no switching between apps.
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          {FEATURES.map((f) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={f.title}>
              <Card
                sx={{
                  height: '100%',
                  '&:hover': { borderColor: alpha(designTokens.colors.primary, 0.4) },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ color: 'primary.main', mb: 1.5, display: 'flex' }}>{f.icon}</Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
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

        <Divider sx={{ my: { xs: 6, md: 8 } }} />

        {/* ─── Eisenhower Matrix ─── */}
        <Box sx={{ mb: 4 }}>
          <Typography className="section-label" component="p" sx={{ mb: 1 }}>
            Prioritization
          </Typography>
          <Typography
            component="h2"
            className="display-heading"
            sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: 1 }}
          >
            Eisenhower Matrix built in
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 520 }}>
            Every task is placed in the right quadrant based on urgency and importance.
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ maxWidth: 720 }}>
          {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => {
            const info = EISENHOWER_QUADRANTS[q];
            return (
              <Grid size={{ xs: 6 }} key={q}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: 1,
                    borderColor: alpha(info.color, 0.3),
                    bgcolor: alpha(info.color, 0.06),
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: info.color }}>
                    {q}: {info.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    {info.description}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>

        {/* ─── CTA ─── */}
        <Box
          sx={{
            mt: { xs: 6, md: 8 },
            py: { xs: 4, md: 5 },
            px: 3,
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography
            component="h2"
            className="display-heading"
            sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: 1 }}
          >
            Ready to get organized?
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}
          >
            Create a free account and start building better habits today.
          </Typography>
          <Button variant="contained" size="large" onClick={handleGetStarted} sx={{ px: 4 }}>
            Get started free
          </Button>
        </Box>
      </Container>

      {/* ─── Footer ─── */}
      <Box
        component="footer"
        sx={{
          py: 2,
          borderTop: 1,
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {APP_CONFIG.APP_NAME} v{APP_CONFIG.APP_VERSION}
        </Typography>
      </Box>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} initialTab={loginTab} />
    </Box>
  );
}
