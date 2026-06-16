import type {
  BulletSymbolInfo,
  QuadrantInfo,
  PriorityInfo,
  EnergyLevelInfo,
  MoodInfo,
  EisenhowerQuadrant,
  Priority,
  EnergyLevel,
  Mood,
} from '../types/index.js';

// ─── Bullet Symbols ──────────────────────────────────────────────────────────

export const BULLET_SYMBOLS: readonly BulletSymbolInfo[] = [
  { symbol: '•', label: 'Task', description: 'A task or action item' },
  { symbol: '×', label: 'Completed', description: 'A completed task' },
  { symbol: '→', label: 'Migrated', description: 'A task migrated to another date' },
  { symbol: '○', label: 'Event', description: 'A scheduled event' },
  { symbol: '–', label: 'Note', description: 'A note or observation' },
  { symbol: '!', label: 'Priority', description: 'A high-priority item' },
] as const;

// ─── Eisenhower Quadrants ────────────────────────────────────────────────────

export const EISENHOWER_QUADRANTS: Record<EisenhowerQuadrant, QuadrantInfo> = {
  Q1: {
    id: 'Q1',
    label: 'Do First',
    description: 'Urgent and important — handle immediately',
    color: '#d32f2f',
    actionVerb: 'Do',
  },
  Q2: {
    id: 'Q2',
    label: 'Schedule',
    description: 'Not urgent but important — plan and prioritize',
    color: '#1976d2',
    actionVerb: 'Schedule',
  },
  Q3: {
    id: 'Q3',
    label: 'Delegate',
    description: 'Urgent but not important — delegate if possible',
    color: '#ed6c02',
    actionVerb: 'Delegate',
  },
  Q4: {
    id: 'Q4',
    label: 'Eliminate',
    description: 'Neither urgent nor important — minimize or eliminate',
    color: '#757575',
    actionVerb: 'Eliminate',
  },
};

// ─── Priority Levels ─────────────────────────────────────────────────────────

export const PRIORITY_LEVELS: Record<Priority, PriorityInfo> = {
  low: {
    level: 'low',
    label: 'Low',
    color: '#4caf50',
    numericValue: 1,
  },
  medium: {
    level: 'medium',
    label: 'Medium',
    color: '#ff9800',
    numericValue: 2,
  },
  high: {
    level: 'high',
    label: 'High',
    color: '#f44336',
    numericValue: 3,
  },
};

// ─── Energy Levels ───────────────────────────────────────────────────────────

export const ENERGY_LEVELS: Record<EnergyLevel, EnergyLevelInfo> = {
  low: {
    level: 'low',
    label: 'Low Energy',
    description: 'Tasks requiring minimal mental or physical effort',
  },
  medium: {
    level: 'medium',
    label: 'Medium Energy',
    description: 'Tasks requiring moderate focus and effort',
  },
  high: {
    level: 'high',
    label: 'High Energy',
    description: 'Tasks requiring peak concentration and energy',
  },
};

// ─── Mood Levels ─────────────────────────────────────────────────────────────

export const MOOD_LEVELS: Record<Mood, MoodInfo> = {
  great: {
    mood: 'great',
    label: 'Great',
    emoji: '😄',
    color: '#4caf50',
  },
  good: {
    mood: 'good',
    label: 'Good',
    emoji: '🙂',
    color: '#8bc34a',
  },
  neutral: {
    mood: 'neutral',
    label: 'Neutral',
    emoji: '😐',
    color: '#ff9800',
  },
  bad: {
    mood: 'bad',
    label: 'Bad',
    emoji: '😞',
    color: '#ff5722',
  },
  terrible: {
    mood: 'terrible',
    label: 'Terrible',
    emoji: '😢',
    color: '#f44336',
  },
};

// ─── API Endpoints ───────────────────────────────────────────────────────────

