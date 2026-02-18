import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  TodoWithRelations,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoStatus,
  Priority,
  EisenhowerQuadrant,
  CategoryWithCount,
  TagWithCount,
  PaginationMeta,
} from '@productivity-app/shared';
import { todosApi, categoriesApi, tagsApi } from '../services/api';

// ─── Filter state ─────────────────────────────────────────────────────────────

export interface TodoFilters {
  search: string;
  status: TodoStatus | '';
  priority: Priority | '';
  quadrant: EisenhowerQuadrant | '';
  category_id: number | '';
}

const INITIAL_FILTERS: TodoFilters = {
  search: '',
  status: '',
  priority: '',
  quadrant: '',
  category_id: '',
};

// ─── Hook return type ─────────────────────────────────────────────────────────

export interface UseTodosReturn {
  todos: TodoWithRelations[];
  loading: boolean;
  error: string | null;
  filters: TodoFilters;
  page: number;
  meta: PaginationMeta | null;
  categories: CategoryWithCount[];
  tags: TagWithCount[];

  setFilters: (filters: Partial<TodoFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  refresh: () => Promise<void>;

  createTodo: (data: CreateTodoRequest) => Promise<boolean>;
  updateTodo: (id: number, data: UpdateTodoRequest) => Promise<boolean>;
  deleteTodo: (id: number) => Promise<boolean>;
  toggleComplete: (todo: TodoWithRelations) => Promise<boolean>;

  stats: {
    total: number;
    completed: number;
    pending: number;
    in_progress: number;
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20;

export function useTodos(): UseTodosReturn {
  const [todos, setTodos] = useState<TodoWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<TodoFilters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [tags, setTags] = useState<TagWithCount[]>([]);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ─── Fetch todos ──────────────────────────────────────────────────────────

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PAGE_LIMIT),
      };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.quadrant) params.quadrant = filters.quadrant;
      if (filters.category_id) params.category_id = String(filters.category_id);

      const response = await todosApi.list(params);

      if (!mountedRef.current) return;

      if (response.success && response.data) {
        setTodos(response.data);
        setMeta(response.meta ?? null);
      } else {
        setError(response.message || 'Failed to fetch todos');
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch todos');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [page, filters]);

  // ─── Fetch categories & tags (once) ───────────────────────────────────────

  const fetchMetadata = useCallback(async () => {
    try {
      const [catRes, tagRes] = await Promise.all([
        categoriesApi.list(),
        tagsApi.list(),
      ]);
      if (!mountedRef.current) return;
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (tagRes.success && tagRes.data) setTags(tagRes.data);
    } catch {
      // non-critical — silently ignore
    }
  }, []);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);
  useEffect(() => { fetchMetadata(); }, [fetchMetadata]);

  // ─── Filter helpers ───────────────────────────────────────────────────────

  const setFilters = useCallback((partial: Partial<TodoFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(INITIAL_FILTERS);
    setPage(1);
  }, []);

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  const createTodo = useCallback(async (data: CreateTodoRequest): Promise<boolean> => {
    try {
      const response = await todosApi.create(data);
      if (response.success) {
        await fetchTodos();
        await fetchMetadata();
        return true;
      }
      setError(response.message || 'Failed to create todo');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create todo');
      return false;
    }
  }, [fetchTodos, fetchMetadata]);

  const updateTodo = useCallback(async (id: number, data: UpdateTodoRequest): Promise<boolean> => {
    try {
      const response = await todosApi.update(id, data);
      if (response.success) {
        await fetchTodos();
        return true;
      }
      setError(response.message || 'Failed to update todo');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
      return false;
    }
  }, [fetchTodos]);

  const deleteTodo = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await todosApi.delete(id);
      if (response.success) {
        await fetchTodos();
        await fetchMetadata();
        return true;
      }
      setError(response.message || 'Failed to delete todo');
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
      return false;
    }
  }, [fetchTodos, fetchMetadata]);

  const toggleComplete = useCallback(async (todo: TodoWithRelations): Promise<boolean> => {
    const newStatus: TodoStatus = todo.status === 'completed' ? 'pending' : 'completed';
    return updateTodo(todo.id, { status: newStatus });
  }, [updateTodo]);

  // ─── Stats ────────────────────────────────────────────────────────────────

  const stats = {
    total: meta?.total ?? todos.length,
    completed: todos.filter((t) => t.status === 'completed').length,
    pending: todos.filter((t) => t.status === 'pending').length,
    in_progress: todos.filter((t) => t.status === 'in_progress').length,
  };

  return {
    todos,
    loading,
    error,
    filters,
    page,
    meta,
    categories,
    tags,
    setFilters,
    resetFilters,
    setPage,
    refresh: fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    stats,
  };
}
