import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Tabs,
  Tab,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  CalendarMonth,
  Save as SaveIcon,
  EventNote,
  Add as AddIcon,
  Schedule,
  LocationOn,
  AccessTime,
} from '@mui/icons-material';
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns';
import type { BulletLogType, CreateEventRequest } from '@productivity-app/shared';
import { BULLET_SYMBOLS } from '@productivity-app/shared';
import { bulletSymbolColors } from '../../theme/theme';
import { useBulletJournal } from '../../hooks/useBulletJournal';

// ─── Tab config ───────────────────────────────────────────────────────────────

const TAB_CONFIG: { type: BulletLogType; label: string }[] = [
  { type: 'daily', label: 'Daily' },
  { type: 'weekly', label: 'Weekly' },
  { type: 'monthly', label: 'Monthly' },
  { type: 'yearly', label: 'Yearly' },
  { type: 'future', label: 'Future' },
];

// ─── Event form state ─────────────────────────────────────────────────────────

interface EventFormState {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  duration: string;
  location: string;
  bullet_symbol: string;
}

const INITIAL_EVENT_FORM: EventFormState = {
  title: '',
  description: '',
  event_date: format(new Date(), 'yyyy-MM-dd'),
  event_time: '',
  duration: '',
  location: '',
  bullet_symbol: '○',
};

const SHORTCUT_MAP: Record<string, string> = {
  '/t': '• ',
  '/d': '× ',
  '/m': '→ ',
  '/e': '○ ',
  '/n': '– ',
  '/p': '! ',
};

