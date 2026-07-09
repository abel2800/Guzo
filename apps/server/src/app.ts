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

export function createApp(): Application {
  const app = express();

    app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

    app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    }),
  );

    app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(compression());
  app.use(requestContext);

    app.use(morgan(env.isProd ? 'combined' : 'dev', { stream: morganStream }));

      app.use('/static', express.static(path.resolve(process.cwd(), env.storage.uploadDir)));

    app.get('/health', (_req: Request, res: Response) =>
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }),
  );

    app.use(API_PREFIX, globalRateLimiter, apiRoutes);

    app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
