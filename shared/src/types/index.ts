// ─── Enums & Literal Types ───────────────────────────────────────────────────

export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'deferred';

export type Priority = 'low' | 'medium' | 'high';

export type EnergyLevel = 'low' | 'medium' | 'high';

export type EisenhowerQuadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export type BulletSymbol = '•' | '×' | '→' | '○' | '–' | '!';

export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export type Weather = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy';

export type BulletLogType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'future';

export type BlogPostStatus = 'draft' | 'published' | 'archived';

export type ContentType = 'markdown' | 'html';

// ─── Base Entity ─────────────────────────────────────────────────────────────

export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface User extends BaseEntity {
  username: string;
  email: string;
  password_hash: string;
  api_token: string | null;
  is_active: number;
  profile_data: string | null;
  preferences: string | null;
}

export interface SafeUser {
  id: number;
  username: string;
  email: string;
  is_active: number;
  profile_data: string | null;
  preferences: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category extends BaseEntity {
  user_id: number;
  name: string;
  color: string;
  icon: string | null;
  description: string | null;
}

export interface CategoryWithCount extends Category {
  todo_count: number;
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface TagWithCount extends Tag {
  usage_count: number;
}

// ─── Todo ────────────────────────────────────────────────────────────────────

export interface Todo extends BaseEntity {
  user_id: number;
  title: string;
  description: string | null;
  status: TodoStatus;
  priority: Priority;
  due_date: string | null;
  category_id: number | null;
  urgency_level: number;
  importance_level: number;
  eisenhower_quadrant: EisenhowerQuadrant | null;
  quadrant_auto_assigned: number;
  bullet_symbol: BulletSymbol;
  time_estimate: number | null;
  energy_required: EnergyLevel | null;
  completed_at: string | null;
}

export interface TodoWithRelations extends Todo {
  category_name?: string | null;
  category_color?: string | null;
  tags?: Tag[];
}

// ─── Todo-Tag Junction ───────────────────────────────────────────────────────

export interface TodoTag {
  todo_id: number;
  tag_id: number;
  created_at: string;
}

// ─── Diary Entry ─────────────────────────────────────────────────────────────

export interface DiaryEntry extends BaseEntity {
  user_id: number;
  date: string;
  content: string | null;
  mood: Mood | null;
  weather: Weather | null;
  energy_level: number | null;
  gratitude: string | null;
  highlights: string | null;
  challenges: string | null;
  tomorrow_focus: string | null;
}

// ─── Event ───────────────────────────────────────────────────────────────────

export interface Event extends BaseEntity {
  user_id: number;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  duration: number | null;
  location: string | null;
  category_id: number | null;
  bullet_symbol: string;
}

// ─── Bullet Log ──────────────────────────────────────────────────────────────

export interface BulletLog extends BaseEntity {
  user_id: number;
  date: string;
  type: BulletLogType;
  content: string | null;
}

// ─── Blog Category ───────────────────────────────────────────────────────────

export interface BlogCategory {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  parent_id: number | null;
  created_at: string;
}

// ─── Blog Post ───────────────────────────────────────────────────────────────

export interface BlogPost extends BaseEntity {
  user_id: number;
  title: string;
  slug: string;
  content: string | null;
  content_type: ContentType;
  status: BlogPostStatus;
  excerpt: string | null;
  featured_image_path: string | null;
  category_id: number | null;
  reading_time: number | null;
  word_count: number | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  view_count: number;
  published_at: string | null;
}

export interface BlogPostWithRelations extends BlogPost {
  category_name?: string | null;
  tags?: Tag[];
}

// ─── Blog Post-Tag Junction ──────────────────────────────────────────────────

export interface BlogPostTag {
  blog_post_id: number;
  tag_id: number;
  created_at: string;
}

// ─── Writing Session ─────────────────────────────────────────────────────────

export interface WritingSession {
  id: number;
  user_id: number;
  blog_post_id: number;
  start_time: string | null;
  end_time: string | null;
  words_written: number | null;
  productivity_score: number | null;
  notes: string | null;
  session_type: string | null;
  created_at: string;
}

// ─── Quadrant Analytics ──────────────────────────────────────────────────────

export interface QuadrantAnalytics {
  id: number;
  user_id: number;
  date: string;
  quadrant: EisenhowerQuadrant;
  tasks_completed: number;
  time_spent: number;
  productivity_score: number | null;
  created_at: string;
}

// ─── Productivity Metrics ────────────────────────────────────────────────────

export interface ProductivityMetrics {
  total_todos: number;
  completed_todos: number;
  pending_todos: number;
  in_progress_todos: number;
  overdue_todos: number;
  completion_rate: number;
  quadrant_distribution: Record<EisenhowerQuadrant, number>;
  priority_distribution: Record<Priority, number>;
  avg_completion_time_hours: number | null;
  total_diary_entries: number;
  total_blog_posts: number;
  published_blog_posts: number;
  total_words_written: number;
}

// ─── Bullet Symbol Info ──────────────────────────────────────────────────────

export interface BulletSymbolInfo {
  symbol: BulletSymbol;
  label: string;
  description: string;
}

// ─── Quadrant Info ───────────────────────────────────────────────────────────

export interface QuadrantInfo {
  id: EisenhowerQuadrant;
  label: string;
  description: string;
  color: string;
  actionVerb: string;
}

// ─── Priority Info ───────────────────────────────────────────────────────────

export interface PriorityInfo {
  level: Priority;
  label: string;
  color: string;
  numericValue: number;
}

// ─── Energy Level Info ───────────────────────────────────────────────────────

export interface EnergyLevelInfo {
  level: EnergyLevel;
  label: string;
  description: string;
}

// ─── Mood Info ───────────────────────────────────────────────────────────────

export interface MoodInfo {
  mood: Mood;
  label: string;
  emoji: string;
  color: string;
}

// ─── API Response Envelope ───────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: PaginationMeta;
}

// ─── Request DTOs ────────────────────────────────────────────────────────────

export interface CreateTodoRequest {
  title: string;
  description?: string;
  priority?: Priority;
  due_date?: string;
  category_id?: number;
  urgency_level?: number;
  importance_level?: number;
  bullet_symbol?: BulletSymbol;
  time_estimate?: number;
  energy_required?: EnergyLevel;
  tag_ids?: number[];
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  status?: TodoStatus;
  priority?: Priority;
  due_date?: string | null;
  category_id?: number | null;
  urgency_level?: number;
  importance_level?: number;
  bullet_symbol?: BulletSymbol;
  time_estimate?: number | null;
  energy_required?: EnergyLevel | null;
  tag_ids?: number[];
}

export interface CreateCategoryRequest {
  name: string;
  color?: string;
  icon?: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  color?: string;
  icon?: string | null;
  description?: string | null;
}

export interface CreateTagRequest {
  name: string;
  color?: string;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string;
}

export interface CreateDiaryEntryRequest {
  content?: string;
  mood?: Mood;
  weather?: Weather;
  energy_level?: number;
  gratitude?: string;
  highlights?: string;
  challenges?: string;
  tomorrow_focus?: string;
}

export interface CreateBlogPostRequest {
  title: string;
  content?: string;
  content_type?: ContentType;
  status?: BlogPostStatus;
  excerpt?: string;
  featured_image_path?: string;
  category_id?: number;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  tag_ids?: number[];
}

export interface UpdateBlogPostRequest {
  title?: string;
  content?: string;
  content_type?: ContentType;
  status?: BlogPostStatus;
  excerpt?: string;
  featured_image_path?: string | null;
  category_id?: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  tag_ids?: number[];
}

export interface CreateBlogCategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: number;
}

