import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Divider,
  Slider,
  Paper,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  CalendarMonth,
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Close as CancelIcon,
  WbSunny,
  Cloud,
  Grain,
  AcUnit,
  Thunderstorm,
  EmojiEmotions,
  SelfImprovement,
  Star,
  TrendingUp,
  Warning,
  ArrowForward,
} from '@mui/icons-material';
import { format, addDays, subDays, isToday } from 'date-fns';
import type { Mood, Weather, CreateDiaryEntryRequest } from '@productivity-app/shared';
import { MOOD_LEVELS } from '@productivity-app/shared';
import { useDiary } from '../../hooks/useDiary';

// ─── Weather config ───────────────────────────────────────────────────────────

const WEATHER_OPTIONS: { value: Weather; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'sunny', label: 'Sunny', icon: <WbSunny fontSize="small" />, color: '#ff9800' },
  { value: 'cloudy', label: 'Cloudy', icon: <Cloud fontSize="small" />, color: '#78909c' },
  { value: 'rainy', label: 'Rainy', icon: <Grain fontSize="small" />, color: '#42a5f5' },
  { value: 'snowy', label: 'Snowy', icon: <AcUnit fontSize="small" />, color: '#90caf9' },
  { value: 'stormy', label: 'Stormy', icon: <Thunderstorm fontSize="small" />, color: '#5c6bc0' },
];

const ENERGY_MARKS = [
  { value: 1, label: '1' },
  { value: 3, label: '3' },
  { value: 5, label: '5' },
  { value: 7, label: '7' },
  { value: 10, label: '10' },
];

// ─── Form State ───────────────────────────────────────────────────────────────

interface DiaryFormState {
  content: string;
  mood: Mood | '';
  weather: Weather | '';
  energy_level: number;
  gratitude: string;
  highlights: string;
  challenges: string;
  tomorrow_focus: string;
}

