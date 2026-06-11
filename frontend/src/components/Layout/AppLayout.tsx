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
  Fab,
  Divider,
  Button,
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
  Add as AddIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  AutoAwesome as LogoIcon,
} from '@mui/icons-material';
import { APP_CONFIG } from '@productivity-app/shared';
import { useAuth } from '../../contexts/AuthContext';
import { LoginDialog } from '../Auth/LoginDialog';
import { designTokens } from '../../theme/theme';

const DRAWER_WIDTH = 248;
const APP_TAGLINE = 'Focus on what matters';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon sx={{ fontSize: 20 }} /> },
  { label: 'Todos', path: '/todos', icon: <TodoIcon sx={{ fontSize: 20 }} /> },
  { label: 'Matrix', path: '/matrix', icon: <MatrixIcon sx={{ fontSize: 20 }} /> },
  { label: 'Diary', path: '/diary', icon: <DiaryIcon sx={{ fontSize: 20 }} /> },
  { label: 'Journal', path: '/journal', icon: <JournalIcon sx={{ fontSize: 20 }} /> },
  { label: 'Blog', path: '/blog', icon: <BlogIcon sx={{ fontSize: 20 }} /> },
  { label: 'Analytics', path: '/analytics', icon: <AnalyticsIcon sx={{ fontSize: 20 }} /> },
];

const FAB_CONFIG: Record<string, string> = {
  '/diary': 'New Entry',
  '/blog': 'New Post',
  '/journal': 'New Log',
};

export function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated, logout } = useAuth();
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
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const currentPage = NAV_ITEMS.find((item) => isActive(item.path))?.label || APP_CONFIG.APP_NAME;
  const fabLabel = FAB_CONFIG[location.pathname];

  const drawerContent = (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: designTokens.colors.sidebar,
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
        }}
        onClick={() => handleNavClick('/')}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: `${designTokens.radius.sm}px`,
            bgcolor: designTokens.colors.primarySoft,
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <LogoIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}
          >
            {APP_CONFIG.APP_NAME}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            {APP_TAGLINE}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Nav */}
      <Box sx={{ flex: 1, py: 1.5, overflowY: 'auto' }}>
        <Typography
          variant="overline"
          sx={{ px: 2.5, py: 0.5, display: 'block', color: 'text.secondary', fontSize: '0.625rem' }}
        >
          Workspace
        </Typography>
        <List sx={{ py: 0 }}>
          {NAV_ITEMS.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ position: 'relative' }}>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => handleNavClick(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive(item.path) ? 600 : 450,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <Divider />
      <Box sx={{ px: 2.5, py: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          v{APP_CONFIG.APP_VERSION}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box className="app-shell" sx={{ bgcolor: 'background.default' }}>
      <Box className="app-shell-body">
        {/* Sidebar — desktop */}
        {!isMobile && (
          <Drawer
            variant="permanent"
            sx={{
              width: DRAWER_WIDTH,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                position: 'relative',
                border: 'none',
                borderRight: 1,
                borderColor: 'divider',
              },
            }}
          >
            {drawerContent}
          </Drawer>
        )}

        {/* Mobile drawer */}
        {isMobile && (
          <SwipeableDrawer
            variant="temporary"
            open={mobileOpen}
            onOpen={handleDrawerToggle}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
          >
            {drawerContent}
          </SwipeableDrawer>
        )}

        {/* Right column: header + content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          <AppBar
            position="static"
            color="inherit"
            sx={{
              bgcolor: designTokens.colors.sidebar,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Toolbar sx={{ minHeight: { xs: 56, sm: 60 }, px: { xs: 2, sm: 3 }, gap: 1 }}>
              {isMobile && (
                <IconButton
                  edge="start"
                  onClick={handleDrawerToggle}
                  size="small"
                  aria-label="Open menu"
                >
                  <MenuIcon />
                </IconButton>
              )}

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="h6" noWrap sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  {currentPage}
                </Typography>
              </Box>

              {isAuthenticated && user ? (
                <>
                  <Button
                    size="small"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    startIcon={
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: '0.75rem',
                          bgcolor: 'primary.main',
                        }}
                      >
                        {user.username[0].toUpperCase()}
                      </Avatar>
                    }
                    sx={{ color: 'text.primary', textTransform: 'none', fontWeight: 500 }}
                  >
                    {user.username}
                  </Button>
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
                      <LogoutIcon sx={{ mr: 1.5, fontSize: 18, color: 'text.secondary' }} />
                      Sign out
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<LoginIcon sx={{ fontSize: 18 }} />}
                  onClick={() => setLoginOpen(true)}
                >
                  Sign in
                </Button>
              )}
            </Toolbar>
          </AppBar>

          <Box
            component="main"
            className="app-main-scroll"
            sx={{
              flex: 1,
              px: { xs: 2, sm: 3, lg: 4 },
              py: { xs: 2.5, sm: 3 },
              maxWidth: 1200,
              width: '100%',
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>

      {isAuthenticated && fabLabel && (
        <Fab
          color="primary"
          aria-label={fabLabel}
          onClick={() => {
            const eventMap: Record<string, string> = {
              '/todos': 'open-add-todo-dialog',
              '/diary': 'open-add-diary-dialog',
              '/blog': 'open-add-blog-dialog',
              '/journal': 'open-add-journal-dialog',
            };
            const eventName = eventMap[location.pathname];
            if (eventName) {
              window.dispatchEvent(new CustomEvent(eventName));
            }
          }}
          sx={{ position: 'fixed', bottom: 28, right: 28 }}
        >
          <AddIcon />
        </Fab>
      )}

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Box>
  );
}
