import React, { useState } from 'react';
import { Box, Typography, TextField, IconButton, Chip, Stack, InputAdornment } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { Priority, CreateTodoRequest } from '@productivity-app/shared';
import { priorityColors } from '../../../../theme/theme';
import { todosApi } from '../../../../services/api';
import { dispatchTodosChanged } from '../../../../utils/events';

interface QuickCaptureProps {
  onCreate?: (body: CreateTodoRequest) => Promise<boolean>;
}

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];

export function QuickCapture({ onCreate }: QuickCaptureProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      let ok = false;
      if (onCreate) {
        ok = await onCreate({ title: trimmed, priority });
      } else {
        const res = await todosApi.create({ title: trimmed, priority });
        ok = Boolean(res.success);
      }
      if (ok) {
        setTitle('');
        dispatchTodosChanged();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
        Quick capture
      </Typography>
      <TextField
        placeholder="Add a task…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
        }}
        size="small"
        fullWidth
        disabled={submitting}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleSubmit}
                  disabled={!title.trim() || submitting}
                  color="primary"
                  aria-label="Add todo"
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 1.25 }}
      />
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
        {PRIORITIES.map((p) => (
          <Chip
            key={p}
            label={p}
            size="small"
            onClick={() => setPriority(p)}
            sx={{
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'capitalize',
              ...(priority === p
                ? { bgcolor: priorityColors[p], color: '#fff' }
                : { bgcolor: 'transparent', border: 1, borderColor: 'divider' }),
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}
