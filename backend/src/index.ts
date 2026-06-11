import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { configureSqliteApi, initializeDatabase, closeDatabase } from './config/database.api';
import * as sqlite from './config/database.sqlite';
import { createApp } from './createApp';
import { validateProductionConfig } from './config/security';

const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

configureSqliteApi({
  initialize: sqlite.initializeSqliteDatabase,
  dbGet: sqlite.sqliteGet,
  dbAll: sqlite.sqliteAll,
  dbRun: sqlite.sqliteRun,
  close: sqlite.closeSqliteDatabase,
});

async function startServer(): Promise<void> {
  validateProductionConfig();
  await initializeDatabase();

  const app = createApp({
    runtime: 'node',
    nodeEnv: NODE_ENV,
    frontendUrl: FRONTEND_URL,
  });

  const server = app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║  Productivity App — Backend Server                       ║
║  Environment: ${NODE_ENV.padEnd(40)}║
║  Port:        ${String(PORT).padEnd(40)}║
║  Health:      http://localhost:${PORT}/health${' '.repeat(20)}║
║  API Root:    http://localhost:${PORT}/api${' '.repeat(23)}║
╚══════════════════════════════════════════════════════════╝
`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await closeDatabase();
      console.log('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
