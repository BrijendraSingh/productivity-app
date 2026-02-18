import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import path from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import { APP_CONFIG, API_ENDPOINTS } from '@productivity-app/shared';
import { initializeDatabase, closeDatabase } from './config/database';
import authRoutes from './routes/auth';
import todoRoutes from './routes/todos';
import categoryRoutes from './routes/categories';
import tagRoutes from './routes/tags';
import diaryRoutes from './routes/diary';
import bulletRoutes from './routes/bullet';
import blogRoutes from './routes/blog';
import analyticsRoutes from './routes/analytics';

const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function startServer(): Promise<void> {
  await initializeDatabase();

  const app = express();

  // 1. Helmet — security headers
  app.use(helmet());

  // 2. CORS — allow frontend origin
  app.use(
    cors({
      origin: ['http://localhost:3000', FRONTEND_URL],
      credentials: true,
    }),
  );

  // 3. Rate limiting — production only (100 requests per 15 min window)
  if (NODE_ENV === 'production') {
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

    app.use(
      rateLimit({
        windowMs,
        max: maxRequests,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          message: 'Too many requests. Please try again later.',
        },
      }),
    );
  }

  // 4. JSON body parser (10 MB limit)
  app.use(express.json({ limit: '10mb' }));

  // 5. Compression
  app.use(compression());

  // 6. Morgan — HTTP request logging
  app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

  // 7. Custom request logger (timing)
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (NODE_ENV === 'development') {
        console.log(
          `[${req.method}] ${req.originalUrl} → ${res.statusCode} (${duration}ms)`,
        );
      }
    });
    next();
  });

  // ─── System routes ────────────────────────────────────────────────────────

  // GET /health
  app.get(API_ENDPOINTS.HEALTH, (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
      },
    });
  });

  // GET /api — API root info
  app.get(API_ENDPOINTS.API_ROOT, (_req, res) => {
    res.json({
      success: true,
      data: {
        message: `Welcome to the ${APP_CONFIG.APP_NAME} API`,
        version: APP_CONFIG.APP_VERSION,
        endpoints: {
          health: 'GET /health',
          auth: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            logout: 'POST /api/auth/logout',
            verify: 'GET /api/auth/verify',
            profile: 'GET /api/auth/profile',
          },
          todos: 'GET|POST /api/todos, GET|PUT|DELETE /api/todos/:id',
          categories: 'GET|POST /api/categories, GET|PUT|DELETE /api/categories/:id',
          tags: 'GET|POST /api/tags, GET|PUT|DELETE /api/tags/:id, GET /api/tags/:id/todos',
          diary: 'GET /api/diary, GET|PUT|DELETE /api/diary/:date',
          bullet: 'GET|PUT /api/bullet/logs, GET|POST /api/bullet/events, PATCH /api/bullet/todos/:id/symbol',
          blog: 'GET|POST /api/blog, GET|PUT|DELETE /api/blog/:id, PATCH /api/blog/:id/publish',
          analytics: 'GET /api/analytics/dashboard|matrix|trends|writing|diary',
        },
      },
    });
  });

  // ─── API routes ───────────────────────────────────────────────────────────

  app.use('/api/auth', authRoutes);
  app.use('/api/todos', todoRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/tags', tagRoutes);
  app.use('/api/diary', diaryRoutes);
  app.use('/api/bullet', bulletRoutes);
  app.use('/api/blog', blogRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // ─── Production SPA serving ──────────────────────────────────────────────

  if (NODE_ENV === 'production') {
    const publicDir = path.join(__dirname, 'public');
    app.use(express.static(publicDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/health') {
        return next();
      }
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  }

  // ─── 404 handler ──────────────────────────────────────────────────────────

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found.',
    });
  });

  // ─── Global error handler ────────────────────────────────────────────────

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error('Unhandled error:', err);

      const errObj = err as unknown as Record<string, unknown>;
      const statusCode = typeof errObj.statusCode === 'number' ? errObj.statusCode : 500;

      res.status(statusCode).json({
        success: false,
        message:
          NODE_ENV === 'production'
            ? 'Internal server error.'
            : err.message || 'Internal server error.',
      });
    },
  );

  // ─── Start listening ─────────────────────────────────────────────────────

  const server = app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║  ${APP_CONFIG.APP_NAME} — Backend Server                    ║
║  Environment: ${NODE_ENV.padEnd(40)}║
║  Port:        ${String(PORT).padEnd(40)}║
║  Health:      http://localhost:${PORT}/health${' '.repeat(20)}║
║  API Root:    http://localhost:${PORT}/api${' '.repeat(23)}║
╚══════════════════════════════════════════════════════════╝
`);
  });

  // Graceful shutdown
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