const SYMBOL_BUTTON_LABELS: Record<string, string> = {
  '•': 'Task',
  '×': 'Done',
  '→': 'Migrated',
  '○': 'Event',
  '–': 'Note',
  '!': 'Priority',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function BulletJournalView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    currentLog,
    events,
    selectedDate,
    activeTab,
    loading,
    saving,
    error,
    setSelectedDate,
    setActiveTab,
    refresh,
    upsertLog,
    createEvent,
  } = useBulletJournal();

  const [logContent, setLogContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventForm, setEventForm] = useState<EventFormState>(INITIAL_EVENT_FORM);
  const textFieldRef = useRef<HTMLTextAreaElement>(null);
  const cursorPosRef = useRef(0);

  // Listen for FAB click
  useJournalDialogEvent(
    useCallback(() => {
      setEventDialogOpen(true);
      setEventForm({
        ...INITIAL_EVENT_FORM,
        event_date: format(selectedDate, 'yyyy-MM-dd'),
      });
    }, [selectedDate])
  );

  // Sync log content when currentLog changes
  useEffect(() => {
    setLogContent(currentLog?.content ?? '');
    setDirty(false);
  }, [currentLog]);

  // ─── Date navigation ─────────────────────────────────────────────────────

  const navigateDate = (direction: 'prev' | 'next') => {
    const fn =
      direction === 'prev'
        ? {
            daily: subDays,
            weekly: subWeeks,
            monthly: subMonths,
            yearly: subYears,
            future: subMonths,
          }
        : {
            daily: addDays,
            weekly: addWeeks,
            monthly: addMonths,
            yearly: addYears,
            future: addMonths,
          };

    setSelectedDate(fn[activeTab](selectedDate, 1));
  };

  const getDateLabel = (): string => {
    switch (activeTab) {
      case 'daily':
        return format(selectedDate, 'EEEE, MMM d, yyyy');
      case 'weekly': {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
        return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
      }
      case 'monthly':
        return format(selectedDate, 'MMMM yyyy');
      case 'yearly':
        return format(selectedDate, 'yyyy');
      case 'future':
        return 'Future Log';
    }
  };

  // ─── Tab change ───────────────────────────────────────────────────────────

  const handleTabChange = (_: React.SyntheticEvent, index: number) => {
    setActiveTab(TAB_CONFIG[index].type);
  };

  const tabIndex = TAB_CONFIG.findIndex((t) => t.type === activeTab);

  // ─── Log save ─────────────────────────────────────────────────────────────

  const handleSaveLog = async () => {
    const success = await upsertLog(logContent);
    if (success) setDirty(false);
  };

  // ─── Event dialog ─────────────────────────────────────────────────────────

  const handleOpenEventDialog = () => {
    setEventForm({
      ...INITIAL_EVENT_FORM,
      event_date: format(selectedDate, 'yyyy-MM-dd'),
    });
    setEventDialogOpen(true);
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title.trim()) return;

    const payload: CreateEventRequest = {
      title: eventForm.title.trim(),
      description: eventForm.description.trim() || undefined,
      event_date: eventForm.event_date,
      event_time: eventForm.event_time || undefined,
      duration: eventForm.duration ? Number(eventForm.duration) : undefined,
      location: eventForm.location.trim() || undefined,
      bullet_symbol: eventForm.bullet_symbol,
    };

    const success = await createEvent(payload);
    if (success) setEventDialogOpen(false);
  };

  const updateEventForm = (partial: Partial<EventFormState>) => {
    setEventForm((prev) => ({ ...prev, ...partial }));
  };

  // ─── Symbol insertion helpers ───────────────────────────────────────────

  const syncCursorPosition = () => {
    const el = textFieldRef.current;
    if (el) {
      cursorPosRef.current = el.selectionStart ?? logContent.length;
    }
  };

  const handleInsertSymbol = (symbol: string) => {
    const el = textFieldRef.current;
    const start = el?.selectionStart ?? cursorPosRef.current ?? logContent.length;
    const end = el?.selectionEnd ?? start;
    const before = logContent.slice(0, start);
    const after = logContent.slice(end);
    const insertion = `${symbol} `;
    const newContent = before + insertion + after;
    const newCursor = start + insertion.length;

    setLogContent(newContent);
    setDirty(true);
    cursorPosRef.current = newCursor;

    requestAnimationFrame(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(newCursor, newCursor);
      }
    });
  };

  const handleLogChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;
    const pos = e.target.selectionStart ?? value.length;
    if (pos >= 2) {
      const twoChars = value.slice(pos - 2, pos);
      const replacement = SHORTCUT_MAP[twoChars];
      if (replacement) {
        const charBefore = pos > 2 ? value[pos - 3] : '\n';
        if (charBefore === '\n' || pos - 2 === 0) {
          value = value.slice(0, pos - 2) + replacement + value.slice(pos);
          requestAnimationFrame(() => {
            const el = textFieldRef.current;
            if (el) {
              const newPos = pos - 2 + replacement.length;
              el.setSelectionRange(newPos, newPos);
            }
          });
        }
      }
    }
    setLogContent(value);
    setDirty(true);
    requestAnimationFrame(() => {
      const el = textFieldRef.current;
      if (el) cursorPosRef.current = el.selectionStart ?? value.length;
    });
  };

  return (
    <Box>
      {/* ─── Tabs ─────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons={isMobile ? 'auto' : false}
          sx={{
            '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', py: 1.5 },
          }}
        >
          {TAB_CONFIG.map((tab) => (
            <Tab key={tab.type} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      {/* ─── Date Navigation ──────────────────────────────────────────── */}
      {activeTab !== 'future' && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            mb: 2,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <IconButton onClick={() => navigateDate('prev')}>
              <ChevronLeft />
            </IconButton>
            <Stack direction="row" alignItems="center" spacing={1}>
              <CalendarMonth color="primary" fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {getDateLabel()}
              </Typography>
              {activeTab === 'daily' && isToday(selectedDate) && (
                <Chip label="Today" size="small" color="primary" variant="outlined" />
              )}
            </Stack>
            <IconButton onClick={() => navigateDate('next')}>
              <ChevronRight />
            </IconButton>
          </Stack>
          {activeTab === 'daily' && !isToday(selectedDate) && (
            <Box sx={{ textAlign: 'center', mt: 0.5 }}>
              <Button size="small" onClick={() => setSelectedDate(new Date())}>
                Go to Today
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {/* ─── Error ────────────────────────────────────────────────────── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      {loading ? (
        <JournalLoadingSkeleton />
      ) : (
        <Stack spacing={2}>
          {/* Rapid Logging Area */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EventNote color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {TAB_CONFIG.find((t) => t.type === activeTab)?.label} Log
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  {dirty && (
                    <Chip label="Unsaved changes" size="small" color="warning" variant="outlined" />
                  )}
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveLog}
                    disabled={saving || !dirty}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </Stack>
              </Stack>

              <Box sx={{ mb: 1.5 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, mb: 1, display: 'block' }}
                >
                  Insert at cursor
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {BULLET_SYMBOLS.map((bs) => {
                    const color = bulletSymbolColors[bs.symbol] ?? '#757575';
                    const label = SYMBOL_BUTTON_LABELS[bs.symbol] ?? bs.label;
                    return (
                      <Tooltip key={bs.symbol} title={bs.description} arrow>
                        <Button
                          size="small"
                          variant="outlined"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleInsertSymbol(bs.symbol)}
                          sx={{
                            minWidth: 'auto',
                            px: 1.25,
                            py: 0.5,
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            borderColor: alpha(color, 0.35),
                            color,
                            bgcolor: alpha(color, 0.06),
                            '&:hover': {
                              borderColor: color,
                              bgcolor: alpha(color, 0.12),
                            },
                          }}
                        >
                          {bs.symbol} {label}
                        </Button>
                      </Tooltip>
                    );
                  })}
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.75, display: 'block' }}
                >
                  Click a button to insert at your cursor, or type /t /d /m /e /n /p at line start
                </Typography>
              </Box>

              <TextField
                multiline
                minRows={8}
                maxRows={20}
                fullWidth
                inputRef={textFieldRef}
                value={logContent}
                onChange={handleLogChange}
                onSelect={syncCursorPosition}
                onKeyUp={syncCursorPosition}
                onClick={syncCursorPosition}
                onBlur={syncCursorPosition}
                placeholder={getPlaceholder(activeTab)}
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
                    fontSize: '0.9rem',
                    lineHeight: 1.8,
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Events Section (daily/weekly only) */}
          {(activeTab === 'daily' || activeTab === 'weekly') && (
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Schedule color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Events
                    </Typography>
                    <Chip label={events.length} size="small" color="primary" variant="outlined" />
                  </Stack>
                  <Tooltip title="Add event">
                    <IconButton color="primary" onClick={handleOpenEventDialog}>
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>

                {events.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography color="text.secondary" variant="body2">
                      No events scheduled. Click + to add one.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    {events.map((event) => (
                      <Paper
                        key={event.id}
                        elevation={0}
                        sx={{
                          p: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 1.5,
                          borderLeft: `4px solid ${bulletSymbolColors[event.bullet_symbol] ?? theme.palette.primary.main}`,
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Box>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography
                                sx={{
                                  fontFamily: 'monospace',
                                  fontSize: '1.1rem',
                                  color: bulletSymbolColors[event.bullet_symbol] ?? 'primary.main',
                                  fontWeight: 700,
                                }}
                              >
                                {event.bullet_symbol}
                              </Typography>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {event.title}
                              </Typography>
                            </Stack>
                            {event.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {event.description}
                              </Typography>
                            )}
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            {event.event_time && (
                              <Chip
                                icon={<AccessTime sx={{ fontSize: 14 }} />}
                                label={event.event_time}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {event.duration && (
                              <Chip
                                label={`${event.duration}min`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Stack>
                        </Stack>
                        {event.location && (
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                            <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {event.location}
                            </Typography>
                          </Stack>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          )}
        </Stack>
      )}

      {/* ─── Add Event Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={eventDialogOpen}
        onClose={() => setEventDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>New Event</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={eventForm.title}
              onChange={(e) => updateEventForm({ title: e.target.value })}
              fullWidth
              required
              autoFocus
            />
            <TextField
              label="Description"
              value={eventForm.description}
              onChange={(e) => updateEventForm({ description: e.target.value })}
              fullWidth
              multiline
              minRows={2}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Date"
                type="date"
                value={eventForm.event_date}
                onChange={(e) => updateEventForm({ event_date: e.target.value })}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Time"
                type="time"
                value={eventForm.event_time}
                onChange={(e) => updateEventForm({ event_time: e.target.value })}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Duration (minutes)"
                type="number"
                value={eventForm.duration}
                onChange={(e) => updateEventForm({ duration: e.target.value })}
                fullWidth
              />
              <TextField
                label="Location"
                value={eventForm.location}
                onChange={(e) => updateEventForm({ location: e.target.value })}
                fullWidth
              />
            </Stack>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Symbol
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {BULLET_SYMBOLS.map((bs) => (
                  <Chip
                    key={bs.symbol}
                    label={`${bs.symbol} ${bs.label}`}
                    size="small"
                    onClick={() => updateEventForm({ bullet_symbol: bs.symbol })}
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      cursor: 'pointer',
                      ...(eventForm.bullet_symbol === bs.symbol
                        ? {
                            bgcolor: bulletSymbolColors[bs.symbol] ?? '#757575',
                            color: '#fff',
                          }
                        : {
                            bgcolor: alpha(bulletSymbolColors[bs.symbol] ?? '#757575', 0.1),
                            color: bulletSymbolColors[bs.symbol] ?? '#757575',
                            '&:hover': {
                              bgcolor: alpha(bulletSymbolColors[bs.symbol] ?? '#757575', 0.2),
                            },
                          }),
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEventDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateEvent}
            disabled={!eventForm.title.trim() || saving}
          >
            {saving ? 'Creating...' : 'Create Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPlaceholder(tab: BulletLogType): string {
  switch (tab) {
    case 'daily':
      return '• Buy groceries\n• Finish report\n× Called dentist\n○ Team standup 10am\n– Great weather today\n! Deploy by EOD';
    case 'weekly':
      return '• Weekly goals\n• Review last week\n○ Weekly team meeting\n– Reflections on the week';
    case 'monthly':
      return '• Monthly objectives\n• Review progress\n○ Monthly review meeting\n– Month-end reflections';
    case 'yearly':
      return '• Yearly goals and aspirations\n• Key milestones to achieve\n– Vision and long-term plans';
    case 'future':
      return '• Future goals and plans\n○ Upcoming events\n– Ideas for someday/maybe';
  }
}

function JournalLoadingSkeleton() {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Skeleton width="40%" height={32} sx={{ mb: 2 }} />
        <Skeleton height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" height={200} sx={{ mb: 2 }} />
        <Skeleton height={20} width="60%" />
      </CardContent>
    </Card>
  );
}

export function useJournalDialogEvent(onOpen: () => void) {
  useEffect(() => {
    const handler = () => onOpen();
    window.addEventListener('open-add-journal-dialog', handler);
    return () => window.removeEventListener('open-add-journal-dialog', handler);
  }, [onOpen]);
}
