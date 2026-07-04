import path from 'node:path';
import express, { type Application, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env.js';
import { morganStream } from './config/logger.js';
import { API_PREFIX } from './constants/index.js';
import apiRoutes from './routes/index.js';
import { requestContext } from './middlewares/requestContext.middleware.js';
import { globalRateLimiter } from './middlewares/rateLimit.middleware.js';
import { notFoundMiddleware } from './middlewares/notFound.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

/**
 * Builds the Express application (no listening here, so it stays testable).
 * Middleware order IS the request pipeline - see docs/REQUEST_LIFECYCLE.md.
 */
export function createApp(): Application {
  const app = express();

  // 1) Security headers
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // 2) CORS
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    }),
  );

  // 3) Body parsing + compression + request id
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(compression());
  app.use(requestContext);

  // 4) HTTP request logging -> Winston
  app.use(morgan(env.isProd ? 'combined' : 'dev', { stream: morganStream }));

  // 5) Static file serving for locally-stored uploads.
  //    Swapping to S3/MinIO later just removes this line.
  app.use('/static', express.static(path.resolve(process.cwd(), env.storage.uploadDir)));

  // 6) Health checks (no auth, no rate limit)
  app.get('/health', (_req: Request, res: Response) =>
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }),
  );

  // 7) Rate limit + API routes
  app.use(API_PREFIX, globalRateLimiter, apiRoutes);

  // 8) 404 + centralized error handler (must be last)
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
