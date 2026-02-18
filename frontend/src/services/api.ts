import type {
  ApiResponse,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  Todo,
  TodoWithRelations,
  CreateTodoRequest,
  UpdateTodoRequest,
  Category,
  CategoryWithCount,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  Tag,
  TagWithCount,
  CreateTagRequest,
  UpdateTagRequest,
  DiaryEntry,
  CreateDiaryEntryRequest,
  BlogPost,
  BlogPostWithRelations,
  CreateBlogPostRequest,
  UpdateBlogPostRequest,
  CreateEventRequest,
  BulletLog,
  CreateBulletLogRequest,
  DashboardStats,
  MatrixAnalyticsResponse,
  TrendsAnalyticsResponse,
  WritingAnalyticsResponse,
  DiaryAnalyticsResponse,
  SafeUser,
} from '@productivity-app/shared';
import type { Event as AppEvent } from '@productivity-app/shared';
import { API_ENDPOINTS, APP_CONFIG } from '@productivity-app/shared';

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem(APP_CONFIG.TOKEN_STORAGE_KEY);
}

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(cb: () => void): void {
  onUnauthorized = cb;
}

async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem(APP_CONFIG.TOKEN_STORAGE_KEY);
    localStorage.removeItem(APP_CONFIG.USER_STORAGE_KEY);
    onUnauthorized?.();
  }

  const data: ApiResponse<T> = await response.json();

  if (!response.ok && !data.message) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (body: RegisterRequest) =>
    request<AuthResponse>(API_ENDPOINTS.AUTH_REGISTER, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: LoginRequest) =>
    request<AuthResponse>(API_ENDPOINTS.AUTH_LOGIN, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  logout: () =>
    request<void>(API_ENDPOINTS.AUTH_LOGOUT, { method: 'POST' }),

  verify: () =>
    request<{ user: SafeUser }>(API_ENDPOINTS.AUTH_VERIFY),

  profile: () =>
    request<SafeUser>(API_ENDPOINTS.AUTH_PROFILE),
};

// ─── Todos ────────────────────────────────────────────────────────────────────

export const todosApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<TodoWithRelations[]>(`${API_ENDPOINTS.TODOS}${qs}`);
  },

  get: (id: number) =>
    request<TodoWithRelations>(API_ENDPOINTS.TODO_BY_ID(id)),

  create: (body: CreateTodoRequest) =>
    request<Todo>(API_ENDPOINTS.TODOS, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: number, body: UpdateTodoRequest) =>
    request<Todo>(API_ENDPOINTS.TODO_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (id: number) =>
    request<void>(API_ENDPOINTS.TODO_BY_ID(id), { method: 'DELETE' }),
};

// ─── Categories ───────────────────────────────────────────────────────────────

export const categoriesApi = {
  list: () =>
    request<CategoryWithCount[]>(API_ENDPOINTS.CATEGORIES),

  get: (id: number) =>
    request<Category>(API_ENDPOINTS.CATEGORY_BY_ID(id)),

  create: (body: CreateCategoryRequest) =>
    request<Category>(API_ENDPOINTS.CATEGORIES, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: number, body: UpdateCategoryRequest) =>
    request<Category>(API_ENDPOINTS.CATEGORY_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (id: number) =>
    request<void>(API_ENDPOINTS.CATEGORY_BY_ID(id), { method: 'DELETE' }),
};

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const tagsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<TagWithCount[]>(`${API_ENDPOINTS.TAGS}${qs}`);
  },

  get: (id: number) =>
    request<Tag>(API_ENDPOINTS.TAG_BY_ID(id)),

  getTodos: (id: number) =>
    request<TodoWithRelations[]>(API_ENDPOINTS.TAG_TODOS(id)),

  create: (body: CreateTagRequest) =>
    request<Tag>(API_ENDPOINTS.TAGS, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: number, body: UpdateTagRequest) =>
    request<Tag>(API_ENDPOINTS.TAG_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (id: number) =>
    request<void>(API_ENDPOINTS.TAG_BY_ID(id), { method: 'DELETE' }),
};

// ─── Diary ────────────────────────────────────────────────────────────────────

export const diaryApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<DiaryEntry[]>(`${API_ENDPOINTS.DIARY}${qs}`);
  },

  get: (date: string) =>
    request<DiaryEntry>(API_ENDPOINTS.DIARY_BY_DATE(date)),

  upsert: (date: string, body: CreateDiaryEntryRequest) =>
    request<DiaryEntry>(API_ENDPOINTS.DIARY_BY_DATE(date), {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (date: string) =>
    request<void>(API_ENDPOINTS.DIARY_BY_DATE(date), { method: 'DELETE' }),
};

// ─── Bullet Journal ───────────────────────────────────────────────────────────

export const bulletApi = {
  getLogs: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<BulletLog[]>(`${API_ENDPOINTS.BULLET_LOGS}${qs}`);
  },

  upsertLog: (date: string, type: string, body: CreateBulletLogRequest) =>
    request<BulletLog>(API_ENDPOINTS.BULLET_LOG_BY_DATE_TYPE(date, type), {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  getEvents: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<AppEvent[]>(`${API_ENDPOINTS.BULLET_EVENTS}${qs}`);
  },

  createEvent: (body: CreateEventRequest) =>
    request<AppEvent>(API_ENDPOINTS.BULLET_EVENTS, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateTodoSymbol: (id: number, symbol: string) =>
    request<void>(API_ENDPOINTS.BULLET_TODO_SYMBOL(id), {
      method: 'PATCH',
      body: JSON.stringify({ bullet_symbol: symbol }),
    }),
};

// ─── Blog ─────────────────────────────────────────────────────────────────────

export const blogApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<BlogPostWithRelations[]>(`${API_ENDPOINTS.BLOG}${qs}`);
  },

  get: (id: number) =>
    request<BlogPostWithRelations>(API_ENDPOINTS.BLOG_BY_ID(id)),

  create: (body: CreateBlogPostRequest) =>
    request<BlogPost>(API_ENDPOINTS.BLOG, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: number, body: UpdateBlogPostRequest) =>
    request<BlogPost>(API_ENDPOINTS.BLOG_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (id: number) =>
    request<void>(API_ENDPOINTS.BLOG_BY_ID(id), { method: 'DELETE' }),

  publish: (id: number) =>
    request<BlogPost>(API_ENDPOINTS.BLOG_PUBLISH(id), { method: 'PATCH' }),
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export const analyticsApi = {
  dashboard: () =>
    request<DashboardStats>(API_ENDPOINTS.ANALYTICS_DASHBOARD),

  matrix: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<MatrixAnalyticsResponse>(`${API_ENDPOINTS.ANALYTICS_MATRIX}${qs}`);
  },

  trends: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<TrendsAnalyticsResponse>(`${API_ENDPOINTS.ANALYTICS_TRENDS}${qs}`);
  },

  writing: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<WritingAnalyticsResponse>(`${API_ENDPOINTS.ANALYTICS_WRITING}${qs}`);
  },

  diary: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<DiaryAnalyticsResponse>(`${API_ENDPOINTS.ANALYTICS_DIARY}${qs}`);
  },
};
