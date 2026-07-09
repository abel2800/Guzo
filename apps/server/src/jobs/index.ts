import { logger } from '../config/logger.js';

type Job = { name: string; everyMs: number; run: () => Promise<void> | void };

const jobs: Job[] = [
    {
    name: 'cleanup-expired-tokens',
    everyMs: 60 * 60 * 1000,
    run: async () => {
      const { prisma } = await import('../config/database.js');
      const result = await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      if (result.count > 0) logger.info(`cleaned ${result.count} expired refresh tokens`);
    },
  },
];

const timers: NodeJS.Timeout[] = [];

export function startJobs(): void {
  for (const job of jobs) {
    const timer = setInterval(() => {
      Promise.resolve(job.run()).catch((err) => logger.error(`job ${job.name} failed: ${String(err)}`));
    }, job.everyMs);
    timers.push(timer);
    logger.debug(`job scheduled: ${job.name} every ${job.everyMs}ms`);
  }
}

export function stopJobs(): void {
  timers.forEach(clearInterval);
}
