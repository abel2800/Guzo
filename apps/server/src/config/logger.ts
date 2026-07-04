import path from 'node:path';
import fs from 'node:fs';
import winston from 'winston';
import { env } from './env.js';

const logDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) => {
    return `${ts} ${level}: ${stack ?? message}`;
  }),
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

// Rotation caps so a crash loop (e.g. broken pipe) can never fill the disk.
// Each file is capped at 10 MB and we keep 5 rotated copies (~50 MB per stream).
const MAX_LOG_SIZE = 10 * 1024 * 1024;
const MAX_LOG_FILES = 5;

export const logger = winston.createLogger({
  level: env.logLevel,
  format: env.isProd ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console({ handleExceptions: false }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: MAX_LOG_SIZE,
      maxFiles: MAX_LOG_FILES,
      tailable: true,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: MAX_LOG_SIZE,
      maxFiles: MAX_LOG_FILES,
      tailable: true,
    }),
  ],
  exitOnError: false,
});

// A closed terminal makes stdout/stderr emit EPIPE. Swallow it here so it does
// not bubble into uncaughtException and trigger a recursive logging loop.
for (const stream of [process.stdout, process.stderr]) {
  stream.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EPIPE') return;
  });
}

/** Morgan writes its formatted line into Winston via this stream. */
export const morganStream = {
  write: (message: string) => logger.http?.(message.trim()) ?? logger.info(message.trim()),
};
