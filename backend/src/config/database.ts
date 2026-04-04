import path from 'node:path';
import sqlite3 from 'sqlite3';
import { DEFAULT_TAGS, DEFAULT_CATEGORIES } from '@productivity-app/shared';

const DATABASE_PATH = process.env.DATABASE_PATH
  ? path.resolve(__dirname, '..', '..', process.env.DATABASE_PATH)
  : path.resolve(__dirname, '..', '..', '..', 'data', 'productivity_app.db');

let db: sqlite3.Database;

function runSQL(database: sqlite3.Database, sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    database.run(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

const CREATE_TABLES_SQL = [
  // 1. users
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    api_token TEXT,
    is_active INTEGER DEFAULT 1,
    profile_data TEXT,
    preferences TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // 2. categories
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#1976d2',
    icon TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id)`,

  // 3. tags
  `CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#757575',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id)`,

  // 4. todos
  `CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    due_date TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    urgency_level INTEGER DEFAULT 5,
    importance_level INTEGER DEFAULT 5,
    eisenhower_quadrant TEXT,
    quadrant_auto_assigned INTEGER DEFAULT 1,
    bullet_symbol TEXT DEFAULT '•',
    time_estimate INTEGER,
    energy_required TEXT,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id)`,

  // 5. todo_tags (junction)
  `CREATE TABLE IF NOT EXISTS todo_tags (
    todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (todo_id, tag_id)
  )`,

  // 6. diary_entries
  `CREATE TABLE IF NOT EXISTS diary_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    content TEXT,
    mood TEXT,
    weather TEXT,
    energy_level INTEGER,
    gratitude TEXT,
    highlights TEXT,
    challenges TEXT,
    tomorrow_focus TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_diary_entries_user_id ON diary_entries(user_id)`,

  // 7. events
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date TEXT NOT NULL,
    event_time TEXT,
    duration INTEGER,
    location TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    bullet_symbol TEXT DEFAULT '○',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id)`,

  // 8. bullet_logs
  `CREATE TABLE IF NOT EXISTS bullet_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_bullet_logs_user_id ON bullet_logs(user_id)`,

  // 9. blog_categories
  `CREATE TABLE IF NOT EXISTS blog_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    color TEXT,
    icon TEXT,
    parent_id INTEGER REFERENCES blog_categories(id) ON DELETE SET NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, slug)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_blog_categories_user_id ON blog_categories(user_id)`,

  // 10. blog_posts
  `CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT,
    content_type TEXT DEFAULT 'markdown',
    status TEXT DEFAULT 'draft',
    excerpt TEXT,
    featured_image_path TEXT,
    category_id INTEGER REFERENCES blog_categories(id) ON DELETE SET NULL,
    reading_time INTEGER,
    word_count INTEGER,
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT,
    view_count INTEGER DEFAULT 0,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, slug)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_blog_posts_user_id ON blog_posts(user_id)`,

  // 11. blog_post_tags (junction)
  `CREATE TABLE IF NOT EXISTS blog_post_tags (
    blog_post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (blog_post_id, tag_id)
  )`,

  // 12. writing_sessions
  `CREATE TABLE IF NOT EXISTS writing_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blog_post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    start_time DATETIME,
    end_time DATETIME,
    words_written INTEGER,
    productivity_score REAL,
    notes TEXT,
    session_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_writing_sessions_user_id ON writing_sessions(user_id)`,

  // 13. quadrant_analytics
  `CREATE TABLE IF NOT EXISTS quadrant_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    quadrant TEXT NOT NULL,
    tasks_completed INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    productivity_score REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_quadrant_analytics_user_id ON quadrant_analytics(user_id)`,
];

async function seedDefaultsForExistingUsers(): Promise<void> {
  try {
    const users = await dbAll<{ id: number }>('SELECT id FROM users');
    for (const user of users) {
      const tagRow = await dbGet<{ cnt: number }>(
        'SELECT COUNT(*) as cnt FROM tags WHERE user_id = ?',
        [user.id]
      );
      if (tagRow && tagRow.cnt === 0) {
        for (const tag of DEFAULT_TAGS) {
          await dbRun('INSERT OR IGNORE INTO tags (user_id, name, color) VALUES (?, ?, ?)', [
            user.id,
            tag.name,
            tag.color,
          ]);
        }
        console.log(`Seeded default tags for user ${user.id}`);
      }

      const catRow = await dbGet<{ cnt: number }>(
        'SELECT COUNT(*) as cnt FROM categories WHERE user_id = ?',
        [user.id]
      );
      if (catRow && catRow.cnt === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
          await dbRun(
            'INSERT OR IGNORE INTO categories (user_id, name, color, icon, description) VALUES (?, ?, ?, ?, ?)',
            [user.id, cat.name, cat.color, cat.icon, cat.description]
          );
        }
        console.log(`Seeded default categories for user ${user.id}`);
      }
    }
  } catch (err) {
    console.error('Failed to seed defaults for existing users:', err);
  }
}

export async function initializeDatabase(): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const verbose = sqlite3.verbose();
    db = new verbose.Database(DATABASE_PATH, async (err) => {
      if (err) {
        console.error('Failed to connect to SQLite database:', err.message);
        return reject(err);
      }

      console.log(`Connected to SQLite database at ${DATABASE_PATH}`);

      try {
        await runSQL(db, 'PRAGMA journal_mode = WAL');
        await runSQL(db, 'PRAGMA foreign_keys = ON');

        for (const sql of CREATE_TABLES_SQL) {
          await runSQL(db, sql);
        }

        console.log('All 13 database tables initialized successfully');

        await seedDefaultsForExistingUsers();

        resolve(db);
      } catch (initErr) {
        console.error('Failed to initialize database tables:', initErr);
        reject(initErr);
      }
    });
  });
}

export function getDatabase(): sqlite3.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export function closeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }
    db.close((err) => {
      if (err) reject(err);
      else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
}

/** Promise wrapper for db.get */
export function dbGet<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    getDatabase().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}

/** Promise wrapper for db.all */
export function dbAll<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    getDatabase().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

/** Promise wrapper for db.run — returns { lastID, changes } */
export function dbRun(
  sql: string,
  params: unknown[] = []
): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    getDatabase().run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}
