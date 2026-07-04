import { prisma } from '@delivery/database';
import { logger } from './logger.js';

export { prisma };

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('PostgreSQL connected via Prisma');
  } catch (err) {
    logger.error(`Failed to connect to database: ${String(err)}`);
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('PostgreSQL disconnected');
}
