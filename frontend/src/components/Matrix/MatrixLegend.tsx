import React from 'react';
import { Box, Typography, Stack, Paper, Divider, alpha } from '@mui/material';
import {
  Info as InfoIcon,
  ArrowUpward as UrgentIcon,
  Star as ImportantIcon,
} from '@mui/icons-material';
import { EisenhowerUtils } from '@productivity-app/shared';
import { designTokens, surface } from '../../theme/theme';

interface MatrixLegendProps {
  onOpenTodos: () => void;
  compact?: boolean;
}

export function MatrixLegend({ onOpenTodos, compact = false }: MatrixLegendProps) {
  const allQuadrants = EisenhowerUtils.getAllQuadrants();

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <InfoIcon fontSize="small" sx={{ color: 'primary.main' }} />
        <Typography variant="subtitle2" fontWeight={600}>
          How the Eisenhower Matrix Works
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.55 }}>
        Tasks are automatically assigned to quadrants based on their urgency and importance levels.
        Urgency and importance are rated 1–10; a threshold of 7 determines the split.
      </Typography>

      {!compact && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.55 }}>
          <strong>Take action:</strong> click a task to open it in{' '}
          <Box
            component="button"
            type="button"
            onClick={onOpenTodos}
            sx={{
              border: 'none',
              background: 'none',
              p: 0,
              m: 0,
              color: 'primary.main',
              font: 'inherit',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            Todos
          </Box>
          . Use the checkbox to mark complete, or the ⋯ menu to change status.
        </Typography>
      )}

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
    </Box>
  );
}

export function MatrixLegendPanel({ onOpenTodos }: { onOpenTodos: () => void }) {
  return (
    <Paper
      elevation={0}
      sx={{
        ...surface.panel,
        p: 2.5,
        borderRadius: `${designTokens.radius.md}px`,
      }}
    >
      <MatrixLegend onOpenTodos={onOpenTodos} />
    </Paper>
  );
}
