import path from 'node:path';
import sqlite3 from 'sqlite3';
import { DEFAULT_TAGS, DEFAULT_CATEGORIES } from '@productivity-app/shared';
import { SCHEMA_STATEMENTS } from './schema';

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

async function seedDefaultsForExistingUsers(): Promise<void> {
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
    }
  }
}

export async function initializeSqliteDatabase(): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const verbose = sqlite3.verbose();
    db = new verbose.Database(DATABASE_PATH, async (err) => {
      if (err) {
        return reject(err);
      }

      try {
        await runSQL(db, 'PRAGMA journal_mode = WAL');
        await runSQL(db, 'PRAGMA foreign_keys = ON');

        for (const sql of SCHEMA_STATEMENTS) {
          await runSQL(db, sql);
        }

        await seedDefaultsForExistingUsers();
        resolve(db);
      } catch (initErr) {
        reject(initErr);
      }
    });
  });
}

export function getSqliteDatabase(): sqlite3.Database {
  if (!db) {
    throw new Error('SQLite database not initialized.');
  }
  return db;
}

export function closeSqliteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function sqliteGet<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    getSqliteDatabase().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}

export function sqliteAll<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    getSqliteDatabase().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

export function sqliteRun(
  sql: string,
  params: unknown[] = []
): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    getSqliteDatabase().run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Local aliases used during sqlite init seeding
const dbGet = sqliteGet;
const dbAll = sqliteAll;
const dbRun = sqliteRun;
