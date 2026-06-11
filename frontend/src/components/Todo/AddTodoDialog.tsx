import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Box,
  Chip,
  Stack,
  Autocomplete,
  alpha,
  useTheme,
  useMediaQuery,
  IconButton,
  createFilterOptions,
  Collapse,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarTodayOutlined as CalendarIcon,
} from '@mui/icons-material';
import type {
  CreateTodoRequest,
  Priority,
  EnergyLevel,
  BulletSymbol,
  CategoryWithCount,
  TagWithCount,
  EisenhowerQuadrant,
} from '@productivity-app/shared';
import {
  PRIORITY_LEVELS,
  ENERGY_LEVELS,
  EISENHOWER_QUADRANTS,
  BULLET_SYMBOLS,
  EisenhowerUtils,
} from '@productivity-app/shared';
import { priorityColors } from '../../theme/theme';
import { tagsApi, categoriesApi } from '../../services/api';

interface TagOption extends TagWithCount {
  inputValue?: string;
}

interface CategoryOption extends CategoryWithCount {
  inputValue?: string;
}

const tagFilter = createFilterOptions<TagOption>();
const categoryFilter = createFilterOptions<CategoryOption>();

/** Representative urgency/importance when picking a quadrant directly. */
const QUADRANT_PRESETS: Record<EisenhowerQuadrant, { urgency: number; importance: number }> = {
  Q1: { urgency: 8, importance: 8 },
  Q2: { urgency: 3, importance: 8 },
  Q3: { urgency: 8, importance: 3 },
  Q4: { urgency: 3, importance: 3 },
};

interface AddTodoDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTodoRequest) => Promise<boolean>;
  categories: CategoryWithCount[];
  tags: TagWithCount[];
}

const INITIAL_STATE = {
  title: '',
  description: '',
  priority: 'medium' as Priority,
  due_date: '',
  category_id: '' as number | '',
  urgency_level: 5,
  importance_level: 5,
  bullet_symbol: '•' as BulletSymbol,
  time_estimate: '' as number | '',
  energy_required: '' as EnergyLevel | '',
  tag_ids: [] as number[],
};

