import type { D1Database } from '@cloudflare/workers-types';

let d1: D1Database | null = null;

export function setD1Database(database: D1Database): void {
  d1 = database;
}

export async function initializeD1Database(): Promise<void> {
  if (!d1) {
    throw new Error('D1 database binding is not configured.');
  }
  await d1.prepare('PRAGMA foreign_keys = ON').run();
}

export async function d1Get<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | undefined> {
  if (!d1) throw new Error('D1 database not configured.');
  const row = await d1
    .prepare(sql)
    .bind(...params)
    .first<T>();
  return row ?? undefined;
}

export async function d1All<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  if (!d1) throw new Error('D1 database not configured.');
  const { results } = await d1
    .prepare(sql)
    .bind(...params)
    .all<T>();
  return results ?? [];
}

export async function d1Run(
  sql: string,
  params: unknown[] = []
): Promise<{ lastID: number; changes: number }> {
  if (!d1) throw new Error('D1 database not configured.');
  const result = await d1
    .prepare(sql)
    .bind(...params)
    .run();
  return {
    lastID: Number(result.meta.last_row_id ?? 0),
    changes: Number(result.meta.changes ?? 0),
  };
}
