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
  Paper,
  alpha,
  useTheme,
  useMediaQuery,
  IconButton,
  createFilterOptions,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
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
import { quadrantColors, priorityColors } from '../../theme/theme';
import { tagsApi, categoriesApi } from '../../services/api';

interface TagOption extends TagWithCount {
  inputValue?: string;
}

interface CategoryOption extends CategoryWithCount {
  inputValue?: string;
}

const tagFilter = createFilterOptions<TagOption>();
const categoryFilter = createFilterOptions<CategoryOption>();

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
    setCreatedTags([]);
    setCreatedCategories([]);
    onClose();
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

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 2 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        New Todo
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
        {/* Title */}
        <TextField
          autoFocus
          label="Title"
          value={form.title}
          onChange={(e) => {
            setForm({ ...form, title: e.target.value });
            if (titleError) setTitleError('');
          }}
          error={!!titleError}
          helperText={titleError}
          fullWidth
          required
        />

        {/* Description */}
        <TextField
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          fullWidth
          multiline
          rows={3}
        />

        {/* Row: Priority + Due Date */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={form.priority}
              label="Priority"
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
            >
              {Object.values(PRIORITY_LEVELS).map((p) => (
                <MenuItem key={p.level} value={p.level}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: p.color,
                      }}
                    />
                    {p.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Due Date"
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>

        {/* Row: Category + Energy Level */}
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
              <TextField {...params} label="Category" placeholder="Select or create..." />
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
                        sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: option.color }}
                      />
                    )}
                    {option.inputValue ? `Add "${option.inputValue}"` : option.name}
                  </Box>
                </li>
              );
            }}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Energy Level</InputLabel>
            <Select
              value={form.energy_required}
              label="Energy Level"
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
        </Stack>

        {/* Row: Time Estimate + Bullet Symbol */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Time Estimate (minutes)"
            type="number"
            value={form.time_estimate}
            onChange={(e) =>
              setForm({
                ...form,
                time_estimate: e.target.value ? Number(e.target.value) : '',
              })
            }
            fullWidth
            slotProps={{ htmlInput: { min: 1, max: 480 } }}
          />

          <FormControl fullWidth>
            <InputLabel>Bullet Symbol</InputLabel>
            <Select
              value={form.bullet_symbol}
              label="Bullet Symbol"
              onChange={(e) => setForm({ ...form, bullet_symbol: e.target.value as BulletSymbol })}
            >
              {BULLET_SYMBOLS.map((b) => (
                <MenuItem key={b.symbol} value={b.symbol}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      sx={{ fontWeight: 700, fontSize: 18, width: 24, textAlign: 'center' }}
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

        {/* Tags */}
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
            <TextField {...params} label="Tags" placeholder="Select or create tags..." />
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
                    bgcolor: alpha(typeof tag === 'string' ? '#757575' : tag.color, 0.2),
                    color: typeof tag === 'string' ? '#757575' : tag.color,
                    fontWeight: 500,
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
                      sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: option.color }}
                    />
                  )}
                  {option.inputValue ? `Add "${option.inputValue}"` : option.name}
                </Box>
              </li>
            );
          }}
        />

        {/* ─── Urgency / Importance Sliders + Quadrant Preview ──────────── */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Eisenhower Matrix Placement
          </Typography>

          <Stack spacing={3}>
            {/* Urgency slider */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Urgency
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {form.urgency_level} / 10
                </Typography>
              </Box>
              <Slider
                value={form.urgency_level}
                onChange={(_, val) => setForm({ ...form, urgency_level: val as number })}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 7, label: '7' },
                  { value: 10, label: '10' },
                ]}
                valueLabelDisplay="auto"
                sx={{
                  '& .MuiSlider-track': {
                    bgcolor: form.urgency_level >= 7 ? '#f44336' : '#ff9800',
                  },
                  '& .MuiSlider-thumb': {
                    bgcolor: form.urgency_level >= 7 ? '#f44336' : '#ff9800',
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  Not urgent
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Very urgent
                </Typography>
              </Box>
            </Box>

            {/* Importance slider */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Importance
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {form.importance_level} / 10
                </Typography>
              </Box>
              <Slider
                value={form.importance_level}
                onChange={(_, val) => setForm({ ...form, importance_level: val as number })}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 7, label: '7' },
                  { value: 10, label: '10' },
                ]}
                valueLabelDisplay="auto"
                sx={{
                  '& .MuiSlider-track': {
                    bgcolor: form.importance_level >= 7 ? '#1976d2' : '#90caf9',
                  },
                  '& .MuiSlider-thumb': {
                    bgcolor: form.importance_level >= 7 ? '#1976d2' : '#90caf9',
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  Not important
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Very important
                </Typography>
              </Box>
            </Box>

            {/* Quadrant Preview */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(quadrantInfo.color, 0.08),
                border: `2px solid ${alpha(quadrantInfo.color, 0.3)}`,
                textAlign: 'center',
              }}
            >
              <Chip
                label={`${quadrant} — ${quadrantInfo.label}`}
                sx={{
                  bgcolor: quadrantInfo.color,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  mb: 0.5,
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {quadrantInfo.description}
              </Typography>
            </Paper>
          </Stack>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || !form.title.trim()}
          sx={{
            borderColor: priorityColors[form.priority],
          }}
        >
          {submitting ? 'Creating...' : 'Create Todo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
