import React, { useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  useMediaQuery,
  useTheme,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Fab,
  Divider,
  Container,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  CheckCircle as TodoIcon,
  GridView as MatrixIcon,
  Book as DiaryIcon,
  EventNote as JournalIcon,
  Article as BlogIcon,
  BarChart as AnalyticsIcon,
  LightMode,
  DarkMode,
  Add as AddIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { APP_CONFIG } from '@productivity-app/shared';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';
import { LoginDialog } from '../Auth/LoginDialog';

const DRAWER_WIDTH = 240;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Todos', path: '/todos', icon: <TodoIcon /> },
  { label: 'Matrix', path: '/matrix', icon: <MatrixIcon /> },
  { label: 'Diary', path: '/diary', icon: <DiaryIcon /> },
  { label: 'Journal', path: '/journal', icon: <JournalIcon /> },
  { label: 'Blog', path: '/blog', icon: <BlogIcon /> },
  { label: 'Analytics', path: '/analytics', icon: <AnalyticsIcon /> },
];

const FAB_CONFIG: Record<string, string> = {
  '/todos': 'New Todo',
  '/diary': 'New Entry',
  '/blog': 'New Post',
  '/journal': 'New Log',
};

export function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/')
      return (
        location.pathname === '/' || location.pathname === '/dashboard'
      );
    return location.pathname.startsWith(path);
  };

  const currentPage =
    NAV_ITEMS.find((item) => isActive(item.path))?.label ||
    APP_CONFIG.APP_NAME;

  const fabLabel = FAB_CONFIG[location.pathname];

  // ─── Drawer content ─────────────────────────────────────────────────────────

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH }}>
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          sx={{ fontWeight: 700, color: 'primary.main' }}
        >
          {APP_CONFIG.APP_NAME}
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={isActive(item.path)}
              onClick={() => handleNavClick(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                  '&:hover': { backgroundColor: 'primary.dark' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* ─── AppBar ─── */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {currentPage}
          </Typography>

          {/* Theme toggle */}
          <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }}>
            {mode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>

          {/* Auth area */}
          {isAuthenticated && user ? (
            <>
              <Chip
                avatar={
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    {user.username[0].toUpperCase()}
                  </Avatar>
                }
                label={user.username}
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  color: 'inherit',
                  cursor: 'pointer',
                  borderColor: 'rgba(255,255,255,0.4)',
                }}
                variant="outlined"
              />
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
              >
                <MenuItem
                  onClick={async () => {
                    setAnchorEl(null);
                    await logout();
                    navigate('/welcome');
                  }}
                >
                  <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <IconButton
              color="inherit"
              onClick={() => setLoginOpen(true)}
            >
              <LoginIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* ─── Drawer ─── */}
      {isMobile ? (
        <SwipeableDrawer
          variant="temporary"
          open={mobileOpen}
          onOpen={handleDrawerToggle}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </SwipeableDrawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* ─── Main content ─── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Outlet />
        </Container>
      </Box>

      {/* ─── Context-aware FAB ─── */}
      {isAuthenticated && fabLabel && (
        <Fab
          color="primary"
          aria-label={fabLabel}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Login dialog */}
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Box>
  );
}
