import { PrismaClient } from '@prisma/client';

/**
 * Single shared Prisma client.
 *
 * In development Next.js / nodemon hot-reload can create many clients and
 * exhaust DB connections, so we cache the instance on `globalThis`.
 *
 * When you later move to microservices, each service simply imports this
 * package (or its own copy) - the contract does not change.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

// Re-export everything from the generated client so consumers have a single
// dependency: `import { prisma, OrderStatus, Prisma } from '@delivery/database'`.
export * from '@prisma/client';