export function AddTodoDialog({ open, onClose, onSubmit, categories, tags }: AddTodoDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [form, setForm] = useState(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [showFineTune, setShowFineTune] = useState(false);
  const [createdTags, setCreatedTags] = useState<TagWithCount[]>([]);
  const [createdCategories, setCreatedCategories] = useState<CategoryWithCount[]>([]);

  const allTags = useMemo(() => {
    const propIds = new Set(tags.map((t) => t.id));
    return [...tags, ...createdTags.filter((t) => !propIds.has(t.id))];
  }, [tags, createdTags]);

  const allCategories = useMemo(() => {
    const propIds = new Set(categories.map((c) => c.id));
    return [...categories, ...createdCategories.filter((c) => !propIds.has(c.id))];
  }, [categories, createdCategories]);

  const quadrant: EisenhowerQuadrant = useMemo(
    () => EisenhowerUtils.calculateQuadrant(form.urgency_level, form.importance_level),
    [form.urgency_level, form.importance_level]
  );

  const quadrantInfo = EISENHOWER_QUADRANTS[quadrant];

  const handleClose = () => {
    setForm(INITIAL_STATE);
    setTitleError('');
    setShowMore(false);
    setShowFineTune(false);
    setCreatedTags([]);
    setCreatedCategories([]);
    onClose();
  };

  const handleQuadrantSelect = (q: EisenhowerQuadrant) => {
    const preset = QUADRANT_PRESETS[q];
    setForm((prev) => ({
      ...prev,
      urgency_level: preset.urgency,
      importance_level: preset.importance,
    }));
  };

  const handleCreateCategory = async (name: string): Promise<CategoryWithCount | null> => {
    try {
      const res = await categoriesApi.create({ name });
      if (res.success && res.data) {
        const newCat: CategoryWithCount = { ...res.data, todo_count: 0 };
        setCreatedCategories((prev) => [...prev, newCat]);
        return newCat;
      }
    } catch {
      /* category creation failed — silently ignore */
    }
    return null;
  };

  const handleCategoryChange = async (
    _: React.SyntheticEvent,
    newValue: string | CategoryOption | null
  ) => {
    if (newValue === null) {
      setForm((prev) => ({ ...prev, category_id: '' }));
    } else if (typeof newValue === 'string') {
      const cat = await handleCreateCategory(newValue);
      if (cat) setForm((prev) => ({ ...prev, category_id: cat.id }));
    } else if (newValue.inputValue) {
      const cat = await handleCreateCategory(newValue.inputValue);
      if (cat) setForm((prev) => ({ ...prev, category_id: cat.id }));
    } else {
      setForm((prev) => ({ ...prev, category_id: newValue.id }));
    }
  };

  const handleCreateTag = async (name: string): Promise<TagWithCount | null> => {
    try {
      const res = await tagsApi.create({ name });
      if (res.success && res.data) {
        const newTag: TagWithCount = { ...res.data, usage_count: 0 };
        setCreatedTags((prev) => [...prev, newTag]);
        return newTag;
      }
    } catch {
      /* tag creation failed (e.g. duplicate) — silently ignore */
    }
    return null;
  };

  const handleTagChange = async (_: React.SyntheticEvent, newValue: (string | TagOption)[]) => {
    const resolvedIds: number[] = [];
    for (const item of newValue) {
      if (typeof item === 'string') {
        const tag = await handleCreateTag(item);
        if (tag) resolvedIds.push(tag.id);
      } else if (item.inputValue) {
        const tag = await handleCreateTag(item.inputValue);
        if (tag) resolvedIds.push(tag.id);
      } else {
        resolvedIds.push(item.id);
      }
    }
    setForm((prev) => ({ ...prev, tag_ids: resolvedIds }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setTitleError('Title is required');
      return;
    }
    setSubmitting(true);
    const payload: CreateTodoRequest = {
      title: form.title.trim(),
      ...(form.description && { description: form.description.trim() }),
      priority: form.priority,
      ...(form.due_date && { due_date: form.due_date }),
      ...(form.category_id && { category_id: form.category_id as number }),
      urgency_level: form.urgency_level,
      importance_level: form.importance_level,
      bullet_symbol: form.bullet_symbol,
      ...(form.time_estimate && { time_estimate: form.time_estimate as number }),
      ...(form.energy_required && { energy_required: form.energy_required as EnergyLevel }),
      ...(form.tag_ids.length > 0 && { tag_ids: form.tag_ids }),
    };

    const success = await onSubmit(payload);
    setSubmitting(false);
    if (success) handleClose();
  };

  const selectedTags = allTags.filter((t) => form.tag_ids.includes(t.id));
  const selectedCategory = allCategories.find((c) => c.id === form.category_id) ?? null;

  const priorityOptions = Object.values(PRIORITY_LEVELS);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
          fontWeight: 600,
          fontSize: '1.125rem',
        }}
      >
        New Todo
        <IconButton size="small" onClick={handleClose} aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 0, pb: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* ── Essential: title + notes ─────────────────────────────────── */}
        <TextField
          autoFocus
          placeholder="What needs to be done?"
          value={form.title}
          onChange={(e) => {
            setForm({ ...form, title: e.target.value });
            if (titleError) setTitleError('');
          }}
          error={!!titleError}
          helperText={titleError}
          fullWidth
          required
          variant="standard"
          slotProps={{
            input: {
              sx: { fontSize: '1.25rem', fontWeight: 500, py: 0.5 },
            },
          }}
        />

        <TextField
          placeholder="Add notes (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          fullWidth
          multiline
          minRows={1}
          maxRows={3}
          variant="standard"
          slotProps={{
            input: { sx: { fontSize: '0.9375rem', color: 'text.secondary' } },
          }}
        />

        {/* ── Quick actions: due date + priority chips ───────────────────── */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5,
            py: 1,
            px: 1.5,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
          }}
        >
          <TextField
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            size="small"
            variant="outlined"
            slotProps={{
              input: {
                startAdornment: (
                  <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 0.5 }} />
                ),
                sx: { fontSize: '0.8125rem' },
              },
              inputLabel: { shrink: true },
            }}
            label="Due"
            sx={{ width: { xs: '100%', sm: 160 } }}
          />

          <ToggleButtonGroup
            value={form.priority}
            exclusive
            onChange={(_, val: Priority | null) => {
              if (val) setForm({ ...form, priority: val });
            }}
            size="small"
            aria-label="Priority"
            sx={{ flex: 1, flexWrap: 'wrap' }}
          >
            {priorityOptions.map((p) => (
              <ToggleButton
                key={p.level}
                value={p.level}
                aria-label={p.label}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.8125rem',
                  textTransform: 'none',
                  borderColor: alpha(p.color, 0.3),
                  '&.Mui-selected': {
                    bgcolor: alpha(p.color, 0.12),
                    color: p.color,
                    fontWeight: 600,
                    '&:hover': { bgcolor: alpha(p.color, 0.18) },
                  },
                }}
              >
                {p.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* ── Expandable: optional details ───────────────────────────────── */}
        <Button
          onClick={() => setShowMore((v) => !v)}
          endIcon={
            <ExpandMoreIcon
              sx={{
                transform: showMore ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          }
          sx={{
            alignSelf: 'flex-start',
            textTransform: 'none',
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: '0.875rem',
            px: 0,
            minWidth: 0,
            '&:hover': { bgcolor: 'transparent', color: 'primary.main' },
          }}
        >
          {showMore ? 'Hide details' : 'Add details'}
        </Button>

        <Collapse in={showMore}>
          <Stack spacing={2.5} sx={{ pb: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Autocomplete<CategoryOption, false, false, true>
                freeSolo
                selectOnFocus
                clearOnBlur
                handleHomeEndKeys
                options={allCategories as CategoryOption[]}
                value={selectedCategory as CategoryOption | null}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  if (option.inputValue) return option.inputValue;
                  return option.name;
                }}
                filterOptions={(options, params) => {
                  const filtered = categoryFilter(options, params);
                  const { inputValue } = params;
                  if (
                    inputValue !== '' &&
                    !allCategories.some((c) => c.name.toLowerCase() === inputValue.toLowerCase())
                  ) {
                    filtered.push({
                      inputValue,
                      name: `Add "${inputValue}"`,
                      id: -1,
                      user_id: 0,
                      color: '#1976d2',
                      icon: null,
                      description: null,
                      todo_count: 0,
                      created_at: '',
                      updated_at: '',
                    });
                  }
                  return filtered;
                }}
                onChange={handleCategoryChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    placeholder="Select or create..."
                    size="small"
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...rest } = props;
                  return (
                    <li key={key} {...rest}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.inputValue ? (
                          <AddIcon fontSize="small" color="primary" />
                        ) : (
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              bgcolor: option.color,
                            }}
                          />
                        )}
                        {option.inputValue ? `Add "${option.inputValue}"` : option.name}
                      </Box>
                    </li>
                  );
                }}
                fullWidth
              />

              <Autocomplete<TagOption, true, false, true>
                multiple
                freeSolo
                selectOnFocus
                clearOnBlur
                handleHomeEndKeys
                options={allTags as TagOption[]}
                value={selectedTags as TagOption[]}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  if (option.inputValue) return option.inputValue;
                  return option.name;
                }}
                filterOptions={(options, params) => {
                  const filtered = tagFilter(options, params);
                  const { inputValue } = params;
                  if (
                    inputValue !== '' &&
                    !allTags.some((t) => t.name.toLowerCase() === inputValue.toLowerCase())
                  ) {
                    filtered.push({
                      inputValue,
                      name: `Add "${inputValue}"`,
                      id: -1,
                      user_id: 0,
                      color: '#757575',
                      usage_count: 0,
                      created_at: '',
                    });
                  }
                  return filtered;
                }}
                onChange={handleTagChange}
                renderInput={(params) => (
                  <TextField {...params} label="Tags" placeholder="Add tags..." size="small" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((tag, index) => {
                    const { key, ...chipProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={typeof tag === 'string' ? tag : tag.name}
                        size="small"
                        {...chipProps}
                        sx={{
                          bgcolor: alpha(typeof tag === 'string' ? '#757575' : tag.color, 0.15),
                          color: typeof tag === 'string' ? '#757575' : tag.color,
                          fontWeight: 500,
                          height: 24,
                        }}
                      />
                    );
                  })
                }
                renderOption={(props, option) => {
                  const { key, ...rest } = props;
                  return (
                    <li key={key} {...rest}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.inputValue ? (
                          <AddIcon fontSize="small" color="primary" />
                        ) : (
                          <Box
                            sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: option.color }}
                          />
                        )}
                        {option.inputValue ? `Add "${option.inputValue}"` : option.name}
                      </Box>
                    </li>
                  );
                }}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Energy</InputLabel>
                <Select
                  value={form.energy_required}
                  label="Energy"
                  onChange={(e) =>
                    setForm({ ...form, energy_required: e.target.value as EnergyLevel | '' })
                  }
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {Object.values(ENERGY_LEVELS).map((e) => (
                    <MenuItem key={e.level} value={e.level}>
                      {e.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Est. minutes"
                type="number"
                value={form.time_estimate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    time_estimate: e.target.value ? Number(e.target.value) : '',
                  })
                }
                fullWidth
                size="small"
                slotProps={{ htmlInput: { min: 1, max: 480 } }}
              />

              <FormControl fullWidth size="small">
                <InputLabel>Symbol</InputLabel>
                <Select
                  value={form.bullet_symbol}
                  label="Symbol"
                  onChange={(e) =>
                    setForm({ ...form, bullet_symbol: e.target.value as BulletSymbol })
                  }
                >
                  {BULLET_SYMBOLS.map((b) => (
                    <MenuItem key={b.symbol} value={b.symbol}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          sx={{ fontWeight: 700, fontSize: 16, width: 20, textAlign: 'center' }}
                        >
                          {b.symbol}
                        </Typography>
                        {b.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* ── Eisenhower: compact quadrant picker ──────────────────────── */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1.5,
                }}
              >
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  Matrix placement
                </Typography>
                <Chip
                  label={`${quadrant} · ${quadrantInfo.label}`}
                  size="small"
                  sx={{
                    bgcolor: alpha(quadrantInfo.color, 0.12),
                    color: quadrantInfo.color,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    height: 24,
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1,
                }}
              >
                {(['Q2', 'Q1', 'Q4', 'Q3'] as EisenhowerQuadrant[]).map((q) => {
                  const info = EISENHOWER_QUADRANTS[q];
                  const selected = quadrant === q;
                  return (
                    <Button
                      key={q}
                      variant={selected ? 'contained' : 'outlined'}
                      onClick={() => handleQuadrantSelect(q)}
                      aria-label={`${q} ${info.label}`}
                      aria-pressed={selected}
                      sx={{
                        py: 1.25,
                        px: 1,
                        textTransform: 'none',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        borderRadius: 2,
                        borderColor: alpha(info.color, selected ? 1 : 0.25),
                        bgcolor: selected ? info.color : alpha(info.color, 0.04),
                        color: selected ? '#fff' : 'text.primary',
                        boxShadow: 'none',
                        '&:hover': {
                          bgcolor: selected ? info.color : alpha(info.color, 0.1),
                          boxShadow: 'none',
                        },
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{ opacity: selected ? 0.9 : 0.7 }}
                      >
                        {q}
                      </Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                        {info.label}
                      </Typography>
                    </Button>
                  );
                })}
              </Box>

              <Button
                onClick={() => setShowFineTune((v) => !v)}
                size="small"
                sx={{
                  mt: 1,
                  textTransform: 'none',
                  color: 'text.secondary',
                  fontSize: '0.8125rem',
                  px: 0,
                  minWidth: 0,
                }}
              >
                {showFineTune ? 'Hide fine-tune' : 'Fine-tune urgency & importance'}
              </Button>

              <Collapse in={showFineTune}>
                <Stack spacing={2} sx={{ mt: 1.5 }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Urgency
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {form.urgency_level}/10
                      </Typography>
                    </Box>
                    <Slider
                      value={form.urgency_level}
                      onChange={(_, val) => setForm({ ...form, urgency_level: val as number })}
                      min={1}
                      max={10}
                      step={1}
                      valueLabelDisplay="auto"
                      size="small"
                      sx={{
                        '& .MuiSlider-track': {
                          bgcolor: form.urgency_level >= 7 ? '#f44336' : '#ff9800',
                        },
                        '& .MuiSlider-thumb': {
                          bgcolor: form.urgency_level >= 7 ? '#f44336' : '#ff9800',
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Importance
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {form.importance_level}/10
                      </Typography>
                    </Box>
                    <Slider
                      value={form.importance_level}
                      onChange={(_, val) => setForm({ ...form, importance_level: val as number })}
                      min={1}
                      max={10}
                      step={1}
                      valueLabelDisplay="auto"
                      size="small"
                      sx={{
                        '& .MuiSlider-track': {
                          bgcolor: form.importance_level >= 7 ? '#1976d2' : '#90caf9',
                        },
                        '& .MuiSlider-thumb': {
                          bgcolor: form.importance_level >= 7 ? '#1976d2' : '#90caf9',
                        },
                      }}
                    />
                  </Box>
                </Stack>
              </Collapse>
            </Box>
          </Stack>
        </Collapse>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          justifyContent: 'space-between',
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        {!showMore && (
          <Chip
            label={`${quadrant} · ${quadrantInfo.label}`}
            size="small"
            variant="outlined"
            sx={{
              borderColor: alpha(quadrantInfo.color, 0.4),
              color: quadrantInfo.color,
              fontWeight: 500,
              fontSize: '0.75rem',
            }}
          />
        )}
        {!showMore && <Box sx={{ flex: 1 }} />}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleClose} disabled={submitting} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting || !form.title.trim()}
            disableElevation
            sx={{ px: 2.5, bgcolor: priorityColors[form.priority] }}
          >
            {submitting ? 'Creating…' : 'Create Todo'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
