type DbGet = <T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
) => Promise<T | undefined>;
type DbAll = <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T[]>;
type DbRun = (sql: string, params?: unknown[]) => Promise<{ lastID: number; changes: number }>;
type InitDb = () => Promise<unknown>;
type CloseDb = () => Promise<void>;

let dbGetImpl: DbGet;
let dbAllImpl: DbAll;
let dbRunImpl: DbRun;
let initImpl: InitDb;
let closeImpl: CloseDb;
let d1Mode = false;

export function configureD1Api(impl: {
  initialize: InitDb;
  dbGet: DbGet;
  dbAll: DbAll;
  dbRun: DbRun;
  close?: CloseDb;
}): void {
  initImpl = impl.initialize;
  dbGetImpl = impl.dbGet;
  dbAllImpl = impl.dbAll;
  dbRunImpl = impl.dbRun;
  closeImpl = impl.close ?? (async () => undefined);
  d1Mode = true;
}

export function configureSqliteApi(impl: {
  initialize: InitDb;
  dbGet: DbGet;
  dbAll: DbAll;
  dbRun: DbRun;
  close: CloseDb;
}): void {
  initImpl = impl.initialize;
  dbGetImpl = impl.dbGet;
  dbAllImpl = impl.dbAll;
  dbRunImpl = impl.dbRun;
  closeImpl = impl.close;
  d1Mode = false;
}

export function useD1(): boolean {
  return d1Mode;
}

export async function initializeDatabase(): Promise<unknown> {
  return initImpl();
}

export async function closeDatabase(): Promise<void> {
  return closeImpl();
}

export async function dbGet<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | undefined> {
  return dbGetImpl(sql, params);
}

export async function dbAll<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  return dbAllImpl(sql, params);
}

export async function dbRun(
  sql: string,
  params: unknown[] = []
): Promise<{ lastID: number; changes: number }> {
  return dbRunImpl(sql, params);
}
