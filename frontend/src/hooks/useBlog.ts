import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  BlogPostWithRelations,
  CreateBlogPostRequest,
  UpdateBlogPostRequest,
  BlogPostStatus,
  TagWithCount,
  PaginationMeta,
} from '@productivity-app/shared';
import { blogApi, tagsApi } from '../services/api';

// ─── Filter state ─────────────────────────────────────────────────────────────

export interface BlogFilters {
  search: string;
  status: BlogPostStatus | '';
  sort: string;
}

const INITIAL_FILTERS: BlogFilters = {
  search: '',
  status: '',
  sort: 'newest',
};

// ─── Hook return type ─────────────────────────────────────────────────────────

export interface UseBlogReturn {
  posts: BlogPostWithRelations[];
  currentPost: BlogPostWithRelations | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  filters: BlogFilters;
  page: number;
  meta: PaginationMeta | null;
  tags: TagWithCount[];

  setFilters: (filters: Partial<BlogFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  refresh: () => Promise<void>;

  fetchPost: (id: number) => Promise<void>;
  clearCurrentPost: () => void;

  createPost: (data: CreateBlogPostRequest) => Promise<number | false>;
  updatePost: (id: number, data: UpdateBlogPostRequest) => Promise<boolean>;
  deletePost: (id: number) => Promise<boolean>;
  publishPost: (id: number) => Promise<boolean>;

  stats: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20;

export function useBlog(): UseBlogReturn {
  const [posts, setPosts] = useState<BlogPostWithRelations[]>([]);
  const [currentPost, setCurrentPost] = useState<BlogPostWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<BlogFilters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [tags, setTags] = useState<TagWithCount[]>([]);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ─── Fetch posts list ─────────────────────────────────────────────────────

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_LIMIT),
      };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.sort) params.sort = filters.sort;

      const response = await blogApi.list(params);
      if (!mountedRef.current) return;

      if (response.success && response.data) {
        setPosts(response.data);
        setMeta(response.meta ?? null);
      } else {
        setError(response.message || 'Failed to fetch blog posts');
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch blog posts');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [page, filters]);

  // ─── Fetch tags (once) ────────────────────────────────────────────────────

  const fetchTags = useCallback(async () => {
    try {
      const response = await tagsApi.list();
      if (!mountedRef.current) return;
      if (response.success && response.data) setTags(response.data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // ─── Fetch single post ────────────────────────────────────────────────────

  const fetchPost = useCallback(async (id: number) => {
    setError(null);
    try {
      const response = await blogApi.get(id);
      if (!mountedRef.current) return;

      if (response.success && response.data) {
        setCurrentPost(response.data);
      } else {
        setError(response.message || 'Post not found');
        setCurrentPost(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch post');
        setCurrentPost(null);
      }
    }
  }, []);

  const clearCurrentPost = useCallback(() => {
    setCurrentPost(null);
  }, []);

  // ─── Filter helpers ───────────────────────────────────────────────────────

  const setFilters = useCallback((partial: Partial<BlogFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(INITIAL_FILTERS);
    setPage(1);
  }, []);

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  const createPost = useCallback(
    async (data: CreateBlogPostRequest): Promise<number | false> => {
      setSaving(true);
      try {
        const response = await blogApi.create(data);
        if (response.success && response.data) {
          if (mountedRef.current) await fetchPosts();
          return response.data.id;
        }
        if (mountedRef.current) setError(response.message || 'Failed to create post');
        return false;
      } catch (err) {
        if (mountedRef.current)
          setError(err instanceof Error ? err.message : 'Failed to create post');
        return false;
      } finally {
        if (mountedRef.current) setSaving(false);
      }
    },
    [fetchPosts]
  );

  const updatePost = useCallback(
    async (id: number, data: UpdateBlogPostRequest): Promise<boolean> => {
      setSaving(true);
      try {
        const response = await blogApi.update(id, data);
        if (response.success) {
          if (mountedRef.current) {
            await fetchPost(id);
            await fetchPosts();
          }
          return true;
        }
        if (mountedRef.current) setError(response.message || 'Failed to update post');
        return false;
      } catch (err) {
        if (mountedRef.current)
          setError(err instanceof Error ? err.message : 'Failed to update post');
        return false;
      } finally {
        if (mountedRef.current) setSaving(false);
      }
    },
    [fetchPosts, fetchPost]
  );

  const deletePost = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        const response = await blogApi.delete(id);
        if (response.success) {
          if (mountedRef.current) {
            setCurrentPost(null);
            await fetchPosts();
          }
          return true;
        }
        if (mountedRef.current) setError(response.message || 'Failed to delete post');
        return false;
      } catch (err) {
        if (mountedRef.current)
          setError(err instanceof Error ? err.message : 'Failed to delete post');
        return false;
      }
    },
    [fetchPosts]
  );

  const publishPost = useCallback(
    async (id: number): Promise<boolean> => {
      setSaving(true);
      try {
        const response = await blogApi.publish(id);
        if (response.success) {
          if (mountedRef.current) {
            await fetchPost(id);
            await fetchPosts();
          }
          return true;
        }
        if (mountedRef.current) setError(response.message || 'Failed to publish post');
        return false;
      } catch (err) {
        if (mountedRef.current)
          setError(err instanceof Error ? err.message : 'Failed to publish post');
        return false;
      } finally {
        if (mountedRef.current) setSaving(false);
      }
    },
    [fetchPosts, fetchPost]
  );

  // ─── Stats ────────────────────────────────────────────────────────────────

  const stats = {
    total: meta?.total ?? posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
    archived: posts.filter((p) => p.status === 'archived').length,
  };

  return {
    posts,
    currentPost,
    loading,
    saving,
    error,
    filters,
    page,
    meta,
    tags,
    setFilters,
    resetFilters,
    setPage,
    refresh: fetchPosts,
    fetchPost,
    clearCurrentPost,
    createPost,
    updatePost,
    deletePost,
    publishPost,
    stats,
  };
}
