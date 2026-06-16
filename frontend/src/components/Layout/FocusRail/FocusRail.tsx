import React, { useEffect, useState } from 'react';
import { Box, IconButton, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { ChevronRight as CollapseIcon, ChevronLeft as ExpandIcon } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { APP_CONFIG } from '@productivity-app/shared';
import { useAuth } from '../../../contexts/AuthContext';
import { designTokens } from '../../../theme/theme';
import { RouteWidgets } from './RouteWidgets';
import { railPanelPadding, railToolbarHeight } from './railStyles';

const RAIL_COLLAPSED_KEY = `${APP_CONFIG.TOKEN_STORAGE_KEY}_focus_rail_collapsed`;
const RAIL_WIDTH_LG = 280;
const RAIL_WIDTH_XL = 320;

export function FocusRail() {
  const theme = useTheme();
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const isXlUp = useMediaQuery(theme.breakpoints.up('xl'));

  const isAnalytics = pathname.startsWith('/analytics');
  const hideOnAnalytics = isAnalytics && !isXlUp;
  const showRail = isAuthenticated && isLgUp && !hideOnAnalytics;

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(RAIL_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const railWidth = isXlUp ? RAIL_WIDTH_XL : RAIL_WIDTH_LG;
  const effectiveWidth = showRail && !collapsed ? railWidth : 0;

  useEffect(() => {
    try {
      localStorage.setItem(RAIL_COLLAPSED_KEY, String(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  useEffect(() => {
    document.documentElement.style.setProperty('--focus-rail-width', `${effectiveWidth}px`);
    return () => {
      document.documentElement.style.removeProperty('--focus-rail-width');
    };
  }, [effectiveWidth]);

  const toggleCollapsed = () => setCollapsed((c) => !c);

  if (!showRail) {
    return null;
  }

  return (
    <>
      <Box
        className="focus-rail"
        sx={{
          width: collapsed ? 0 : railWidth,
          flexShrink: 0,
          alignSelf: 'stretch',
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          minHeight: 0,
          bgcolor: designTokens.colors.sidebar,
          borderLeft: collapsed ? 0 : 1,
          borderColor: 'divider',
          overflow: 'hidden',
          transition: 'width 0.2s ease',
        }}
      >
        {!collapsed && (
          <>
            <Box
              sx={{
                height: railToolbarHeight,
                minHeight: railToolbarHeight,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                borderBottom: 1,
                borderColor: 'divider',
                boxSizing: 'border-box',
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}
              >
                Focus
              </Typography>
              <Tooltip title="Collapse panel" placement="left">
                <IconButton
                  size="small"
                  onClick={toggleCollapsed}
                  aria-label="Collapse focus panel"
                >
                  <CollapseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                minHeight: 0,
                minWidth: 0,
                width: '100%',
                boxSizing: 'border-box',
                ...railPanelPadding,
              }}
            >
              <RouteWidgets />
            </Box>
          </>
        )}
      </Box>

      {collapsed && (
        <Tooltip title="Show focus panel" placement="left">
          <IconButton
            onClick={toggleCollapsed}
            sx={{
              position: 'fixed',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: theme.zIndex.drawer - 1,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              boxShadow: 1,
            }}
            aria-label="Expand focus panel"
          >
            <ExpandIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
}
