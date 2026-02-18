import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Chip,
  Alert,
  Skeleton,
  Card,
  CardContent,
  CardActionArea,
  IconButton,
  Tooltip,
  InputAdornment,
  Autocomplete,
  Collapse,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Pagination,
  alpha,
  useTheme,
  type Theme,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Publish as PublishIcon,
  ArrowBack,
  Save as SaveIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Article as ArticleIcon,
  Timer as TimerIcon,
  TextFields as WordCountIcon,
  Code as CodeIcon,
  Visibility as PreviewIcon,
  VerticalSplit as LiveIcon,
  MoreVert,
  Archive as ArchiveIcon,
  DraftsOutlined as DraftIcon,
  CheckCircle as PublishedIcon,
  RemoveRedEye as ViewsIcon,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import MDEditor from '@uiw/react-md-editor';
import { format } from 'date-fns';
import type {
  BlogPostWithRelations,
  BlogPostStatus,
  CreateBlogPostRequest,
  UpdateBlogPostRequest,
} from '@productivity-app/shared';
import { TextUtils } from '@productivity-app/shared';
import { useBlog } from '../../hooks/useBlog';

// ─── Blog status config ──────────────────────────────────────────────────────

const BLOG_STATUS_CONFIG: Record<BlogPostStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: '#78909c', icon: <DraftIcon sx={{ fontSize: 16 }} /> },
  published: { label: 'Published', color: '#4caf50', icon: <PublishedIcon sx={{ fontSize: 16 }} /> },
  archived: { label: 'Archived', color: '#ff9800', icon: <ArchiveIcon sx={{ fontSize: 16 }} /> },
};

