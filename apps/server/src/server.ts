import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initRedis } from './config/redis.js';
import { initSocket } from './socket/index.js';
import { registerSubscribers } from './events/subscribers.js';
import { startJobs, stopJobs } from './jobs/index.js';

async function bootstrap() {
  await connectDatabase();
  await initRedis();

  const app = createApp();
  const httpServer = createServer(app);

    initSocket(httpServer);
  registerSubscribers();
  startJobs();

  httpServer.listen(env.port, env.host, () => {
    logger.info(`API ready -> http://localhost:${env.port}${'/api/' + env.apiVersion}`);
    logger.info(`Health   -> http://localhost:${env.port}/health`);
    logger.info(`Env: ${env.nodeEnv}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    stopJobs();
    httpServer.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => logger.error(`Unhandled rejection: ${String(reason)}`));
  process.on('uncaughtException', (err: NodeJS.ErrnoException) => {
            if (err.code === 'EPIPE') return;
    logger.error(`Uncaught exception: ${err.stack ?? err.message}`);
    void shutdown('uncaughtException');
  });
}

bootstrap().catch((err) => {
  logger.error(`Failed to start server: ${err instanceof Error ? err.stack : String(err)}`);
  process.exit(1);
});
