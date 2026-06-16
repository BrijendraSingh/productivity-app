import React from 'react';
import { Box, Typography, Tooltip, Skeleton, alpha } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { DashboardStats } from '@productivity-app/shared';
import { EISENHOWER_QUADRANTS, type EisenhowerQuadrant } from '@productivity-app/shared';
import { quadrantColors } from '../../../../theme/theme';

interface QuadrantPulseProps {
  stats: DashboardStats | null;
  loading?: boolean;
}

const QUADRANTS: EisenhowerQuadrant[] = ['Q1', 'Q2', 'Q3', 'Q4'];

export function QuadrantPulse({ stats, loading }: QuadrantPulseProps) {
  const navigate = useNavigate();

  if (loading || !stats) {
    return (
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
        {QUADRANTS.map((q) => (
          <Skeleton key={q} variant="rounded" width={56} height={48} />
        ))}
      </Box>
    );
  }

  const counts = {
    Q1: stats.matrix.q1,
    Q2: stats.matrix.q2,
    Q3: stats.matrix.q3,
    Q4: stats.matrix.q4,
  };

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={600}
        sx={{ mb: 1, display: 'block' }}
      >
        Quadrant pulse
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.75 }}>
        {QUADRANTS.map((q) => {
          const color = quadrantColors[q];
          const count = counts[q];
          const label = EISENHOWER_QUADRANTS[q].label;
          return (
            <Tooltip key={q} title={`${q}: ${label} (${count})`} arrow>
              <Box
                component="button"
                type="button"
                onClick={() => navigate(`/todos?quadrant=${q}`)}
                sx={{
                  border: `1px solid ${alpha(color, 0.25)}`,
                  borderRadius: 1,
                  bgcolor: alpha(color, 0.06),
                  py: 1,
                  px: 0.5,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: alpha(color, 0.12),
                    borderColor: alpha(color, 0.45),
                  },
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: color,
                    mx: 'auto',
                    mb: 0.5,
                  }}
                />
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={{ color, display: 'block', lineHeight: 1 }}
                >
                  {q}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{
                    fontFamily: '"Source Serif 4", serif',
                    color: 'text.primary',
                    lineHeight: 1.2,
                  }}
                >
                  {count}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