const INITIAL_FORM: DiaryFormState = {
  content: '',
  mood: '',
  weather: '',
  energy_level: 5,
  gratitude: '',
  highlights: '',
  challenges: '',
  tomorrow_focus: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function DiaryView() {
  const theme = useTheme();
  const {
    currentEntry,
    selectedDate,
    loading,
    saving,
    error,
    setSelectedDate,
    upsertEntry,
    deleteEntry,
  } = useDiary();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<DiaryFormState>(INITIAL_FORM);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const displayDate = format(selectedDate, 'EEEE, MMMM d, yyyy');
  const hasEntry = currentEntry !== null;

  // Listen for FAB click
  useDiaryDialogEvent(useCallback(() => {
    if (!hasEntry) {
      setEditing(true);
      setForm(INITIAL_FORM);
    } else {
      setEditing(true);
    }
  }, [hasEntry]));

  // Sync form from current entry when entry changes or editing starts
  useEffect(() => {
    if (currentEntry && editing) {
      setForm({
        content: currentEntry.content ?? '',
        mood: currentEntry.mood ?? '',
        weather: currentEntry.weather ?? '',
        energy_level: currentEntry.energy_level ?? 5,
        gratitude: currentEntry.gratitude ?? '',
        highlights: currentEntry.highlights ?? '',
        challenges: currentEntry.challenges ?? '',
        tomorrow_focus: currentEntry.tomorrow_focus ?? '',
      });
    }
  }, [currentEntry, editing]);

  // Reset editing on date change
  useEffect(() => {
    setEditing(false);
    setConfirmDelete(false);
  }, [dateStr]);

  const handleSave = async () => {
    const payload: CreateDiaryEntryRequest = {
      content: form.content || undefined,
      mood: form.mood || undefined,
      weather: form.weather || undefined,
      energy_level: form.energy_level,
      gratitude: form.gratitude || undefined,
      highlights: form.highlights || undefined,
      challenges: form.challenges || undefined,
      tomorrow_focus: form.tomorrow_focus || undefined,
    };

    const success = await upsertEntry(payload);
    if (success) setEditing(false);
  };

  const handleDelete = async () => {
    const success = await deleteEntry(dateStr);
    if (success) {
      setEditing(false);
      setConfirmDelete(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setConfirmDelete(false);
  };

  const handleStartEdit = () => {
    if (currentEntry) {
      setForm({
        content: currentEntry.content ?? '',
        mood: currentEntry.mood ?? '',
        weather: currentEntry.weather ?? '',
        energy_level: currentEntry.energy_level ?? 5,
        gratitude: currentEntry.gratitude ?? '',
        highlights: currentEntry.highlights ?? '',
        challenges: currentEntry.challenges ?? '',
        tomorrow_focus: currentEntry.tomorrow_focus ?? '',
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setEditing(true);
  };

  const updateForm = (partial: Partial<DiaryFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  return (
    <Box>
      {/* ─── Date Navigation ──────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <IconButton onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
            <ChevronLeft />
          </IconButton>

          <Stack direction="row" alignItems="center" spacing={1}>
            <CalendarMonth color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {displayDate}
            </Typography>
            {isToday(selectedDate) && (
              <Chip label="Today" size="small" color="primary" variant="outlined" />
            )}
          </Stack>

          <IconButton
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            disabled={isToday(selectedDate)}
          >
            <ChevronRight />
          </IconButton>
        </Stack>

        {!isToday(selectedDate) && (
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Button size="small" onClick={() => setSelectedDate(new Date())}>
              Go to Today
            </Button>
          </Box>
        )}
      </Paper>

      {/* ─── Error ────────────────────────────────────────────────────── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* ─── Loading ──────────────────────────────────────────────────── */}
      {loading ? (
        <DiaryLoadingSkeleton />
      ) : editing ? (
        /* ─── Edit Mode ──────────────────────────────────────────────── */
        <Card sx={{ border: `2px solid ${theme.palette.primary.main}` }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {hasEntry ? 'Edit Entry' : 'New Entry'}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>

            {/* Mood */}
            <SectionLabel icon={<EmojiEmotions />} label="How are you feeling?" />
            <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
              {(Object.entries(MOOD_LEVELS) as [Mood, typeof MOOD_LEVELS[Mood]][]).map(
                ([key, info]) => (
                  <Chip
                    key={key}
                    label={`${info.emoji} ${info.label}`}
                    onClick={() => updateForm({ mood: form.mood === key ? '' : key })}
                    sx={{
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      px: 0.5,
                      ...(form.mood === key
                        ? { bgcolor: info.color, color: '#fff' }
                        : {
                            bgcolor: alpha(info.color, 0.1),
                            color: info.color,
                            '&:hover': { bgcolor: alpha(info.color, 0.2) },
                          }),
                    }}
                  />
                ),
              )}
            </Stack>

            {/* Weather */}
            <SectionLabel icon={<WbSunny />} label="Weather" />
            <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
              {WEATHER_OPTIONS.map((w) => (
                <Chip
                  key={w.value}
                  icon={<>{w.icon}</>}
                  label={w.label}
                  onClick={() => updateForm({ weather: form.weather === w.value ? '' : w.value })}
                  sx={{
                    fontWeight: 500,
                    ...(form.weather === w.value
                      ? { bgcolor: w.color, color: '#fff', '& .MuiChip-icon': { color: '#fff' } }
                      : {
                          bgcolor: alpha(w.color, 0.1),
                          color: w.color,
                          '& .MuiChip-icon': { color: w.color },
                          '&:hover': { bgcolor: alpha(w.color, 0.2) },
                        }),
                  }}
                />
              ))}
            </Stack>

            {/* Energy Level */}
            <SectionLabel icon={<SelfImprovement />} label={`Energy Level: ${form.energy_level}/10`} />
            <Box sx={{ px: 2, mb: 3 }}>
              <Slider
                value={form.energy_level}
                onChange={(_, val) => updateForm({ energy_level: val as number })}
                min={1}
                max={10}
                step={1}
                marks={ENERGY_MARKS}
                valueLabelDisplay="auto"
                sx={{
                  color: form.energy_level >= 7 ? '#4caf50' : form.energy_level >= 4 ? '#ff9800' : '#f44336',
                }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Main Content */}
            <TextField
              label="Journal Entry"
              multiline
              minRows={4}
              maxRows={12}
              fullWidth
              value={form.content}
              onChange={(e) => updateForm({ content: e.target.value })}
              placeholder="Write about your day..."
              sx={{ mb: 2 }}
            />

            {/* Structured Fields */}
            <Stack spacing={2}>
              <TextField
                label="Gratitude"
                multiline
                minRows={2}
                maxRows={4}
                fullWidth
                value={form.gratitude}
                onChange={(e) => updateForm({ gratitude: e.target.value })}
                placeholder="What are you grateful for today?"
                slotProps={{ input: { startAdornment: <Star sx={{ mr: 1, color: '#ff9800' }} /> } }}
              />
              <TextField
                label="Highlights"
                multiline
                minRows={2}
                maxRows={4}
                fullWidth
                value={form.highlights}
                onChange={(e) => updateForm({ highlights: e.target.value })}
                placeholder="What went well today?"
                slotProps={{ input: { startAdornment: <TrendingUp sx={{ mr: 1, color: '#4caf50' }} /> } }}
              />
              <TextField
                label="Challenges"
                multiline
                minRows={2}
                maxRows={4}
                fullWidth
                value={form.challenges}
                onChange={(e) => updateForm({ challenges: e.target.value })}
                placeholder="What challenges did you face?"
                slotProps={{ input: { startAdornment: <Warning sx={{ mr: 1, color: '#f44336' }} /> } }}
              />
              <TextField
                label="Tomorrow's Focus"
                multiline
                minRows={2}
                maxRows={4}
                fullWidth
                value={form.tomorrow_focus}
                onChange={(e) => updateForm({ tomorrow_focus: e.target.value })}
                placeholder="What will you focus on tomorrow?"
                slotProps={{ input: { startAdornment: <ArrowForward sx={{ mr: 1, color: '#1976d2' }} /> } }}
              />
            </Stack>

            {/* Delete */}
            {hasEntry && (
              <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                {confirmDelete ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="error">
                      Delete this entry?
                    </Typography>
                    <Button size="small" color="error" variant="contained" onClick={handleDelete}>
                      Confirm Delete
                    </Button>
                    <Button size="small" onClick={() => setConfirmDelete(false)}>
                      Cancel
                    </Button>
                  </Stack>
                ) : (
                  <Button
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setConfirmDelete(true)}
                    size="small"
                  >
                    Delete Entry
                  </Button>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      ) : hasEntry ? (
        /* ─── Read Mode ──────────────────────────────────────────────── */
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Daily Reflection
              </Typography>
              <Tooltip title="Edit entry">
                <IconButton onClick={handleStartEdit} color="primary">
                  <EditIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Metadata chips */}
            <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
              {currentEntry.mood && (
                <Chip
                  label={`${MOOD_LEVELS[currentEntry.mood].emoji} ${MOOD_LEVELS[currentEntry.mood].label}`}
                  sx={{
                    bgcolor: alpha(MOOD_LEVELS[currentEntry.mood].color, 0.15),
                    color: MOOD_LEVELS[currentEntry.mood].color,
                    fontWeight: 600,
                  }}
                />
              )}
              {currentEntry.weather && (() => {
                const w = WEATHER_OPTIONS.find((o) => o.value === currentEntry.weather);
                return w ? (
                  <Chip
                    icon={<>{w.icon}</>}
                    label={w.label}
                    sx={{
                      bgcolor: alpha(w.color, 0.15),
                      color: w.color,
                      '& .MuiChip-icon': { color: w.color },
                      fontWeight: 600,
                    }}
                  />
                ) : null;
              })()}
              {currentEntry.energy_level != null && (
                <Chip
                  icon={<SelfImprovement fontSize="small" />}
                  label={`Energy: ${currentEntry.energy_level}/10`}
                  sx={{
                    bgcolor: alpha(
                      currentEntry.energy_level >= 7 ? '#4caf50' : currentEntry.energy_level >= 4 ? '#ff9800' : '#f44336',
                      0.15,
                    ),
                    color: currentEntry.energy_level >= 7 ? '#4caf50' : currentEntry.energy_level >= 4 ? '#ff9800' : '#f44336',
                    fontWeight: 600,
                  }}
                />
              )}
            </Stack>

            {/* Content */}
            {currentEntry.content && (
              <ReadSection label="Journal" content={currentEntry.content} />
            )}
            {currentEntry.gratitude && (
              <ReadSection label="Gratitude" content={currentEntry.gratitude} icon={<Star sx={{ color: '#ff9800', fontSize: 18 }} />} />
            )}
            {currentEntry.highlights && (
              <ReadSection label="Highlights" content={currentEntry.highlights} icon={<TrendingUp sx={{ color: '#4caf50', fontSize: 18 }} />} />
            )}
            {currentEntry.challenges && (
              <ReadSection label="Challenges" content={currentEntry.challenges} icon={<Warning sx={{ color: '#f44336', fontSize: 18 }} />} />
            )}
            {currentEntry.tomorrow_focus && (
              <ReadSection label="Tomorrow's Focus" content={currentEntry.tomorrow_focus} icon={<ArrowForward sx={{ color: '#1976d2', fontSize: 18 }} />} />
            )}

            {!currentEntry.content && !currentEntry.gratitude && !currentEntry.highlights && !currentEntry.challenges && !currentEntry.tomorrow_focus && (
              <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No written content — only mood/weather/energy recorded.
              </Typography>
            )}
          </CardContent>
        </Card>
      ) : (
        /* ─── Empty State ────────────────────────────────────────────── */
        <Card>
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <EmojiEmotions sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No entry for {displayDate}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start writing to capture your thoughts, mood, and reflections.
            </Typography>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleStartEdit}
            >
              Write Entry
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
      {icon}
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
    </Stack>
  );
}

function ReadSection({ label, content, icon }: { label: string; content: string; icon?: React.ReactNode }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
        {icon}
        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
        {content}
      </Typography>
    </Box>
  );
}

function DiaryLoadingSkeleton() {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Skeleton width="50%" height={32} sx={{ mb: 2 }} />
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          <Skeleton variant="rounded" width={80} height={32} />
          <Skeleton variant="rounded" width={80} height={32} />
          <Skeleton variant="rounded" width={120} height={32} />
        </Stack>
        <Skeleton height={20} sx={{ mb: 1 }} />
        <Skeleton height={20} sx={{ mb: 1 }} />
        <Skeleton height={20} width="80%" sx={{ mb: 1 }} />
        <Skeleton height={20} width="60%" />
      </CardContent>
    </Card>
  );
}

export function useDiaryDialogEvent(onOpen: () => void) {
  useEffect(() => {
    const handler = () => onOpen();
    window.addEventListener('open-add-diary-dialog', handler);
    return () => window.removeEventListener('open-add-diary-dialog', handler);
  }, [onOpen]);
}