export const API_ENDPOINTS = {
  // System
  HEALTH: '/health',
  API_ROOT: '/api',

  // Auth
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_VERIFY: '/api/auth/verify',
  AUTH_PROFILE: '/api/auth/profile',

  // Todos
  TODOS: '/api/todos',
  TODO_BY_ID: (id: number | string) => `/api/todos/${id}`,

  // Categories
  CATEGORIES: '/api/categories',
  CATEGORY_BY_ID: (id: number | string) => `/api/categories/${id}`,

  // Tags
  TAGS: '/api/tags',
  TAG_BY_ID: (id: number | string) => `/api/tags/${id}`,
  TAG_TODOS: (id: number | string) => `/api/tags/${id}/todos`,

  // Diary
  DIARY: '/api/diary',
  DIARY_BY_DATE: (date: string) => `/api/diary/${date}`,

  // Bullet Journal
  BULLET_LOGS: '/api/bullet/logs',
  BULLET_LOG_BY_DATE_TYPE: (date: string, type: string) => `/api/bullet/logs/${date}/${type}`,
  BULLET_EVENTS: '/api/bullet/events',
  BULLET_TODO_SYMBOL: (id: number | string) => `/api/bullet/todos/${id}/symbol`,

  // Blog
  BLOG: '/api/blog',
  BLOG_BY_ID: (id: number | string) => `/api/blog/${id}`,
  BLOG_PUBLISH: (id: number | string) => `/api/blog/${id}/publish`,

  // Blog Categories
  BLOG_CATEGORIES: '/api/blog-categories',
  BLOG_CATEGORY_BY_ID: (id: number | string) => `/api/blog-categories/${id}`,

  // Writing Sessions
  WRITING_SESSIONS: '/api/writing-sessions',
  WRITING_SESSION_BY_ID: (id: number | string) => `/api/writing-sessions/${id}`,

  // Analytics
  ANALYTICS_DASHBOARD: '/api/analytics/dashboard',
  ANALYTICS_MATRIX: '/api/analytics/matrix',
  ANALYTICS_TRENDS: '/api/analytics/trends',
  ANALYTICS_WRITING: '/api/analytics/writing',
  ANALYTICS_DIARY: '/api/analytics/diary',
} as const;

// ─── Date Formats ────────────────────────────────────────────────────────────

export const DATE_FORMATS = {
  ISO_DATE: 'yyyy-MM-dd',
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss",
  DISPLAY_DATE: 'MMM d, yyyy',
  DISPLAY_DATE_SHORT: 'MMM d',
  DISPLAY_DATETIME: 'MMM d, yyyy h:mm a',
  DISPLAY_TIME: 'h:mm a',
  DAY_OF_WEEK: 'EEEE',
  MONTH_YEAR: 'MMMM yyyy',
  YEAR: 'yyyy',
} as const;

// ─── Default Categories ──────────────────────────────────────────────────────

export const DEFAULT_CATEGORIES = [
  { name: 'Work', color: '#1976d2', icon: 'work', description: 'Work-related tasks and projects' },
  { name: 'Personal', color: '#9c27b0', icon: 'person', description: 'Personal tasks and errands' },
  { name: 'Health', color: '#4caf50', icon: 'favorite', description: 'Health and fitness goals' },
  {
    name: 'Learning',
    color: '#ff9800',
    icon: 'school',
    description: 'Education and skill development',
  },
  {
    name: 'Finance',
    color: '#607d8b',
    icon: 'account_balance',
    description: 'Financial tasks and planning',
  },
] as const;

// ─── Default Tags ────────────────────────────────────────────────────────────

export const DEFAULT_TAGS = [
  { name: 'urgent', color: '#f44336' },
  { name: 'important', color: '#ff9800' },
  { name: 'quick-win', color: '#4caf50' },
  { name: 'blocked', color: '#9e9e9e' },
  { name: 'follow-up', color: '#2196f3' },
  { name: 'review', color: '#9c27b0' },
] as const;

// ─── Todo Status Labels & Colors ─────────────────────────────────────────────

export const TODO_STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#ff9800' },
  in_progress: { label: 'In Progress', color: '#2196f3' },
  completed: { label: 'Completed', color: '#4caf50' },
  cancelled: { label: 'Cancelled', color: '#9e9e9e' },
  deferred: { label: 'Deferred', color: '#795548' },
} as const;

// ─── App Constants ───────────────────────────────────────────────────────────

export const APP_CONFIG = {
  APP_NAME: 'Productivity App',
  APP_VERSION: '1.0.0',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  READING_SPEED_WPM: 200,
  PASSWORD_MIN_LENGTH: 6,
  BCRYPT_SALT_ROUNDS: 12,
  TOKEN_STORAGE_KEY: 'auth_token',
  USER_STORAGE_KEY: 'user',
  THEME_STORAGE_KEY: 'productivity_app_theme',
} as const;

/**
 * express-validator normalizeEmail options.
 * Preserve plus-addressing (user+tag@gmail.com) and Gmail dots so aliases stay distinct.
 */
export const EMAIL_NORMALIZE_OPTIONS = {
  gmail_remove_subaddress: false,
  gmail_remove_dots: false,
  outlookdotcom_remove_subaddress: false,
  yahoo_remove_subaddress: false,
  icloud_remove_subaddress: false,
} as const;
