import { configureD1Api, initializeDatabase } from '../../backend/src/config/database.api';
import {
  setD1Database,
  initializeD1Database,
  d1Get,
  d1All,
  d1Run,
} from '../../backend/src/config/database.d1';
import { createHonoApp } from './hono-app';
import type { Hono } from 'hono';

let honoApp: Hono | null = null;

async function getApp(env: Env): Promise<Hono> {
  if (honoApp) {
    return honoApp;
  }

  process.env.ALLOW_REGISTRATION = env.ALLOW_REGISTRATION ?? 'true';
  setD1Database(env.DB);
  configureD1Api({
    initialize: initializeD1Database,
    dbGet: d1Get,
    dbAll: d1All,
    dbRun: d1Run,
  });
  await initializeDatabase();
  honoApp = createHonoApp('production');
  return honoApp;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const app = await getApp(env);
    return app.fetch(request, env);
  },
};
