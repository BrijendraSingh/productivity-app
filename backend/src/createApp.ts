import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import { APP_CONFIG, API_ENDPOINTS } from '@productivity-app/shared';
import { AppError } from './utils/AppError';
import authRoutes from './routes/auth';
import todoRoutes from './routes/todos';
import categoryRoutes from './routes/categories';
import tagRoutes from './routes/tags';
import diaryRoutes from './routes/diary';
import bulletRoutes from './routes/bullet';
import blogRoutes from './routes/blog';
import blogCategoryRoutes from './routes/blogCategories';
import writingSessionRoutes from './routes/writingSessions';
import analyticsRoutes from './routes/analytics';

export type AppRuntime = 'node' | 'worker';

export interface CreateAppOptions {
  runtime: AppRuntime;
  nodeEnv?: string;
  frontendUrl?: string;
}

export function createApp(options: CreateAppOptions): express.Application {
  const nodeEnv = options.nodeEnv ?? 'development';
  const frontendUrl = options.frontendUrl ?? 'http://localhost:3000';
  const isProduction = nodeEnv === 'production';
  const isWorker = options.runtime === 'worker';

  const app = express();

  if (isProduction) {
    app.set('trust proxy', 1);
  }

  app.use(
    helmet({
      contentSecurityPolicy:
        isProduction && !isWorker
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                imgSrc: ["'self'", 'data:', 'blob:'],
                connectSrc: ["'self'"],
              },
            }
          : false,
    })
  );

  app.use(
    cors({
      origin: isWorker ? true : ['http://localhost:3000', frontendUrl],
      credentials: true,
    })
  );

  if (isProduction && !isWorker) {
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
    const authMaxRequests = parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '10', 10);

    const rateLimitMessage = {
      success: false,
      message: 'Too many requests. Please try again later.',
    };

    const authLimiter = rateLimit({
      windowMs,
      max: authMaxRequests,
      standardHeaders: true,
      legacyHeaders: false,
      message: rateLimitMessage,
    });

    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);

    app.use(
      rateLimit({
        windowMs,
        max: maxRequests,
        standardHeaders: true,
        legacyHeaders: false,
        message: rateLimitMessage,
      })
    );
  }

  if (isWorker) {
    app.use((req, res, next) => {
      if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'DELETE') {
        req.body = req.body ?? {};
        return next();
      }

      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        const contentType = req.headers['content-type'] ?? '';
        if (raw && contentType.includes('application/json')) {
          try {
            req.body = JSON.parse(raw);
          } catch {
            res.status(400).json({ success: false, message: 'Invalid JSON body.' });
            return;
          }
        } else {
          req.body = {};
        }
        next();
      });
      req.on('error', next);
    });
  } else {
    app.use(express.json({ limit: '10mb' }));
    app.use(compression());
    app.use(morgan(isProduction ? 'combined' : 'dev'));
  }

  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      if (!isProduction) {
        const duration = Date.now() - start;
        console.log(`[${req.method}] ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  app.get(API_ENDPOINTS.HEALTH, (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: nodeEnv,
        runtime: options.runtime,
      },
    });
  });

  app.get(API_ENDPOINTS.API_ROOT, (_req, res) => {
    res.json({
      success: true,
      data: {
        message: `Welcome to the ${APP_CONFIG.APP_NAME} API`,
        version: APP_CONFIG.APP_VERSION,
        runtime: options.runtime,
      },
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/todos', todoRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/tags', tagRoutes);
  app.use('/api/diary', diaryRoutes);
  app.use('/api/bullet', bulletRoutes);
  app.use('/api/blog', blogRoutes);
  app.use('/api/blog-categories', blogCategoryRoutes);
  app.use('/api/writing-sessions', writingSessionRoutes);
  app.use('/api/analytics', analyticsRoutes);

  if (isProduction && !isWorker) {
    const publicDir = path.join(__dirname, 'public');
    app.use(express.static(publicDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/health') {
        return next();
      }
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  }

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found.',
    });
  });

  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
          code: err.code,
        });
      }

      if (err.message?.includes('UNIQUE constraint failed')) {
        return res.status(409).json({
          success: false,
          message: 'Resource already exists.',
          code: 'CONFLICT',
        });
      }

      console.error('Unhandled error:', err);

      const errObj = err as unknown as Record<string, unknown>;
      const statusCode = typeof errObj.statusCode === 'number' ? errObj.statusCode : 500;

      res.status(statusCode).json({
        success: false,
        message: isProduction ? 'Internal server error.' : err.message || 'Internal server error.',
      });
    }
  );

  return app;
}