export interface UpdateBlogCategoryRequest {
  name?: string;
  slug?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  parent_id?: number | null;
}

export interface CreateWritingSessionRequest {
  blog_post_id: number;
}

export interface UpdateWritingSessionRequest {
  words_written?: number;
  notes?: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  duration?: number;
  location?: string;
  category_id?: number;
  bullet_symbol?: string;
}

export interface CreateBulletLogRequest {
  content?: string;
}

// ─── Auth DTOs ───────────────────────────────────────────────────────────────

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  todos: {
    total: number;
    completed: number;
    pending: number;
    in_progress: number;
    overdue: number;
  };
  matrix: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
  diary: {
    total_entries: number;
    streak: number;
  };
  blog: {
    total_posts: number;
    published: number;
    draft: number;
  };
}

// ─── Analytics Response Types ────────────────────────────────────────────────

export interface QuadrantBreakdown {
  quadrant: EisenhowerQuadrant;
  label: string;
  color: string;
  total: number;
  completed: number;
  pending: number;
  avg_urgency: number;
  avg_importance: number;
  time_spent: number;
}

export interface MatrixAnalyticsResponse {
  distribution: QuadrantBreakdown[];
  total_tasks: number;
  total_completed: number;
  completion_rate: number;
  daily_completions: Array<{
    date: string;
    quadrant: EisenhowerQuadrant;
    tasks_completed: number;
    time_spent: number;
    productivity_score: number | null;
  }>;
  productivity_score: number;
}

export interface TrendsAnalyticsResponse {
  priority_distribution: Array<{
    priority: Priority;
    label: string;
    color: string;
    total: number;
    completed: number;
    pending: number;
  }>;
  completion_trends: Array<{
    date: string;
    created: number;
    completed: number;
    net: number;
  }>;
  status_breakdown: Array<{
    status: TodoStatus;
    count: number;
  }>;
  avg_completion_time_hours: number | null;
  overdue_count: number;
  on_track_count: number;
}

export interface WritingAnalyticsResponse {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  total_words: number;
  total_reading_time: number;
  avg_words_per_post: number;
  total_views: number;
  sessions: {
    total_sessions: number;
    total_time_minutes: number;
    total_words_written: number;
    avg_productivity_score: number | null;
  };
  words_over_time: Array<{
    date: string;
    words_written: number;
    sessions: number;
  }>;
  posts_by_status: Array<{
    status: BlogPostStatus;
    count: number;
  }>;
}

export interface DiaryAnalyticsResponse {
  total_entries: number;
  streak: number;
  mood_distribution: Array<{
    mood: Mood;
    label: string;
    emoji: string;
    color: string;
    count: number;
  }>;
  energy_trends: Array<{
    date: string;
    energy_level: number;
  }>;
  entry_frequency: Array<{
    date: string;
    has_entry: boolean;
  }>;
  avg_energy: number | null;
  most_common_mood: Mood | null;
  entries_with_gratitude: number;
  weather_distribution: Array<{
    weather: Weather;
    count: number;
  }>;
}