const STATUS_FILTERS: { value: BlogPostStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

// ─── Editor form ─────────────────────────────────────────────────────────────

interface EditorFormState {
  title: string;
  content: string;
  status: BlogPostStatus;
  excerpt: string;
  tag_ids: number[];
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
}

const INITIAL_EDITOR_FORM: EditorFormState = {
  title: '',
  content: '',
  status: 'draft',
  excerpt: '',
  tag_ids: [],
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function BlogView() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const postId = slug ? parseInt(slug, 10) : null;

  const {
    posts, currentPost, loading, saving, error, filters,
    page, meta, tags, setFilters, resetFilters, setPage,
    refresh, fetchPost, clearCurrentPost, createPost,
    updatePost, deletePost, publishPost, stats,
  } = useBlog();

  const [editing, setEditing] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [form, setForm] = useState<EditorFormState>(INITIAL_EDITOR_FORM);
  const [editorPreview, setEditorPreview] = useState<'edit' | 'preview' | 'live'>('live');
  const [searchInput, setSearchInput] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showSeo, setShowSeo] = useState(false);

  // FAB listener
  useBlogDialogEvent(useCallback(() => {
    setEditingPostId(null);
    setForm(INITIAL_EDITOR_FORM);
    setEditing(true);
    if (postId) navigate('/blog');
  }, [postId, navigate]));

  // Load post when URL has an ID
  useEffect(() => {
    if (postId && !isNaN(postId)) {
      fetchPost(postId);
    } else {
      clearCurrentPost();
    }
  }, [postId, fetchPost, clearCurrentPost]);

  // Reset editing when navigating away from a post
  useEffect(() => {
    if (!postId) {
      setEditing(false);
      setEditingPostId(null);
    }
  }, [postId]);

  const viewMode = editing ? 'editor' : postId ? 'reader' : 'list';

  const wordCount = useMemo(() => TextUtils.wordCount(form.content), [form.content]);
  const readingTime = useMemo(() => TextUtils.readingTimeLabel(form.content), [form.content]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const updateForm = (partial: Partial<EditorFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (searchTimeout) clearTimeout(searchTimeout);
      const timeout = setTimeout(() => {
        setFilters({ search: value });
      }, 350);
      setSearchTimeout(timeout);
    },
    [setFilters, searchTimeout],
  );

  const handleNewPost = useCallback(() => {
    setEditingPostId(null);
    setForm(INITIAL_EDITOR_FORM);
    setEditing(true);
  }, []);

  const handleEditPost = useCallback((post: BlogPostWithRelations) => {
    setEditingPostId(post.id);
    setForm({
      title: post.title,
      content: post.content || '',
      status: post.status,
      excerpt: post.excerpt || '',
      tag_ids: post.tags?.map((t) => t.id) || [],
      seo_title: post.seo_title || '',
      seo_description: post.seo_description || '',
      seo_keywords: post.seo_keywords || '',
    });
    setEditing(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditing(false);
    setEditingPostId(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) return;

    const payload: CreateBlogPostRequest & UpdateBlogPostRequest = {
      title: form.title.trim(),
      content: form.content,
      content_type: 'markdown',
      status: form.status,
      excerpt: form.excerpt || undefined,
      tag_ids: form.tag_ids.length > 0 ? form.tag_ids : undefined,
      seo_title: form.seo_title || undefined,
      seo_description: form.seo_description || undefined,
      seo_keywords: form.seo_keywords || undefined,
    };

    if (editingPostId) {
      const success = await updatePost(editingPostId, payload);
      if (success) {
        setEditing(false);
        setEditingPostId(null);
      }
    } else {
      const id = await createPost(payload);
      if (id !== false) {
        setEditingPostId(id);
        setEditing(false);
        navigate(`/blog/${id}`);
      }
    }
  }, [form, editingPostId, updatePost, createPost, navigate]);

  const handlePublish = useCallback(async (id: number) => {
    const success = await publishPost(id);
    if (success && viewMode === 'editor') {
      setEditing(false);
      setEditingPostId(null);
    }
  }, [publishPost, viewMode]);

  const handleDelete = useCallback(async () => {
    if (confirmDeleteId === null) return;
    const success = await deletePost(confirmDeleteId);
    if (success) {
      setConfirmDeleteId(null);
      setEditing(false);
      setEditingPostId(null);
      navigate('/blog');
    }
  }, [confirmDeleteId, deletePost, navigate]);

  const handleViewPost = useCallback((id: number) => {
    navigate(`/blog/${id}`);
  }, [navigate]);

  const handleBackToList = useCallback(() => {
    setEditing(false);
    setEditingPostId(null);
    clearCurrentPost();
    navigate('/blog');
  }, [navigate, clearCurrentPost]);

  const hasActiveFilters = filters.status !== '' || filters.search !== '';

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {viewMode === 'editor' && (
        <BlogEditorView
          theme={theme}
          form={form}
          updateForm={updateForm}
          editorPreview={editorPreview}
          setEditorPreview={setEditorPreview}
          tags={tags}
          wordCount={wordCount}
          readingTime={readingTime}
          saving={saving}
          editingPostId={editingPostId}
          showSeo={showSeo}
          setShowSeo={setShowSeo}
          onSave={handleSave}
          onPublish={handlePublish}
          onCancel={handleCancelEdit}
          onDelete={(id) => setConfirmDeleteId(id)}
        />
      )}

      {viewMode === 'reader' && (
        currentPost ? (
          <BlogReaderView
            theme={theme}
            post={currentPost}
            onBack={handleBackToList}
            onEdit={() => handleEditPost(currentPost)}
            onPublish={() => handlePublish(currentPost.id)}
            onDelete={() => setConfirmDeleteId(currentPost.id)}
          />
        ) : loading ? (
          <BlogLoadingSkeleton />
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary" gutterBottom>
              Post not found
            </Typography>
            <Button onClick={handleBackToList} startIcon={<ArrowBack />}>
              Back to Posts
            </Button>
          </Paper>
        )
      )}

      {viewMode === 'list' && (
        <>
          {/* Quick Stats */}
          <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
            <StatChip icon={<ArticleIcon sx={{ fontSize: 16 }} />} label={`${stats.total} Total`} color={theme.palette.primary.main} />
            <StatChip icon={<PublishedIcon sx={{ fontSize: 16 }} />} label={`${stats.published} Published`} color="#4caf50" />
            <StatChip icon={<DraftIcon sx={{ fontSize: 16 }} />} label={`${stats.draft} Drafts`} color="#78909c" />
            <StatChip icon={<ArchiveIcon sx={{ fontSize: 16 }} />} label={`${stats.archived} Archived`} color="#ff9800" />
          </Stack>

          {/* Search + Filters */}
          <Paper elevation={0} sx={{ p: 2, mb: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TextField
                placeholder="Search posts..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                size="small"
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: searchInput ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => { setSearchInput(''); setFilters({ search: '' }); }}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
              />
              <Tooltip title="Toggle filters">
                <IconButton onClick={() => setShowFilters(!showFilters)} color={showFilters || hasActiveFilters ? 'primary' : 'default'}>
                  <FilterIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh">
                <IconButton onClick={refresh}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button variant="contained" size="small" onClick={handleNewPost} sx={{ whiteSpace: 'nowrap' }}>
                New Post
              </Button>
            </Stack>

            <Collapse in={showFilters}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                  Status
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {STATUS_FILTERS.map((s) => {
                    const isSelected = filters.status === s.value;
                    const color = s.value ? BLOG_STATUS_CONFIG[s.value].color : theme.palette.primary.main;
                    return (
                      <Chip
                        key={s.value || 'all'}
                        label={s.label}
                        size="small"
                        onClick={() => setFilters({ status: isSelected ? '' : s.value })}
                        sx={{
                          fontWeight: 500,
                          ...(isSelected
                            ? { bgcolor: color, color: '#fff' }
                            : { bgcolor: alpha(color, 0.1), color, '&:hover': { bgcolor: alpha(color, 0.2) } }),
                        }}
                      />
                    );
                  })}
                </Stack>

                {hasActiveFilters && (
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label="Clear all filters"
                      size="small"
                      onDelete={() => { resetFilters(); setSearchInput(''); }}
                      onClick={() => { resetFilters(); setSearchInput(''); }}
                      color="default"
                      variant="outlined"
                    />
                  </Box>
                )}
              </Box>
            </Collapse>
          </Paper>

          {/* Post List */}
          {loading ? (
            <BlogListSkeleton />
          ) : posts.length === 0 ? (
            <Card>
              <CardContent sx={{ py: 6, textAlign: 'center' }}>
                <ArticleIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {hasActiveFilters ? 'No posts match your filters' : 'No blog posts yet'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {hasActiveFilters ? 'Try adjusting your filters or search.' : 'Start writing your first blog post.'}
                </Typography>
                {!hasActiveFilters && (
                  <Button variant="contained" startIcon={<EditIcon />} onClick={handleNewPost}>
                    Write First Post
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    theme={theme}
                    onView={() => handleViewPost(post.id)}
                    onEdit={() => handleEditPost(post)}
                    onPublish={() => handlePublish(post.id)}
                    onDelete={() => setConfirmDeleteId(post.id)}
                  />
                ))}
              </Box>

              {meta && meta.total > PAGE_LIMIT && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={Math.ceil(meta.total / meta.limit)}
                    page={page}
                    onChange={(_, p) => setPage(p)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteId !== null} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>Delete Post</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this post? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

const PAGE_LIMIT = 20;

// ─── Blog Editor View ────────────────────────────────────────────────────────

function BlogEditorView({
  theme,
  form,
  updateForm,
  editorPreview,
  setEditorPreview,
  tags,
  wordCount,
  readingTime,
  saving,
  editingPostId,
  showSeo,
  setShowSeo,
  onSave,
  onPublish,
  onCancel,
  onDelete,
}: {
  theme: Theme;
  form: EditorFormState;
  updateForm: (partial: Partial<EditorFormState>) => void;
  editorPreview: 'edit' | 'preview' | 'live';
  setEditorPreview: (v: 'edit' | 'preview' | 'live') => void;
  tags: { id: number; name: string; color: string }[];
  wordCount: number;
  readingTime: string;
  saving: boolean;
  editingPostId: number | null;
  showSeo: boolean;
  setShowSeo: (v: boolean) => void;
  onSave: () => void;
  onPublish: (id: number) => void;
  onCancel: () => void;
  onDelete: (id: number) => void;
}) {
  const selectedTags = tags.filter((t) => form.tag_ids.includes(t.id));

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={onCancel}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {editingPostId ? 'Edit Post' : 'New Post'}
          </Typography>
          <Chip
            label={BLOG_STATUS_CONFIG[form.status].label}
            size="small"
            sx={{
              bgcolor: BLOG_STATUS_CONFIG[form.status].color,
              color: '#fff',
              fontWeight: 600,
            }}
          />
        </Stack>
        <Stack direction="row" spacing={1}>
          {editingPostId && form.status === 'draft' && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<PublishIcon />}
              onClick={() => onPublish(editingPostId)}
              disabled={saving}
            >
              Publish
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={onSave}
            disabled={saving || !form.title.trim()}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Stack>
      </Stack>

      {/* Title */}
      <TextField
        placeholder="Post title..."
        value={form.title}
        onChange={(e) => updateForm({ title: e.target.value })}
        fullWidth
        variant="standard"
        sx={{
          mb: 2,
          '& .MuiInputBase-input': { fontSize: '1.75rem', fontWeight: 600 },
        }}
      />

      {/* Editor Mode Toggle */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <ToggleButtonGroup
          value={editorPreview}
          exclusive
          onChange={(_, val) => val && setEditorPreview(val)}
          size="small"
        >
          <ToggleButton value="edit">
            <Tooltip title="Edit"><CodeIcon fontSize="small" /></Tooltip>
          </ToggleButton>
          <ToggleButton value="live">
            <Tooltip title="Live Preview"><LiveIcon fontSize="small" /></Tooltip>
          </ToggleButton>
          <ToggleButton value="preview">
            <Tooltip title="Preview"><PreviewIcon fontSize="small" /></Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" spacing={2}>
          <Chip
            icon={<WordCountIcon sx={{ fontSize: 14 }} />}
            label={`${wordCount} words`}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<TimerIcon sx={{ fontSize: 14 }} />}
            label={readingTime}
            size="small"
            variant="outlined"
          />
        </Stack>
      </Stack>

      {/* Markdown Editor */}
      <Box data-color-mode={theme.palette.mode} sx={{ mb: 3 }}>
        <MDEditor
          value={form.content}
          onChange={(val) => updateForm({ content: val || '' })}
          preview={editorPreview}
          height={450}
          visibleDragbar={false}
        />
      </Box>

      {/* Meta Fields */}
      <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Post Details
        </Typography>

        <Stack spacing={2.5}>
          <TextField
            label="Excerpt"
            value={form.excerpt}
            onChange={(e) => updateForm({ excerpt: e.target.value })}
            multiline
            minRows={2}
            maxRows={4}
            fullWidth
            size="small"
            placeholder="Brief description for post listing..."
          />

          <Autocomplete
            multiple
            options={tags}
            getOptionLabel={(opt) => opt.name}
            value={selectedTags}
            onChange={(_, newValue) => updateForm({ tag_ids: newValue.map((t) => t.id) })}
            renderInput={(params) => <TextField {...params} label="Tags" size="small" placeholder="Select tags..." />}
            renderTags={(value, getTagProps) =>
              value.map((opt, idx) => {
                const { key, ...rest } = getTagProps({ index: idx });
                return (
                  <Chip
                    key={key}
                    label={opt.name}
                    size="small"
                    {...rest}
                    sx={{ bgcolor: opt.color || undefined, color: opt.color ? '#fff' : undefined }}
                  />
                );
              })
            }
            size="small"
          />

          {/* Status selector */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
              Status
            </Typography>
            <Stack direction="row" spacing={0.75}>
              {(['draft', 'published', 'archived'] as BlogPostStatus[]).map((s) => {
                const cfg = BLOG_STATUS_CONFIG[s];
                const isSelected = form.status === s;
                return (
                  <Chip
                    key={s}
                    label={cfg.label}
                    size="small"
                    onClick={() => updateForm({ status: s })}
                    sx={{
                      fontWeight: 500,
                      ...(isSelected
                        ? { bgcolor: cfg.color, color: '#fff' }
                        : { bgcolor: alpha(cfg.color, 0.1), color: cfg.color, '&:hover': { bgcolor: alpha(cfg.color, 0.2) } }),
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        </Stack>

        {/* SEO Section */}
        <Divider sx={{ my: 2 }} />
        <Box
          onClick={() => setShowSeo(!showSeo)}
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
            SEO Settings
          </Typography>
          {showSeo ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </Box>
        <Collapse in={showSeo}>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="SEO Title"
              value={form.seo_title}
              onChange={(e) => updateForm({ seo_title: e.target.value })}
              fullWidth
              size="small"
              placeholder="Custom title for search engines"
            />
            <TextField
              label="SEO Description"
              value={form.seo_description}
              onChange={(e) => updateForm({ seo_description: e.target.value })}
              multiline
              minRows={2}
              maxRows={3}
              fullWidth
              size="small"
              placeholder="Brief description for search engines"
            />
            <TextField
              label="SEO Keywords"
              value={form.seo_keywords}
              onChange={(e) => updateForm({ seo_keywords: e.target.value })}
              fullWidth
              size="small"
              placeholder="Comma-separated keywords"
            />
          </Stack>
        </Collapse>
      </Paper>

      {/* Delete Button */}
      {editingPostId && (
        <Box sx={{ mt: 2 }}>
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => onDelete(editingPostId)}
            size="small"
          >
            Delete Post
          </Button>
        </Box>
      )}
    </Box>
  );
}

// ─── Blog Reader View ────────────────────────────────────────────────────────

function BlogReaderView({
  theme,
  post,
  onBack,
  onEdit,
  onPublish,
  onDelete,
}: {
  theme: Theme;
  post: BlogPostWithRelations;
  onBack: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onDelete: () => void;
}) {
  const statusCfg = BLOG_STATUS_CONFIG[post.status];

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <IconButton onClick={onBack}>
          <ArrowBack />
        </IconButton>
        <Stack direction="row" spacing={1}>
          {post.status === 'draft' && (
            <Button variant="outlined" color="success" startIcon={<PublishIcon />} onClick={onPublish} size="small">
              Publish
            </Button>
          )}
          <Button variant="outlined" startIcon={<EditIcon />} onClick={onEdit} size="small">
            Edit
          </Button>
          <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={onDelete} size="small">
            Delete
          </Button>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
        {/* Title + Status */}
        <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, flex: 1 }}>
            {post.title}
          </Typography>
          <Chip
            label={statusCfg.label}
            size="small"
            sx={{ bgcolor: statusCfg.color, color: '#fff', fontWeight: 600, flexShrink: 0 }}
          />
        </Stack>

        {/* Metadata */}
        <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
          {post.published_at && (
            <Chip
              icon={<PublishedIcon sx={{ fontSize: 14 }} />}
              label={format(new Date(post.published_at), 'MMM d, yyyy')}
              size="small"
              variant="outlined"
            />
          )}
          <Chip
            icon={<TimerIcon sx={{ fontSize: 14 }} />}
            label={post.reading_time ? `${post.reading_time} min read` : '< 1 min read'}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<WordCountIcon sx={{ fontSize: 14 }} />}
            label={`${post.word_count ?? 0} words`}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<ViewsIcon sx={{ fontSize: 14 }} />}
            label={`${post.view_count} views`}
            size="small"
            variant="outlined"
          />
          {post.category_name && (
            <Chip label={post.category_name} size="small" color="primary" variant="outlined" />
          )}
        </Stack>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <Stack direction="row" spacing={0.75} sx={{ mb: 3, flexWrap: 'wrap', gap: 0.5 }}>
            {post.tags.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.name}
                size="small"
                sx={{
                  bgcolor: tag.color ? alpha(tag.color, 0.15) : undefined,
                  color: tag.color || undefined,
                  fontWeight: 500,
                }}
              />
            ))}
          </Stack>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* Content */}
        {post.content ? (
          <Box data-color-mode={theme.palette.mode} sx={{ '& .wmde-markdown': { background: 'transparent' } }}>
            <MDEditor.Markdown source={post.content} style={{ whiteSpace: 'pre-wrap' }} />
          </Box>
        ) : (
          <Typography color="text.secondary" sx={{ fontStyle: 'italic', py: 4, textAlign: 'center' }}>
            No content yet. Click "Edit" to start writing.
          </Typography>
        )}

        {/* Footer metadata */}
        <Divider sx={{ mt: 4, mb: 2 }} />
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            Created {format(new Date(post.created_at), 'MMM d, yyyy · h:mm a')}
          </Typography>
          {post.updated_at && post.updated_at !== post.created_at && (
            <Typography variant="caption" color="text.secondary">
              Updated {format(new Date(post.updated_at), 'MMM d, yyyy · h:mm a')}
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}

// ─── Post Card ───────────────────────────────────────────────────────────────

function PostCard({
  post,
  theme,
  onView,
  onEdit,
  onPublish,
  onDelete,
}: {
  post: BlogPostWithRelations;
  theme: Theme;
  onView: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onDelete: () => void;
}) {
  const statusCfg = BLOG_STATUS_CONFIG[post.status];
  const excerpt = post.excerpt || TextUtils.excerpt(post.content, 120);

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardActionArea onClick={onView} sx={{ flex: 1 }}>
        <CardContent sx={{ pb: 1 }}>
          {/* Status chip */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Chip
              icon={<>{statusCfg.icon}</>}
              label={statusCfg.label}
              size="small"
              sx={{
                bgcolor: alpha(statusCfg.color, 0.15),
                color: statusCfg.color,
                fontWeight: 600,
                '& .MuiChip-icon': { color: statusCfg.color },
              }}
            />
            {post.view_count > 0 && (
              <Chip
                icon={<ViewsIcon sx={{ fontSize: 12 }} />}
                label={post.view_count}
                size="small"
                variant="outlined"
                sx={{ '& .MuiChip-icon': { color: 'text.secondary' } }}
              />
            )}
          </Stack>

          {/* Title */}
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.3 }}>
            {post.title}
          </Typography>

          {/* Excerpt */}
          {excerpt && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
              {excerpt}
            </Typography>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
              {post.tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    bgcolor: tag.color ? alpha(tag.color, 0.12) : undefined,
                    color: tag.color || 'text.secondary',
                  }}
                />
              ))}
              {post.tags.length > 3 && (
                <Chip label={`+${post.tags.length - 3}`} size="small" sx={{ height: 22, fontSize: '0.7rem' }} />
              )}
            </Stack>
          )}

          {/* Meta row */}
          <Stack direction="row" spacing={1.5} sx={{ mt: 'auto' }}>
            <Typography variant="caption" color="text.secondary">
              {format(new Date(post.created_at), 'MMM d, yyyy')}
            </Typography>
            {post.reading_time != null && (
              <Typography variant="caption" color="text.secondary">
                {post.reading_time > 0 ? `${post.reading_time} min` : '< 1 min'}
              </Typography>
            )}
            {post.word_count != null && post.word_count > 0 && (
              <Typography variant="caption" color="text.secondary">
                {post.word_count} words
              </Typography>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>

      {/* Actions */}
      <Divider />
      <Stack direction="row" spacing={0.5} sx={{ px: 1, py: 0.5 }}>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={onEdit}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {post.status === 'draft' && (
          <Tooltip title="Publish">
            <IconButton size="small" color="success" onClick={onPublish}>
              <PublishIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={onDelete}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Card>
  );
}

// ─── Small sub-components ────────────────────────────────────────────────────

function StatChip({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <Chip
      icon={<>{icon}</>}
      label={label}
      size="small"
      sx={{
        bgcolor: alpha(color, 0.1),
        color,
        fontWeight: 600,
        fontSize: '0.8rem',
        '& .MuiChip-icon': { color },
      }}
    />
  );
}

function BlogListSkeleton() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent>
            <Skeleton variant="rounded" width={80} height={24} sx={{ mb: 1.5 }} />
            <Skeleton height={28} sx={{ mb: 0.5 }} />
            <Skeleton height={16} />
            <Skeleton height={16} width="70%" sx={{ mb: 1.5 }} />
            <Stack direction="row" spacing={1}>
              <Skeleton variant="rounded" width={50} height={18} />
              <Skeleton variant="rounded" width={70} height={18} />
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

function BlogLoadingSkeleton() {
  return (
    <Paper sx={{ p: 4 }}>
      <Skeleton height={40} width="60%" sx={{ mb: 2 }} />
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Skeleton variant="rounded" width={100} height={28} />
        <Skeleton variant="rounded" width={80} height={28} />
        <Skeleton variant="rounded" width={90} height={28} />
      </Stack>
      <Skeleton height={20} sx={{ mb: 1 }} />
      <Skeleton height={20} sx={{ mb: 1 }} />
      <Skeleton height={20} width="80%" sx={{ mb: 1 }} />
      <Skeleton height={20} width="60%" />
    </Paper>
  );
}

// ─── FAB event hook ──────────────────────────────────────────────────────────

export function useBlogDialogEvent(onOpen: () => void) {
  useEffect(() => {
    const handler = () => onOpen();
    window.addEventListener('open-add-blog-dialog', handler);
    return () => window.removeEventListener('open-add-blog-dialog', handler);
  }, [onOpen]);
}
